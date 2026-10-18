import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The application's single Prisma client, exposed as an injectable NestJS service.
 *
 * It extends the generated `PrismaClient` so every model API (`prisma.therapist`,
 * `prisma.appointment`, …) is available directly on the injected instance.
 *
 * Prisma 7 no longer runs a separate Rust query-engine process: the client talks
 * to Postgres through a JS **driver adapter**. We use `@prisma/adapter-pg` (backed
 * by node-postgres) and build it from `DATABASE_URL` at construction time.
 *
 * The two lifecycle hooks tie the DB connection to Nest's lifecycle:
 *   - `onModuleInit` opens the connection when the module starts, so the first
 *     request doesn't pay the connect cost (and failures surface at boot).
 *   - `onModuleDestroy` closes it on shutdown; combined with
 *     `app.enableShutdownHooks()` in main.ts this runs on SIGINT/SIGTERM too, so
 *     containers stop cleanly without leaking connections.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
