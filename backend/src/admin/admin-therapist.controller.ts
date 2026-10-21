import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type AdminTherapistView,
  AdminTherapistService,
} from './admin-therapist.service.js';
import {
  CreateTherapistDto,
  SetCapabilitiesDto,
  UpdateTherapistDto,
} from './dto/therapist.dto.js';

/** Team management — ADMIN only (a therapist cannot manage the team). */
@Controller('api/admin/therapists')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(['ADMIN'])
export class AdminTherapistController {
  constructor(private readonly therapists: AdminTherapistService) {}

  @Get()
  list(): Promise<AdminTherapistView[]> {
    return this.therapists.list();
  }

  @Post()
  create(@Body() dto: CreateTherapistDto): Promise<{ id: string }> {
    return this.therapists.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTherapistDto,
  ): Promise<{ ok: true }> {
    await this.therapists.update(id, dto);
    return { ok: true };
  }

  @Put(':id/capabilities')
  async setCapabilities(
    @Param('id') id: string,
    @Body() dto: SetCapabilitiesDto,
  ): Promise<{ ok: true }> {
    await this.therapists.setCapabilities(id, dto.serviceIds);
    return { ok: true };
  }
}
