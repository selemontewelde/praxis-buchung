import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SlotService } from '../slots/slot.service.js';
import type { MailService } from '../mail/mail.service.js';
import { BookingService, type CreateBookingInput } from './booking.service.js';

const SLOT_ISO = '2026-06-15T06:00:00.000Z';

function input(over: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    serviceId: 'physio',
    therapistId: 'anna',
    startAt: SLOT_ISO,
    patient: { name: 'Pat', email: 'pat@example.com', phone: '+41 00 000 00 00' },
    consent: { policyVersion: '2025-01' },
    ...over,
  };
}

function makeDeps(opts: {
  service?: { durationMin: number } | null;
  offeredSlots?: string[];
  txThrows?: unknown;
}) {
  const appointmentCreate = vi.fn().mockResolvedValue({
    id: 'appt-1',
    startAt: new Date(SLOT_ISO),
    endAt: new Date('2026-06-15T06:30:00.000Z'),
  });
  const consentCreate = vi.fn().mockResolvedValue({});
  const prisma = {
    service: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          opts.service === undefined ? { durationMin: 30 } : opts.service,
        ),
    },
    $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => unknown) => {
      if (opts.txThrows !== undefined) {
        throw opts.txThrows;
      }
      return cb({
        appointment: { create: appointmentCreate },
        consentRecord: { create: consentCreate },
      });
    }),
  } as unknown as PrismaService;

  const slots = {
    getAvailableSlots: vi.fn().mockResolvedValue([
      { therapistId: 'anna', firstName: 'Anna', lastName: 'K', slots: opts.offeredSlots ?? [SLOT_ISO] },
    ]),
  } as unknown as SlotService;

  const mail = {
    sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  } as unknown as MailService;

  return { prisma, slots, mail, appointmentCreate, consentCreate };
}

describe('BookingService.create', () => {
  it('creates the appointment and the consent record for an offered slot', async () => {
    const { prisma, slots, mail, appointmentCreate, consentCreate } = makeDeps({});
    const result = await new BookingService(prisma, slots, mail).create(input());

    expect(result.id).toBe('appt-1');
    expect(appointmentCreate).toHaveBeenCalledOnce();
    expect(consentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: 'appt-1',
          policyVersion: '2025-01',
        }),
      }),
    );
  });

  it('rejects a start that is not an offered slot', async () => {
    const { prisma, slots, mail } = makeDeps({ offeredSlots: [] });
    await expect(new BookingService(prisma, slots, mail).create(input())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an unknown service', async () => {
    const { prisma, slots, mail } = makeDeps({ service: null });
    await expect(new BookingService(prisma, slots, mail).create(input())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps a database overlap violation to a conflict', async () => {
    const { prisma, slots, mail } = makeDeps({
      txThrows: new Error(
        'insert violates exclusion constraint "appointment_no_overlap"',
      ),
    });
    await expect(new BookingService(prisma, slots, mail).create(input())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
