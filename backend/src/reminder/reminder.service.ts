import { Injectable, Logger } from '@nestjs/common';
import { practiceConfig } from '@praxis-buchung/config';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Sends the "appointment tomorrow" reminder. Idempotent: each appointment is
 * claimed atomically (updateMany where reminderSentAt IS NULL) before the email,
 * so overlapping scheduler ticks or restarts never send a duplicate. Mail is
 * best-effort — a send failure is logged, not retried, since a claimed row is
 * already marked.
 */
@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async sendDueReminders(now = new Date()): Promise<number> {
    const windowEnd = new Date(
      now.getTime() + practiceConfig.booking.reminderHoursBefore * 3_600_000,
    );
    const due = await this.prisma.appointment.findMany({
      where: {
        status: 'BOOKED',
        reminderSentAt: null,
        startAt: { gt: now, lte: windowEnd },
      },
      include: { service: true, therapist: true },
    });

    let sent = 0;
    for (const appointment of due) {
      const { count } = await this.prisma.appointment.updateMany({
        where: { id: appointment.id, reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      if (count === 0) {
        continue; // already claimed by a concurrent tick
      }
      try {
        await this.mail.sendReminder({
          to: appointment.patientEmail,
          patientName: appointment.patientName,
          serviceName: appointment.service.name,
          therapistName: `${appointment.therapist.firstName} ${appointment.therapist.lastName}`,
          startAt: appointment.startAt,
        });
        sent += 1;
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for appointment ${appointment.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
    return sent;
  }
}
