import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedAdmin } from '../auth/auth.service.js';
import { CurrentAdmin } from '../auth/current-admin.decorator.js';
import {
  assertCanActOnTherapist,
  effectiveTherapistFilter,
  restrictToOwnTherapist,
} from '../auth/ownership.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type AdminBlockView,
  AdminBlockService,
} from './admin-block.service.js';
import { CreateBlockDto } from './dto/block.dto.js';

/**
 * Therapist blocks (absences). An ADMIN manages everyone's; a THERAPIST only
 * their own (list scoped, create/delete restricted to their therapist).
 */
@Controller('api/admin/blocks')
@UseGuards(SessionAuthGuard)
export class AdminBlockController {
  constructor(private readonly blocks: AdminBlockService) {}

  @Get()
  list(@CurrentAdmin() admin: AuthenticatedAdmin): Promise<AdminBlockView[]> {
    return this.blocks.list(effectiveTherapistFilter(admin, undefined));
  }

  @Post()
  create(
    @Body() dto: CreateBlockDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<{ id: string }> {
    assertCanActOnTherapist(admin, dto.therapistId);
    return this.blocks.create(dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ): Promise<{ ok: true }> {
    await this.blocks.remove(id, restrictToOwnTherapist(admin));
    return { ok: true };
  }
}
