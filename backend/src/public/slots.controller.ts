import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  SlotService,
  type TherapistSlots,
} from '../slots/slot.service.js';
import { GetSlotsQueryDto } from './dto/get-slots.query.js';

/**
 * GET /api/public/slots — free appointment slots for a service (and optionally a
 * single therapist) over a local date range. Format is validated by the global
 * ValidationPipe; this controller adds the semantic checks (real dates, ordering)
 * and delegates the actual computation to the slot engine.
 */
@Controller('api/public')
export class PublicSlotsController {
  constructor(private readonly slots: SlotService) {}

  @Get('slots')
  async getSlots(@Query() query: GetSlotsQueryDto): Promise<TherapistSlots[]> {
    const { serviceId, therapistId, from, to } = query;

    if (!DateTime.fromISO(from).isValid) {
      throw new BadRequestException(`from is not a valid date: ${from}`);
    }
    if (!DateTime.fromISO(to).isValid) {
      throw new BadRequestException(`to is not a valid date: ${to}`);
    }
    if (to < from) {
      throw new BadRequestException('to must not be before from');
    }

    return this.slots.getAvailableSlots({
      serviceId,
      therapistId,
      fromDate: from,
      toDate: to,
    });
  }
}
