import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database-health.indicator.js';

/**
 * GET /health — liveness/readiness endpoint.
 *
 * Returns 200 with `{ status: "ok", info: { database: { status: "up" } } }`
 * when every indicator is up, and 503 when any is down. Used by humans, by the
 * Docker Compose stack, and later by the reverse proxy / deployment checks.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.database.isHealthy('database')]);
  }
}
