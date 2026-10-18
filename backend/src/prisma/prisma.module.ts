import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Provides the shared `PrismaService` application-wide.
 *
 * Marked `@Global()` so feature modules can inject `PrismaService` without each
 * importing `PrismaModule` — the data-access layer is a cross-cutting singleton,
 * so the convenience outweighs the usual "prefer explicit imports" rule here.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
