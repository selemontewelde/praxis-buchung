import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

export interface BookingResponse {
  id: string;
  startAt: string;
  endAt: string;
  status: 'BOOKED';
}

/** POST /api/public/bookings — create an appointment from a chosen slot. */
@Controller('api/public')
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  // Tight limit: booking is expensive (slot re-check, DB write, email) and a
  // prime target for spam. Five attempts per minute per client is plenty.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('bookings')
  async create(@Body() dto: CreateBookingDto): Promise<BookingResponse> {
    const appointment = await this.booking.create({
      serviceId: dto.serviceId,
      therapistId: dto.therapistId,
      startAt: dto.startAt,
      patient: dto.patient,
      consent: { policyVersion: dto.consent.policyVersion },
    });
    return {
      id: appointment.id,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: 'BOOKED',
    };
  }
}
