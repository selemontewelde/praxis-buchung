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

  // A fixed argon2 hash to verify against when the email is unknown, memoized so
  // the cost is paid once. argon2's default params here match those used for real
  // passwords, so a verify against it costs the same — login does equal work
  // whether or not the email exists, closing a user-enumeration timing leak (#133).
  private dummyHashPromise: Promise<string> | null = null;
  private dummyHash(): Promise<string> {
    // Drop the memo on rejection so a transient failure to compute the dummy hash
    // doesn't poison every later login with the same cached rejection.
    this.dummyHashPromise ??= hash('user-enumeration-timing-guard').catch(
      (err: unknown) => {
        this.dummyHashPromise = null;
        throw err;
      },
    );
    return this.dummyHashPromise;
  }

  async login(
    email: string,
    password: string,
    now = new Date(),
  ): Promise<SessionResult> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    // Always verify — against the real hash, or a dummy when the email is unknown
    // — so response time can't distinguish a known from an unknown email (#133).
    const passwordHash = admin?.passwordHash ?? (await this.dummyHash());
    const ok = await verify(passwordHash, password);
    if (admin === null || !ok) {
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
