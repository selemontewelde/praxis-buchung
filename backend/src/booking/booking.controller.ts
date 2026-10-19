import { Body, Controller, Post } from '@nestjs/common';
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
