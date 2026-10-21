import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  type ReassignApplyResult,
  AdminReassignService,
  type ReassignPreviewEntry,
} from './admin-reassign.service.js';
import { ReassignApplyDto, ReassignPreviewDto } from './dto/reassign.dto.js';

/**
 * Reassign a departing therapist's future appointments. Preview computes the
 * plan (with soft warnings) and changes nothing; apply commits the admin's
 * decided assignments. Requires a valid admin session.
 */
@Controller('api/admin/therapists')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(['ADMIN'])
export class AdminReassignController {
  constructor(private readonly reassign: AdminReassignService) {}

  @Post(':id/reassign-future/preview')
  preview(
    @Param('id') id: string,
    @Body() dto: ReassignPreviewDto,
  ): Promise<ReassignPreviewEntry[]> {
    return this.reassign.preview(id, dto.targetTherapistIds);
  }

  @Post(':id/reassign-future')
  apply(
    @Param('id') id: string,
    @Body() dto: ReassignApplyDto,
  ): Promise<ReassignApplyResult> {
    return this.reassign.apply(id, dto.assignments);
  }
}
