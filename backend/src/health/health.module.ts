import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

/**
 * Wires up the /health endpoint. `TerminusModule` supplies `HealthCheckService`
 * and the built-in indicators (including `PrismaHealthIndicator`). The shared
 * `PrismaService` is injected from the global `PrismaModule`, so there is nothing
 * to connect or tear down here.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
