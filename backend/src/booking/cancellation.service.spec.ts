import { GoneException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { MailService } from '../mail/mail.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CancellationService } from './cancellation.service.js';

const START = new Date('2026-06-20T10:00:00.000Z');
// Config cancellationDeadlineHours = 24, so the deadline is 2026-06-19T10:00Z.
const BEFORE_DEADLINE = new Date('2026-06-18T10:00:00.000Z');
const AFTER_DEADLINE = new Date('2026-06-20T09:30:00.000Z');

function makeDeps(appointment: Record<string, unknown> | null) {
  const updateMany = vi.fn().mockResolvedValue({ count: 1 });
  const prisma = {
    appointment: {
      findUnique: vi.fn().mockResolvedValue(appointment),
      updateMany,
    },
  } as unknown as PrismaService;
  const sendCancellation = vi.fn().mockResolvedValue(undefined);
  const mail = {
    sendCancellationConfirmation: sendCancellation,
  } as unknown as MailService;
  return { prisma, mail, updateMany, sendCancellation };
}

function booked(over: Record<string, unknown> = {}) {
  return {
    id: 'appt-1',
    status: 'BOOKED',
    startAt: START,
    patientEmail: 'pat@example.com',
    patientName: 'Pat',
    service: { name: 'Physiotherapie' },
    therapist: { firstName: 'Anna', lastName: 'Keller' },
    ...over,
  };
}

describe('CancellationService', () => {
  it('reports cancellable before the deadline', async () => {
    const { prisma, mail } = makeDeps(booked());
    const view = await new CancellationService(prisma, mail).view(
      'tok',
      BEFORE_DEADLINE,
    );
    expect(view.cancellable).toBe(true);
    expect(view.therapistName).toBe('Anna Keller');
  });

  it('reports not cancellable after the deadline', async () => {
    const { prisma, mail } = makeDeps(booked());
    const view = await new CancellationService(prisma, mail).view(
      'tok',
      AFTER_DEADLINE,
    );
    expect(view.cancellable).toBe(false);
  });

  it('cancels before the deadline, freeing the slot and sending mail', async () => {
    const { prisma, mail, updateMany, sendCancellation } = makeDeps(booked());
    await new CancellationService(prisma, mail).cancel('tok', BEFORE_DEADLINE);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'BOOKED' }),
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
    expect(sendCancellation).toHaveBeenCalledOnce();
  });

  it('refuses to cancel after the deadline', async () => {
    const { prisma, mail, updateMany } = makeDeps(booked());
    await expect(
      new CancellationService(prisma, mail).cancel('tok', AFTER_DEADLINE),
    ).rejects.toBeInstanceOf(GoneException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('is idempotent for an already-cancelled appointment', async () => {
    const { prisma, mail, updateMany } = makeDeps(booked({ status: 'CANCELLED' }));
    await new CancellationService(prisma, mail).cancel('tok', BEFORE_DEADLINE);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('rejects an unknown token', async () => {
    const { prisma, mail } = makeDeps(null);
    await expect(
      new CancellationService(prisma, mail).view('nope'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
