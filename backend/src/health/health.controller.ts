import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  type HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * GET /health — liveness/readiness endpoint.
 *
 * Returns 200 with `{ status: "ok", info: { database: { status: "up" } } }`
 * when every indicator is up, and 503 when any is down. Used by humans, by the
 * Docker Compose stack, and later by the reverse proxy / deployment checks.
 *
 * The database check uses Terminus' `PrismaHealthIndicator`, which pings through
 * the same `PrismaService` the app uses — so /health reflects the real data-access
 * connection rather than a second, separate one.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma).withTimeout(3000),
    ]);
  }
}
