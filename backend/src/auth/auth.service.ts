import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service.js';

/** Name of the HTTP-only session cookie. */
export const SESSION_COOKIE = 'admin_session';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Only the SHA-256 of the session token is stored; the raw token lives in the
 * cookie. A database read (leak, backup, pg_dump) then can't be replayed as a
 * live session.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface SessionResult {
  token: string;
  expiresAt: Date;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: 'ADMIN' | 'THERAPIST';
  /** The therapist this login manages (set for a THERAPIST, null for an ADMIN). */
  therapistId: string | null;
}

/**
 * Admin authentication with argon2 password verification and server-side
 * sessions. A session is a random token row in the DB referenced by an HTTP-only
 * cookie; logout deletes the row, so sessions are revocable.
 */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(
    email: string,
    password: string,
    now = new Date(),
  ): Promise<SessionResult> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    // Verify even on a missing user would need a dummy hash to fully avoid timing
    // leaks; for a single-practice admin the simple check is acceptable.
    if (admin === null || !(await verify(admin.passwordHash, password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await this.prisma.session.create({
      data: { token: hashToken(token), adminUserId: admin.id, expiresAt },
    });
    return { token, expiresAt };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }

  /**
   * Change the caller's own password after verifying the current one. Revokes the
   * user's OTHER sessions (keeps the current one, identified by its token) so a
   * password change invalidates any other logged-in device.
   */
  async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentToken: string,
  ): Promise<void> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (user === null || !(await verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await hash(newPassword);
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.prisma.session.deleteMany({
      where: { adminUserId: userId, NOT: { token: hashToken(currentToken) } },
    });
  }

  async validate(
    token: string,
    now = new Date(),
  ): Promise<AuthenticatedAdmin | null> {
    const hashed = hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { token: hashed },
      include: { adminUser: true },
    });
    if (session === null) {
      return null;
    }
    if (session.expiresAt.getTime() <= now.getTime()) {
      await this.prisma.session.deleteMany({ where: { token: hashed } });
      return null;
    }
    return {
      id: session.adminUser.id,
      email: session.adminUser.email,
      role: session.adminUser.role,
      therapistId: session.adminUser.therapistId,
    };
  }
}
