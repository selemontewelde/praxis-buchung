import { describe, expect, it, vi } from 'vitest';
import type { MailService } from '../mail/mail.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ReminderService } from './reminder.service.js';

const NOW = new Date('2026-06-19T10:00:00.000Z');

function appointment(id: string) {
  return {
    id,
    patientEmail: `${id}@example.com`,
    patientName: 'Pat',
    startAt: new Date('2026-06-20T08:00:00.000Z'),
    service: { name: 'Physiotherapie' },
    therapist: { firstName: 'Anna', lastName: 'Keller' },
  };
}

function makeDeps(due: ReturnType<typeof appointment>[], claim: { count: number } = { count: 1 }) {
  const sendReminder = vi.fn().mockResolvedValue(undefined);
  const updateMany = vi.fn().mockResolvedValue(claim);
  const prisma = {
    appointment: {
      findMany: vi.fn().mockResolvedValue(due),
      updateMany,
    },
  } as unknown as PrismaService;
  const mail = { sendReminder } as unknown as MailService;
  return { prisma, mail, sendReminder, updateMany };
}

describe('ReminderService.sendDueReminders', () => {
  it('sends a reminder for each due appointment and claims it', async () => {
    const { prisma, mail, sendReminder, updateMany } = makeDeps([
      appointment('a'),
      appointment('b'),
    ]);

    const sent = await new ReminderService(prisma, mail).sendDueReminders(NOW);

    expect(sent).toBe(2);
    expect(sendReminder).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ reminderSentAt: null }),
        data: expect.objectContaining({ reminderSentAt: NOW }),
      }),
    );
  });

  it('does not send when the row was already claimed (idempotent)', async () => {
    const { prisma, mail, sendReminder } = makeDeps([appointment('a')], {
      count: 0,
    });

    const sent = await new ReminderService(prisma, mail).sendDueReminders(NOW);

    expect(sent).toBe(0);
    expect(sendReminder).not.toHaveBeenCalled();
  });

  it('does nothing when no appointments are due', async () => {
    const { prisma, mail, sendReminder } = makeDeps([]);
    expect(await new ReminderService(prisma, mail).sendDueReminders(NOW)).toBe(0);
    expect(sendReminder).not.toHaveBeenCalled();
  });
});
