import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import type { Role } from '../auth/roles.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { userShapeProblem } from './admin-user-rules.js';
import type {
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto/admin-user.dto.js';

export interface AdminUserView {
  id: string;
  email: string;
  role: Role;
  therapistId: string | null;
  therapistName: string | null;
}

/**
 * ADMIN management of back-office logins. Deactivation is deletion (the login's
 * sessions cascade away); the invariants mirror the config validation but are
 * enforced at runtime: unique email, a THERAPIST links exactly one therapist (one
 * login per therapist), and at least one ADMIN always remains.
 */
@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminUserView[]> {
    const users = await this.prisma.adminUser.findMany({
      include: { therapist: true },
      orderBy: { email: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      therapistId: u.therapistId,
      therapistName:
        u.therapist !== null
          ? `${u.therapist.firstName} ${u.therapist.lastName}`
          : null,
    }));
  }

  async create(dto: CreateAdminUserDto): Promise<{ id: string }> {
    const therapistId = dto.role === 'ADMIN' ? null : (dto.therapistId ?? null);
    await this.assertShapeAndLinks(dto.role, therapistId, null);
    await this.assertEmailFree(dto.email, null);
    const passwordHash = await hash(dto.password);
    const user = await this.prisma.adminUser.create({
      data: { email: dto.email, passwordHash, role: dto.role, therapistId },
    });
    return { id: user.id };
  }

  async update(id: string, dto: UpdateAdminUserDto): Promise<void> {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (user === null) {
      throw new NotFoundException(`Unknown user: ${id}`);
    }

    const newRole: Role = dto.role ?? user.role;
    let newTherapistId =
      dto.therapistId !== undefined ? dto.therapistId : user.therapistId;
    if (newRole === 'ADMIN') {
      newTherapistId = null; // an ADMIN never carries a therapist link
    }

    // Removing the last ADMIN (by demotion) would lock everyone out.
    if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
      await this.assertNotLastAdmin();
    }
    await this.assertShapeAndLinks(newRole, newTherapistId, id);
    if (dto.email !== undefined && dto.email !== user.email) {
      await this.assertEmailFree(dto.email, id);
    }

    await this.prisma.adminUser.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        role: newRole,
        therapistId: newTherapistId,
      },
    });
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own login');
    }
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (user === null) {
      throw new NotFoundException(`Unknown user: ${id}`);
    }
    if (user.role === 'ADMIN') {
      await this.assertNotLastAdmin();
    }
    // Sessions cascade on delete (schema onDelete: Cascade).
    await this.prisma.adminUser.delete({ where: { id } });
  }

  /** Shape (role↔therapist) plus the therapist exists and isn't already linked. */
  private async assertShapeAndLinks(
    role: Role,
    therapistId: string | null,
    selfId: string | null,
  ): Promise<void> {
    const problem = userShapeProblem(role, therapistId);
    if (problem !== null) {
      throw new BadRequestException(problem);
    }
    if (therapistId !== null) {
      const therapist = await this.prisma.therapist.findUnique({
        where: { id: therapistId },
      });
      if (therapist === null) {
        throw new BadRequestException(`Unknown therapist: ${therapistId}`);
      }
      const linked = await this.prisma.adminUser.findUnique({
        where: { therapistId },
      });
      if (linked !== null && linked.id !== selfId) {
        throw new ConflictException(
          `Therapist ${therapistId} already has a login`,
        );
      }
    }
  }

  private async assertEmailFree(
    email: string,
    selfId: string | null,
  ): Promise<void> {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email },
    });
    if (existing !== null && existing.id !== selfId) {
      throw new ConflictException(`Email already in use: ${email}`);
    }
  }

  private async assertNotLastAdmin(): Promise<void> {
    // Count-then-mutate is not serialised, so two admins concurrently
    // deleting/demoting each other could in theory both pass and leave zero
    // admins. Accepted for a single-practice back office (a tiny, rate-limited
    // admin surface); a serializable transaction would close it if it ever
    // mattered.
    const admins = await this.prisma.adminUser.count({
      where: { role: 'ADMIN' },
    });
    if (admins <= 1) {
      throw new BadRequestException('At least one admin must remain');
    }
  }
}
