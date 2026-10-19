import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderService } from './reminder.service.js';

/** Runs the reminder job periodically; appointments enter the window on a tick. */
@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(private readonly reminder: ReminderService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron(): Promise<void> {
    try {
      const sent = await this.reminder.sendDueReminders();
      if (sent > 0) {
        this.logger.log(`Sent ${sent} appointment reminder(s)`);
      }
    } catch (error) {
      this.logger.error(
        'Reminder job failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
