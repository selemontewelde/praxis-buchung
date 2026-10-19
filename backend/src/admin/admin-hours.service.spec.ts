import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminHoursService, type HoursWindow } from './admin-hours.service.js';

function prismaWith(opening: HoursWindow[]) {
  const openingDelete = vi.fn().mockResolvedValue({});
  const openingCreate = vi.fn().mockResolvedValue({});
  const workingDelete = vi.fn().mockResolvedValue({});
  const workingCreate = vi.fn().mockResolvedValue({});
  const prisma = {
    therapist: { findUnique: vi.fn().mockResolvedValue({ id: 'anna' }) },
    openingHours: {
      findMany: vi.fn().mockResolvedValue(opening),
      deleteMany: openingDelete,
      createMany: openingCreate,
    },
    workingHours: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: workingDelete,
      createMany: workingCreate,
    },
    $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({
        openingHours: { deleteMany: openingDelete, createMany: openingCreate },
        workingHours: { deleteMany: workingDelete, createMany: workingCreate },
      }),
    ),
  } as unknown as PrismaService;
  return { prisma, openingCreate, workingCreate };
}

const MON_OPEN: HoursWindow[] = [{ weekday: 'MONDAY', startMin: 480, endMin: 720 }];

describe('AdminHoursService', () => {
  it('replaces opening hours (delete + create)', async () => {
    const { prisma, openingCreate } = prismaWith([]);
    await new AdminHoursService(prisma).setOpening(MON_OPEN);
    expect(openingCreate).toHaveBeenCalledWith({ data: MON_OPEN });
  });

  it('rejects a window that ends before it starts', async () => {
    const { prisma } = prismaWith([]);
    await expect(
      new AdminHoursService(prisma).setOpening([
        { weekday: 'MONDAY', startMin: 600, endMin: 600 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate windows (would violate the unique constraint)', async () => {
    const { prisma } = prismaWith([]);
    await expect(
      new AdminHoursService(prisma).setOpening([
        { weekday: 'MONDAY', startMin: 480, endMin: 720 },
        { weekday: 'MONDAY', startMin: 480, endMin: 720 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts working hours inside the opening hours', async () => {
    const { prisma, workingCreate } = prismaWith(MON_OPEN);
    await new AdminHoursService(prisma).setWorking('anna', [
      { weekday: 'MONDAY', startMin: 480, endMin: 600 },
    ]);
    expect(workingCreate).toHaveBeenCalledWith({
      data: [{ therapistId: 'anna', weekday: 'MONDAY', startMin: 480, endMin: 600 }],
    });
  });

  it('rejects working hours outside the opening hours', async () => {
    const { prisma } = prismaWith(MON_OPEN);
    await expect(
      new AdminHoursService(prisma).setWorking('anna', [
        { weekday: 'MONDAY', startMin: 480, endMin: 780 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
