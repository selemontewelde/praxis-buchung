import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('@node-rs/argon2', () => ({ verify }));

const { AuthService } = await import('./auth.service.js');
type PrismaLike = ConstructorParameters<typeof AuthService>[0];

function makePrisma(over: {
  admin?: { id: string; passwordHash: string } | null;
  session?: unknown;
}) {
  const create = vi.fn().mockResolvedValue({});
  const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const findSession = vi.fn().mockResolvedValue(over.session ?? null);
  const prisma = {
    adminUser: {
      findUnique: vi
        .fn()
        .mockResolvedValue(over.admin === undefined ? null : over.admin),
    },
    session: { create, findUnique: findSession, deleteMany },
  } as unknown as PrismaLike;
  return { prisma, create, deleteMany };
}

describe('AuthService', () => {
  const NOW = new Date('2026-06-15T10:00:00.000Z');

  it('creates a session on valid credentials', async () => {
    verify.mockResolvedValue(true);
    const { prisma, create } = makePrisma({
      admin: { id: 'admin-1', passwordHash: 'hash' },
    });
    const result = await new AuthService(prisma).login('a@b.c', 'pw', NOW);

    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ adminUserId: 'admin-1' }),
      }),
    );
  });

  it('rejects a wrong password', async () => {
    verify.mockResolvedValue(false);
    const { prisma } = makePrisma({
      admin: { id: 'admin-1', passwordHash: 'hash' },
    });
    await expect(
      new AuthService(prisma).login('a@b.c', 'wrong', NOW),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an unknown email without checking a hash', async () => {
    verify.mockClear();
    const { prisma } = makePrisma({ admin: null });
    await expect(
      new AuthService(prisma).login('nobody@b.c', 'pw', NOW),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('validates a live session and rejects an expired one', async () => {
    const live = makePrisma({
      session: {
        expiresAt: new Date('2026-06-16T10:00:00.000Z'),
        adminUser: { id: 'admin-1', email: 'a@b.c' },
      },
    });
    expect(await new AuthService(live.prisma).validate('tok', NOW)).toEqual({
      id: 'admin-1',
      email: 'a@b.c',
    });

    const expired = makePrisma({
      session: {
        expiresAt: new Date('2026-06-14T10:00:00.000Z'),
        adminUser: { id: 'admin-1', email: 'a@b.c' },
      },
    });
    expect(await new AuthService(expired.prisma).validate('tok', NOW)).toBeNull();
    expect(expired.deleteMany).toHaveBeenCalled();
  });

  it('logout deletes the session', async () => {
    const { prisma, deleteMany } = makePrisma({});
    await new AuthService(prisma).logout('tok');
    // The stored token is a SHA-256 hash of the cookie value, not the raw token.
    expect(deleteMany).toHaveBeenCalledWith({
      where: { token: expect.stringMatching(/^[0-9a-f]{64}$/) },
    });
    expect(deleteMany).not.toHaveBeenCalledWith({ where: { token: 'tok' } });
  });
});
