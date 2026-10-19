import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminBlockService } from './admin-block.service.js';

const dto = {
  therapistId: 'anna',
  reason: 'VACATION' as const,
  startAt: '2026-07-10T00:00:00.000Z',
  endAt: '2026-07-17T00:00:00.000Z',
};

describe('AdminBlockService', () => {
  it('creates a block for a known therapist', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'block-1' });
    const prisma = {
      therapist: { findUnique: vi.fn().mockResolvedValue({ id: 'anna' }) },
      block: { create },
    } as unknown as PrismaService;

    expect(await new AdminBlockService(prisma).create(dto)).toEqual({
      id: 'block-1',
    });
    expect(create.mock.calls[0][0].data.reason).toBe('VACATION');
  });

  it('rejects a block whose end is not after its start', async () => {
    const prisma = {
      therapist: { findUnique: vi.fn() },
      block: { create: vi.fn() },
    } as unknown as PrismaService;
    await expect(
      new AdminBlockService(prisma).create({
        ...dto,
        endAt: dto.startAt,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a block for an unknown therapist', async () => {
    const prisma = {
      therapist: { findUnique: vi.fn().mockResolvedValue(null) },
      block: { create: vi.fn() },
    } as unknown as PrismaService;
    await expect(
      new AdminBlockService(prisma).create(dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a block, 404 when it does not exist', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = { block: { deleteMany } } as unknown as PrismaService;
    await new AdminBlockService(prisma).remove('block-1');
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'block-1' } });

    const missing = {
      block: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    } as unknown as PrismaService;
    await expect(
      new AdminBlockService(missing).remove('ghost'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
