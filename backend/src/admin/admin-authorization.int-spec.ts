import { NotFoundException } from '@nestjs/common';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AuthenticatedAdmin } from '../auth/auth.service.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminAppointmentController } from './admin-appointment.controller.js';
import { AdminAppointmentService } from './admin-appointment.service.js';

/**
 * Proves per-therapist authorization against a real Postgres: a THERAPIST user
 * sees and cancels only their own appointments; an ADMIN is unrestricted. The
 * controller methods receive the principal the guards would attach, so the
 * ownership filtering + service restriction are exercised through the DB.
 * Requires DATABASE_URL and the seeded demo practice; runs via `npm run test:int`.
 */
const hasDb = Boolean(process.env.DATABASE_URL);
const TEST_EMAIL = 'authz-test@example.com';

const adminPrincipal: AuthenticatedAdmin = {
  id: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  therapistId: null,
};
const annaPrincipal: AuthenticatedAdmin = {
  id: 'anna-user',
  email: 'anna@example.com',
  role: 'THERAPIST',
  therapistId: 'anna',
};

describe.skipIf(!hasDb)('Admin authorization (real Postgres)', () => {
  let prisma: PrismaService;
  let controller: AdminAppointmentController;

  beforeAll(() => {
    prisma = new PrismaService();
    controller = new AdminAppointmentController(
      new AdminAppointmentService(prisma, new MailService()),
    );
  });

  afterEach(async () => {
    await prisma.appointment.deleteMany({
      where: { patientEmail: TEST_EMAIL },
    });
  });

  async function createAppointment(therapistId: string): Promise<string> {
    const start = new Date(Date.now() + 3 * 24 * 60 * 60_000);
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

  it('scopes a THERAPIST list to their own appointments', async () => {
    await createAppointment('anna');
    await createAppointment('ben');

    const forAnna = await controller.list(annaPrincipal, 'upcoming');
    expect(forAnna.every((a) => a.therapistId === 'anna')).toBe(true);
    expect(forAnna.some((a) => a.therapistId === 'ben')).toBe(false);

    const forAdmin = await controller.list(adminPrincipal, 'upcoming');
    const emails = forAdmin.filter((a) => a.patientEmail === TEST_EMAIL);
    expect(emails.some((a) => a.therapistId === 'ben')).toBe(true);
  });

  it("forbids a THERAPIST cancelling another therapist's appointment", async () => {
    const bensId = await createAppointment('ben');

    await expect(
      controller.cancel(bensId, annaPrincipal),
    ).rejects.toBeInstanceOf(NotFoundException);
    const still = await prisma.appointment.findUnique({
      where: { id: bensId },
    });
    expect(still?.status).toBe('BOOKED');

    // An ADMIN can cancel it.
    await controller.cancel(bensId, adminPrincipal);
    const after = await prisma.appointment.findUnique({
      where: { id: bensId },
    });
    expect(after?.status).toBe('CANCELLED');
  });
});
