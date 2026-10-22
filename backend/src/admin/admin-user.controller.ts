import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedAdmin } from '../auth/auth.service.js';
import { CurrentAdmin } from '../auth/current-admin.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { type AdminUserView, AdminUserService } from './admin-user.service.js';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto/admin-user.dto.js';

/** Back-office login management — ADMIN only. */
@Controller('api/admin/users')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(['ADMIN'])
export class AdminUserController {
  constructor(private readonly users: AdminUserService) {}

  @Get()
  list(): Promise<AdminUserView[]> {
    return this.users.list();
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto): Promise<{ id: string }> {
    return this.users.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<{ ok: true }> {
    await this.users.update(id, dto);
    return { ok: true };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<{ ok: true }> {
    await this.users.remove(id, admin.id);
    return { ok: true };
  }
}
