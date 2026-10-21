import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import type { AuthenticatedAdmin } from '../auth/auth.service.js';
import { CurrentAdmin } from '../auth/current-admin.decorator.js';
import { assertCanActOnTherapist } from '../auth/ownership.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { AdminHoursService, type HoursWindow } from './admin-hours.service.js';
import { SetWindowsDto } from './dto/hours.dto.js';

@Controller('api/admin')
@UseGuards(SessionAuthGuard, RolesGuard)
export class AdminHoursController {
  constructor(private readonly hours: AdminHoursService) {}

  @Get('opening-hours')
  getOpening(): Promise<HoursWindow[]> {
    return this.hours.getOpening();
  }

  // Practice-wide opening hours are an ADMIN concern.
  @Put('opening-hours')
  @Roles(['ADMIN'])
  async setOpening(@Body() dto: SetWindowsDto): Promise<{ ok: true }> {
    await this.hours.setOpening(dto.windows);
    return { ok: true };
  }

  @Get('therapists/:id/working-hours')
  getWorking(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<HoursWindow[]> {
    assertCanActOnTherapist(admin, id);
    return this.hours.getWorking(id);
  }

  @Put('therapists/:id/working-hours')
  async setWorking(
    @Param('id') id: string,
    @Body() dto: SetWindowsDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<{ ok: true }> {
    assertCanActOnTherapist(admin, id);
    await this.hours.setWorking(id, dto.windows);
    return { ok: true };
  }
}
