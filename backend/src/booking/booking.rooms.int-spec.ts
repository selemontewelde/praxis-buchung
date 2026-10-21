import { ConflictException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SlotService } from '../slots/slot.service.js';
import { BookingService } from './booking.service.js';

/**
 * Proves the room resource axis against a real Postgres: a room-requiring service
 * ("mtt", which both therapists can deliver but which shares one Geräteraum)
 * cannot be booked twice for the same time even by different therapists, and the
 * room conflict removes the slot from the other therapist's availability. Requires
 * DATABASE_URL and the seeded demo practice; runs via `npm run test:int`.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const TEST_EMAIL = 'rooms-test@example.com';
const ZONE = 'Europe/Zurich';
const ROOM_SERVICE = 'mtt';

describe.skipIf(!hasDb)('Bookable rooms (real Postgres)', () => {
  let prisma: PrismaService;
  let booking: BookingService;
  let slots: SlotService;

  beforeAll(async () => {
    prisma = new PrismaService();
    slots = new SlotService(prisma);
    booking = new BookingService(prisma, slots, new MailService());
    await prisma.appointment.deleteMany({
      where: { patientEmail: TEST_EMAIL },
    });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: { patientEmail: TEST_EMAIL },
    });
    await prisma.$disconnect();
  });

  it('blocks the shared room across therapists for a room-requiring service', async () => {
    const now = new Date();
    const from = DateTime.fromJSDate(now, { zone: ZONE }).toISODate();
    const to = DateTime.fromJSDate(now, { zone: ZONE })
      .plus({ days: 10 })
      .toISODate();
    expect(from).not.toBeNull();
    expect(to).not.toBeNull();

    // A slot both therapists offer for the room service (same shared room).
    const offered = await slots.getAvailableSlots({
      serviceId: ROOM_SERVICE,
      fromDate: from as string,
      toDate: to as string,
      now,
    });
    const anna = offered.find((t) => t.therapistId === 'anna')?.slots ?? [];
    const ben = offered.find((t) => t.therapistId === 'ben')?.slots ?? [];
    const sharedSlot = anna.find((s) => ben.includes(s));
    expect(
      sharedSlot,
      'expected a slot both therapists offer for the room service',
    ).toBeDefined();

    // Anna books it, occupying the Geräteraum.
    const annaBooking = await booking.create(
      {
        serviceId: ROOM_SERVICE,
        therapistId: 'anna',
        startAt: sharedSlot as string,
        patient: { name: 'Pat', email: TEST_EMAIL, phone: '+41 00 000 00 00' },
        consent: { policyVersion: '2025-01' },
      },
      now,
    );
    expect(annaBooking.id).toBeDefined();

    // Ben can no longer book the same time: the room is taken, even though it is
    // a different therapist. It must fail cleanly as a 409, not a 500.
    await expect(
      booking.create(
        {
          serviceId: ROOM_SERVICE,
          therapistId: 'ben',
          startAt: sharedSlot as string,
          patient: {
            name: 'Pat2',
            email: TEST_EMAIL,
            phone: '+41 00 000 00 00',
          },
          consent: { policyVersion: '2025-01' },
        },
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    // And the room conflict has removed that slot from ben's availability.
    const afterOffered = await slots.getAvailableSlots({
      serviceId: ROOM_SERVICE,
      therapistId: 'ben',
      fromDate: from as string,
      toDate: to as string,
      now,
    });
    const benAfter =
      afterOffered.find((t) => t.therapistId === 'ben')?.slots ?? [];
    expect(benAfter).not.toContain(sharedSlot);
  });
});
