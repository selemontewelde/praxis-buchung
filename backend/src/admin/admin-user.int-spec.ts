import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminUserService } from './admin-user.service.js';

/**
 * Proves the back-office login invariants against a real Postgres: unique email,
 * one login per therapist, the last ADMIN can't be removed, no self-delete, and
 * deleting a login cascades its sessions. Requires DATABASE_URL and the seeded
 * demo practice; runs via `npm run test:int`.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const TEST_PREFIX = 'user-mgmt-test+';

describe.skipIf(!hasDb)('Admin user management (real Postgres)', () => {
  let prisma: PrismaService;
  let service: AdminUserService;

  beforeAll(() => {
    prisma = new PrismaService();
    service = new AdminUserService(prisma);
  });

  afterEach(async () => {
    await prisma.adminUser.deleteMany({
      where: { email: { startsWith: TEST_PREFIX } },
    });
  });

  it('rejects a duplicate email', async () => {
    const email = `${TEST_PREFIX}dup@example.com`;
    await service.create({ email, password: 'password1', role: 'ADMIN' });
    await expect(
      service.create({ email, password: 'password2', role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects linking a therapist that already has a login', async () => {
    // The seed already gives 'anna' a THERAPIST login.
    await expect(
      service.create({
        email: `${TEST_PREFIX}anna2@example.com`,
        password: 'password1',
        role: 'THERAPIST',
        therapistId: 'anna',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to delete the last admin', async () => {
    const admins = await prisma.adminUser.findMany({
      where: { role: 'ADMIN' },
    });
    expect(admins.length).toBe(1); // the seeded admin
    await expect(
      service.remove(admins[0].id, 'someone-else'),
    ).rejects.toBeInstanceOf(BadRequestException);
    const still = await prisma.adminUser.findUnique({
      where: { id: admins[0].id },
    });
    expect(still).not.toBeNull();
  });

  it('refuses to demote the last admin', async () => {
    const admins = await prisma.adminUser.findMany({
      where: { role: 'ADMIN' },
    });
    expect(admins.length).toBe(1); // the seeded admin
    await expect(
      service.update(admins[0].id, { role: 'THERAPIST', therapistId: 'anna' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const still = await prisma.adminUser.findUnique({
      where: { id: admins[0].id },
    });
    expect(still?.role).toBe('ADMIN');
  });

  it('refuses a self-delete', async () => {
    const { id } = await service.create({
      email: `${TEST_PREFIX}self@example.com`,
      password: 'password1',
      role: 'ADMIN',
    });
    await expect(service.remove(id, id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deletes a login and cascades its sessions', async () => {
    const { id } = await service.create({
      email: `${TEST_PREFIX}temp@example.com`,
      password: 'password1',
      role: 'ADMIN',
    });
    await prisma.session.create({
      data: {
        token: `${TEST_PREFIX}token`,
        adminUserId: id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    // Deletable because the seeded admin keeps an ADMIN around.
    await service.remove(id, 'someone-else');

    expect(await prisma.adminUser.findUnique({ where: { id } })).toBeNull();
    expect(
      await prisma.session.findUnique({
        where: { token: `${TEST_PREFIX}token` },
      }),
    ).toBeNull();
  });
});
