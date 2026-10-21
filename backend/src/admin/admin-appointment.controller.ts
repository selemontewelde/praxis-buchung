import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdmin } from '../auth/auth.service.js';
import { CurrentAdmin } from '../auth/current-admin.decorator.js';
import {
  effectiveTherapistFilter,
  restrictToOwnTherapist,
} from '../auth/ownership.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type AdminAppointmentView,
  AdminAppointmentService,
} from './admin-appointment.service.js';

/**
 * Appointments. An ADMIN sees and cancels everyone's; a THERAPIST only their own
 * (list scoped to their therapist, cancel restricted to it).
 */
@Controller('api/admin/appointments')
@UseGuards(SessionAuthGuard)
export class AdminAppointmentController {
  constructor(private readonly appointments: AdminAppointmentService) {}

  @Get()
  list(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Query('when') when?: string,
    @Query('therapistId') therapistId?: string,
  ): Promise<AdminAppointmentView[]> {
    const scope = when === 'past' ? 'past' : 'upcoming';
    const requested =
      therapistId === undefined || therapistId === '' ? undefined : therapistId;
    return this.appointments.list(
      scope,
      effectiveTherapistFilter(admin, requested),
    );
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<{ status: 'CANCELLED' }> {
    await this.appointments.cancel(
      id,
      undefined,
      restrictToOwnTherapist(admin),
    );
    return { status: 'CANCELLED' };
  }
}
