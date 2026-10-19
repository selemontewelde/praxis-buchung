import { Module } from '@nestjs/common';
import { ReminderScheduler } from './reminder.scheduler.js';
import { ReminderService } from './reminder.service.js';

/** The scheduled 24h appointment reminder. */
@Module({
  providers: [ReminderService, ReminderScheduler],
})
export class ReminderModule {}
