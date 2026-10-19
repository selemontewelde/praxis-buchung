import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminServiceService } from './admin-service.service.js';

describe('AdminServiceService', () => {
  it('creates a service', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'svc-1' });
    const prisma = { service: { create } } as unknown as PrismaService;

    expect(
      await new AdminServiceService(prisma).create({
        name: 'Massage',
        durationMin: 20,
      }),
    ).toEqual({ id: 'svc-1' });
    expect(create.mock.calls[0][0].data).toMatchObject({
      name: 'Massage',
      durationMin: 20,
    });
  });

  it('archives a service by setting active=false', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      service: {
        findUnique: vi.fn().mockResolvedValue({ id: 'svc-1' }),
        update,
      },
    } as unknown as PrismaService;

    await new AdminServiceService(prisma).update('svc-1', { active: false });
    expect(update.mock.calls[0][0].data).toEqual({ active: false });
  });

  it('updates only the provided fields and clears a blank description to null', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      service: {
        findUnique: vi.fn().mockResolvedValue({ id: 'svc-1' }),
        update,
      },
    } as unknown as PrismaService;

    await new AdminServiceService(prisma).update('svc-1', {
      name: 'New',
      descriptionDe: '',
    });
    // durationMin / descriptionEn / active are untouched; blank DE → null.
    expect(update.mock.calls[0][0].data).toEqual({
      name: 'New',
      descriptionDe: null,
    });
  });

  it('rejects updating an unknown service with 404', async () => {
    const prisma = {
      service: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
    } as unknown as PrismaService;
    await expect(
      new AdminServiceService(prisma).update('ghost', { name: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
