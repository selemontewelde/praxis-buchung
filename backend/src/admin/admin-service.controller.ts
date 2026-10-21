import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type AdminServiceView,
  AdminServiceService,
} from './admin-service.service.js';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto.js';

/** Service management — ADMIN only. */
@Controller('api/admin/services')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(['ADMIN'])
export class AdminServiceController {
  constructor(private readonly services: AdminServiceService) {}

  @Get()
  list(): Promise<AdminServiceView[]> {
    return this.services.list();
  }

  @Post()
  create(@Body() dto: CreateServiceDto): Promise<{ id: string }> {
    return this.services.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<{ ok: true }> {
    await this.services.update(id, dto);
    return { ok: true };
  }
}
