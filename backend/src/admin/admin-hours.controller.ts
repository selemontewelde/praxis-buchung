import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { AdminHoursService, type HoursWindow } from './admin-hours.service.js';
import { SetWindowsDto } from './dto/hours.dto.js';

@Controller('api/admin')
@UseGuards(SessionAuthGuard)
export class AdminHoursController {
  constructor(private readonly hours: AdminHoursService) {}

  @Get('opening-hours')
  getOpening(): Promise<HoursWindow[]> {
    return this.hours.getOpening();
  }

  @Put('opening-hours')
  async setOpening(@Body() dto: SetWindowsDto): Promise<{ ok: true }> {
    await this.hours.setOpening(dto.windows);
    return { ok: true };
  }

  @Get('therapists/:id/working-hours')
  getWorking(@Param('id') id: string): Promise<HoursWindow[]> {
    return this.hours.getWorking(id);
  }

  @Put('therapists/:id/working-hours')
  async setWorking(
    @Param('id') id: string,
    @Body() dto: SetWindowsDto,
  ): Promise<{ ok: true }> {
    await this.hours.setWorking(id, dto.windows);
    return { ok: true };
  }
}
