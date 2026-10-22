import { UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AdminUserService } from '../admin/admin-user.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

/**
 * Proves the password flows against a real Postgres: a self-service change
 * verifies the current password and revokes the user's OTHER sessions (keeping
 * the current one); a wrong current password is rejected; an ADMIN reset sets a
 * new password and revokes ALL of that user's sessions. Requires DATABASE_URL and
 * the seeded demo practice; runs via `npm run test:int`.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const TEST_PREFIX = 'password-test+';

describe.skipIf(!hasDb)('Password management (real Postgres)', () => {
  let prisma: PrismaService;
  let auth: AuthService;
  let users: AdminUserService;

  beforeAll(() => {
    prisma = new PrismaService();
    auth = new AuthService(prisma);
    users = new AdminUserService(prisma);
  });

  afterEach(async () => {
    await prisma.adminUser.deleteMany({
      where: { email: { startsWith: TEST_PREFIX } },
    });
  });

  async function makeUser(): Promise<{ id: string; email: string }> {
    const email = `${TEST_PREFIX}${Date.now()}@example.com`;
    const { id } = await users.create({
      email,
      password: 'oldpassword1',
      role: 'ADMIN',
    });
    return { id, email };
  }

  it('changes the own password, keeping the current session and revoking others', async () => {
    const { id, email } = await makeUser();
    const current = await auth.login(email, 'oldpassword1'); // the "current" session
    await auth.login(email, 'oldpassword1'); // a second, "other" session
    expect(await prisma.session.count({ where: { adminUserId: id } })).toBe(2);

    await auth.changeOwnPassword(
      id,
      'oldpassword1',
      'newpassword1',
      current.token,
    );

    // Only the current session survives, and it still validates.
    expect(await prisma.session.count({ where: { adminUserId: id } })).toBe(1);
    expect(await auth.validate(current.token)).not.toBeNull();
    // The new password works; the old one no longer does.
    await expect(auth.login(email, 'newpassword1')).resolves.toBeDefined();
    await expect(auth.login(email, 'oldpassword1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a change with the wrong current password', async () => {
    const { id, email } = await makeUser();
    const session = await auth.login(email, 'oldpassword1');
    await expect(
      auth.changeOwnPassword(
        id,
        'wrongpassword',
        'newpassword1',
        session.token,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // Unchanged: the old password still works.
    await expect(auth.login(email, 'oldpassword1')).resolves.toBeDefined();
  });

  it('lets an ADMIN reset a password and revokes all of that user’s sessions', async () => {
    const { id, email } = await makeUser();
    await auth.login(email, 'oldpassword1');
    await auth.login(email, 'oldpassword1');
    expect(await prisma.session.count({ where: { adminUserId: id } })).toBe(2);

    await users.resetPassword(id, 'resetpassword1');

    expect(await prisma.session.count({ where: { adminUserId: id } })).toBe(0);
    await expect(auth.login(email, 'resetpassword1')).resolves.toBeDefined();
    await expect(auth.login(email, 'oldpassword1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
