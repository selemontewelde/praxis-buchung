import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminReassignService } from './admin-reassign.service.js';

/**
 * Proves reassignment against a real Postgres: a departing therapist's future
 * appointment is previewed onto a capable colleague and actually moved, and a
 * colleague who is already busy at that time is reported as unassignable.
 * Requires DATABASE_URL and the seeded demo practice; runs via `npm run test:int`.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const TEST_EMAIL = 'reassign-test@example.com';

describe.skipIf(!hasDb)('Reassign departing therapist (real Postgres)', () => {
  let prisma: PrismaService;
  let reassign: AdminReassignService;

  beforeAll(() => {
    prisma = new PrismaService();
    reassign = new AdminReassignService(prisma);
  });

  afterEach(async () => {
    await prisma.appointment.deleteMany({
      where: { patientEmail: TEST_EMAIL },
    });
  });

  // Both 'anna' and 'ben' can deliver physiotherapy (seeded), which needs no room.
  async function createFutureAppointment(
    therapistId: string,
    start: Date,
  ): Promise<string> {
    const appt = await prisma.appointment.create({
      data: {
        therapistId,
        serviceId: 'physiotherapy',
        startAt: start,
        endAt: new Date(start.getTime() + 30 * 60_000),
        status: 'BOOKED',
        patientName: 'Pat',
        patientEmail: TEST_EMAIL,
        patientPhone: '+41 00 000 00 00',
      },
    });
    return appt.id;
  }

  it('previews a colleague and moves the appointment on apply', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 3 * 24 * 60 * 60_000);
    const appointmentId = await createFutureAppointment('ben', start);

    const preview = await reassign.preview('ben', ['anna'], now);
    const entry = preview.find((e) => e.appointmentId === appointmentId);
    expect(entry?.proposedTargetId).toBe('anna');

    const result = await reassign.apply(
      'ben',
      [{ appointmentId, targetTherapistId: 'anna' }],
      now,
    );
    expect(result.applied).toEqual([
      { appointmentId, targetTherapistId: 'anna' },
    ]);

    const moved = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    expect(moved?.therapistId).toBe('anna');
  });

  it('reports the appointment unassignable when the only candidate is busy', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 4 * 24 * 60 * 60_000);
    const appointmentId = await createFutureAppointment('ben', start);
    // Anna is already booked at the same time → she cannot take it.
    await createFutureAppointment('anna', start);

    const preview = await reassign.preview('ben', ['anna'], now);
    const entry = preview.find((e) => e.appointmentId === appointmentId);
    expect(entry?.proposedTargetId).toBeNull();
    expect(entry?.unassignableReason).toBe('ALL_CANDIDATES_BUSY');
  });
});
