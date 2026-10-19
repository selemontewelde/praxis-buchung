import { Module } from '@nestjs/common';
import { SlotsModule } from '../slots/slots.module.js';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';

/** Appointment creation (public booking). */
@Module({
  imports: [SlotsModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
