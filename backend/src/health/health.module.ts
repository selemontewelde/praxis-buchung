import { Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { Pool } from 'pg';
import { HealthController } from './health.controller.js';
import { DatabaseHealthIndicator } from './database-health.indicator.js';
import { PG_POOL, pgPoolProvider } from './pg-pool.provider.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [pgPoolProvider, DatabaseHealthIndicator],
})
export class HealthModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // Close the pool on shutdown so the process can exit cleanly.
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
