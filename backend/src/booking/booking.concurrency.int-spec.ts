import { ConflictException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SlotService } from '../slots/slot.service.js';
import { BookingService } from './booking.service.js';

/**
 * Proves the double-booking guard against a real Postgres: two concurrent
 * bookings for the same slot, exactly one succeeds. Requires DATABASE_URL and the
 * seeded demo practice; runs via `npm run test:int` (skipped in the unit run).
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const TEST_EMAIL = 'concurrency-test@example.com';
const ZONE = 'Europe/Zurich';

describe.skipIf(!hasDb)('Booking concurrency (real Postgres)', () => {
  let prisma: PrismaService;
  let booking: BookingService;

  beforeAll(async () => {
    prisma = new PrismaService();
    booking = new BookingService(
      prisma,
      new SlotService(prisma),
      new MailService(),
    );
    await prisma.appointment.deleteMany({ where: { patientEmail: TEST_EMAIL } });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { patientEmail: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  it('lets exactly one of two concurrent bookings for the same slot win', async () => {
    const now = new Date();
    const from = DateTime.fromJSDate(now, { zone: ZONE }).toISODate();
    const to = DateTime.fromJSDate(now, { zone: ZONE })
      .plus({ days: 10 })
      .toISODate();
    expect(from).not.toBeNull();
    expect(to).not.toBeNull();

    const offered = await new SlotService(prisma).getAvailableSlots({
      serviceId: 'physiotherapy',
      therapistId: 'anna',
      fromDate: from as string,
      toDate: to as string,
      now,
    });
    const slot = offered.find((t) => t.therapistId === 'anna')?.slots[0];
    expect(slot, 'expected at least one free slot for anna').toBeDefined();

    const book = () =>
      booking.create(
        {
          serviceId: 'physiotherapy',
          therapistId: 'anna',
          startAt: slot as string,
          patient: { name: 'Pat', email: TEST_EMAIL, phone: '+41 00 000 00 00' },
          consent: { policyVersion: '2025-01' },
        },
        now,
      );

    const results = await Promise.allSettled([book(), book()]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    // The loser must fail cleanly as a 409 (either the re-validation found the
    // slot taken, or the DB overlap constraint fired and was mapped) — not a 500.
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      ConflictException,
    );

    // And the database holds exactly one booked appointment for that slot.
    const count = await prisma.appointment.count({
      where: {
        therapistId: 'anna',
        status: 'BOOKED',
        startAt: new Date(slot as string),
      },
    });
    expect(count).toBe(1);
  });
});
