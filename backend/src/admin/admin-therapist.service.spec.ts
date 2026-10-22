import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminTherapistService } from './admin-therapist.service.js';

describe('AdminTherapistService', () => {
  it('lists therapists with their capability service ids', async () => {
    const prisma = {
      therapist: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'anna',
            firstName: 'Anna',
            lastName: 'Keller',
            title: null,
            role: { de: 'r', en: 'r' },
            photoUrl: null,
            activeFrom: new Date('2024-01-01'),
            activeUntil: null,
            capabilities: [{ serviceId: 'physio' }, { serviceId: 'massage' }],
          },
        ]),
      },
    } as unknown as PrismaService;

    const [view] = await new AdminTherapistService(prisma).list();
    expect(view.capabilityServiceIds).toEqual(['physio', 'massage']);
    expect(view.activeUntil).toBeNull();
  });

  it('creates a therapist, mapping ISO dates and defaulting activeUntil to null', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'new-1' });
    const prisma = { therapist: { create } } as unknown as PrismaService;

    const result = await new AdminTherapistService(prisma).create({
      firstName: 'Ben',
      lastName: 'Moser',
      role: { de: 'Physiotherapeut', en: 'Physiotherapist' },
      activeFrom: '2026-01-01',
    });

    expect(result).toEqual({ id: 'new-1' });
    const data = create.mock.calls[0][0].data;
    expect(data.activeFrom).toEqual(new Date('2026-01-01'));
    expect(data.activeUntil).toBeNull();
  });

  it('deactivates by setting activeUntil, and re-activates with null', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      therapist: { update, findUnique: vi.fn().mockResolvedValue({ id: 'anna' }) },
    } as unknown as PrismaService;
    const service = new AdminTherapistService(prisma);

    await service.update('anna', { activeUntil: '2026-07-01' });
    expect(update.mock.calls[0][0].data.activeUntil).toEqual(
      new Date('2026-07-01'),
    );

    await service.update('anna', { activeUntil: null });
    expect(update.mock.calls[1][0].data.activeUntil).toBeNull();
  });

  it('replaces the capability set (delete then recreate)', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      therapist: { findUnique: vi.fn().mockResolvedValue({ id: 'anna' }) },
      service: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 'physio' }, { id: 'massage' }]),
      },
      $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => unknown) =>
        cb({ capability: { deleteMany, createMany } }),
      ),
    } as unknown as PrismaService;

    await new AdminTherapistService(prisma).setCapabilities('anna', [
      'physio',
      'massage',
    ]);

    expect(deleteMany).toHaveBeenCalledWith({ where: { therapistId: 'anna' } });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { therapistId: 'anna', serviceId: 'physio' },
        { therapistId: 'anna', serviceId: 'massage' },
      ],
    });
  });

  it('rejects an update for an unknown therapist with 404', async () => {
    const prisma = {
      therapist: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
    } as unknown as PrismaService;
    await expect(
      new AdminTherapistService(prisma).update('ghost', {
        role: { de: 'x', en: 'x' },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects capabilities referencing an unknown service with 400', async () => {
    const prisma = {
      therapist: { findUnique: vi.fn().mockResolvedValue({ id: 'anna' }) },
      service: { findMany: vi.fn().mockResolvedValue([{ id: 'physio' }]) },
    } as unknown as PrismaService;
    await expect(
      new AdminTherapistService(prisma).setCapabilities('anna', [
        'physio',
        'ghost',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
