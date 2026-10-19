import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  CancellationService,
  type CancellationView,
} from './cancellation.service.js';

/**
 * GET  /api/public/cancellations/:token — read the appointment + whether it can
 *   still be cancelled (drives the page / the "please call" fallback).
 * POST /api/public/cancellations/:token — perform the cancellation.
 */
@Controller('api/public/cancellations')
export class CancellationController {
  constructor(private readonly cancellation: CancellationService) {}

  @Get(':token')
  view(@Param('token') token: string): Promise<CancellationView> {
    return this.cancellation.view(token);
  }

  @Post(':token')
  async cancel(@Param('token') token: string): Promise<{ status: 'CANCELLED' }> {
    await this.cancellation.cancel(token);
    return { status: 'CANCELLED' };
  }
}
