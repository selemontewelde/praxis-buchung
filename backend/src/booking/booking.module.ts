import { Module } from '@nestjs/common';
import { SlotsModule } from '../slots/slots.module.js';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { CancellationController } from './cancellation.controller.js';
import { CancellationService } from './cancellation.service.js';

/** Appointment creation and self-service cancellation (public booking). */
@Module({
  imports: [SlotsModule],
  controllers: [BookingController, CancellationController],
  providers: [BookingService, CancellationService],
})
export class BookingModule {}
