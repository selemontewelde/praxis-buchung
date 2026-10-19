import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { MailService } from '../mail/mail.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminAppointmentService } from './admin-appointment.service.js';

const APPT = {
  id: 'a1',
  patientName: 'Max Muster',
  patientEmail: 'max@example.com',
  patientPhone: '+41 79 000 00 00',
  startAt: new Date('2026-07-01T08:00:00.000Z'),
  endAt: new Date('2026-07-01T08:30:00.000Z'),
  status: 'BOOKED' as const,
  therapistId: 'anna',
  service: { name: 'Massage' },
  therapist: { firstName: 'Anna', lastName: 'Keller' },
};

function makeMail() {
  return {
    sendCancellationConfirmation: vi.fn().mockResolvedValue(undefined),
  } as unknown as MailService & { sendCancellationConfirmation: ReturnType<typeof vi.fn> };
}

describe('AdminAppointmentService', () => {
  it('lists upcoming appointments (endAt >= now, ascending) with patient + therapist', async () => {
    const findMany = vi.fn().mockResolvedValue([APPT]);
    const prisma = { appointment: { findMany } } as unknown as PrismaService;
    const now = new Date('2026-06-01T00:00:00.000Z');

    const result = await new AdminAppointmentService(prisma, makeMail()).list(
      'upcoming',
      undefined,
      now,
    );

    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: { endAt: { gte: now } },
      orderBy: { startAt: 'asc' },
    });
    expect(result[0]).toMatchObject({
      patientName: 'Max Muster',
      serviceName: 'Massage',
      therapistName: 'Anna Keller',
      status: 'BOOKED',
    });
  });

  it('filters past appointments (endAt < now, descending) and by therapist', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { appointment: { findMany } } as unknown as PrismaService;
    const now = new Date('2026-06-01T00:00:00.000Z');

    await new AdminAppointmentService(prisma, makeMail()).list('past', 'anna', now);

    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: { endAt: { lt: now }, therapistId: 'anna' },
      orderBy: { startAt: 'desc' },
    });
  });

  it('cancels a booked appointment and emails the patient (no deadline for admins)', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      appointment: {
        // start only 10 minutes away — inside any patient deadline, still cancellable by admin
        findUnique: vi
          .fn()
          .mockResolvedValue({ ...APPT, startAt: new Date('2026-07-01T00:10:00.000Z') }),
        updateMany,
      },
    } as unknown as PrismaService;
    const mail = makeMail();

    await new AdminAppointmentService(prisma, mail).cancel(
      'a1',
      new Date('2026-07-01T00:00:00.000Z'),
    );

    expect(updateMany.mock.calls[0][0]).toMatchObject({
      where: { id: 'a1', status: 'BOOKED' },
      data: { status: 'CANCELLED' },
    });
    expect(mail.sendCancellationConfirmation).toHaveBeenCalledOnce();
  });

  it('sends no email when a concurrent cancel already won (count === 0)', async () => {
    const prisma = {
      appointment: {
        findUnique: vi.fn().mockResolvedValue(APPT),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaService;
    const mail = makeMail();

    await new AdminAppointmentService(prisma, mail).cancel('a1');

    expect(mail.sendCancellationConfirmation).not.toHaveBeenCalled();
  });

  it('does not throw when the cancellation email fails (best-effort)', async () => {
    const prisma = {
      appointment: {
        findUnique: vi.fn().mockResolvedValue(APPT),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as PrismaService;
    const mail = makeMail();
    mail.sendCancellationConfirmation.mockRejectedValue(new Error('smtp down'));

    await expect(
      new AdminAppointmentService(prisma, mail).cancel('a1'),
    ).resolves.toBeUndefined();
  });

  it('is idempotent for an already-cancelled appointment (no email)', async () => {
    const updateMany = vi.fn();
    const prisma = {
      appointment: {
        findUnique: vi.fn().mockResolvedValue({ ...APPT, status: 'CANCELLED' }),
        updateMany,
      },
    } as unknown as PrismaService;
    const mail = makeMail();

    await new AdminAppointmentService(prisma, mail).cancel('a1');

    expect(updateMany).not.toHaveBeenCalled();
    expect(mail.sendCancellationConfirmation).not.toHaveBeenCalled();
  });

  it('rejects cancelling an unknown appointment with 404', async () => {
    const prisma = {
      appointment: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    await expect(
      new AdminAppointmentService(prisma, makeMail()).cancel('ghost'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
