import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
  type HealthIndicatorResult,
} from '@nestjs/terminus';
import { Pool } from 'pg';
import { PG_POOL } from './pg-pool.provider.js';

/**
 * Reports whether the Postgres database is reachable.
 *
 * Uses Terminus' `HealthIndicatorService.attempt()`: the callback runs a trivial
 * `SELECT 1`; if it resolves the indicator is "up", if it throws (or exceeds the
 * timeout) it is "down". The overall /health response is 200 when up, 503 when down.
 */
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        await this.pool.query('SELECT 1');
      })
      .withTimeout(3000);
  }
}
