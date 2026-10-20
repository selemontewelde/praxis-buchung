import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type AdminAppointmentView,
  AdminAppointmentService,
} from './admin-appointment.service.js';

@Controller('api/admin/appointments')
@UseGuards(SessionAuthGuard)
export class AdminAppointmentController {
  constructor(private readonly appointments: AdminAppointmentService) {}

  @Get()
  list(
    @Query('when') when?: string,
    @Query('therapistId') therapistId?: string,
  ): Promise<AdminAppointmentView[]> {
    const scope = when === 'past' ? 'past' : 'upcoming';
    return this.appointments.list(
      scope,
      therapistId === undefined || therapistId === '' ? undefined : therapistId,
    );
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string): Promise<{ status: 'CANCELLED' }> {
    await this.appointments.cancel(id);
    return { status: 'CANCELLED' };
  }
}
