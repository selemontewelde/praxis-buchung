import { type Provider } from '@nestjs/common';
import { Pool } from 'pg';

/**
 * DI token for the shared Postgres connection pool.
 *
 * This is a deliberately thin, temporary way to talk to the database: the
 * `/health` check only needs to run `SELECT 1`. From milestone 2 Prisma becomes
 * the real data-access layer and this pool (and the custom DB indicator) will be
 * replaced by Terminus' `PrismaHealthIndicator`.
 */
export const PG_POOL = 'PG_POOL';

export const pgPoolProvider: Provider = {
  provide: PG_POOL,
  useFactory: (): Pool =>
    new Pool({
      connectionString: process.env.DATABASE_URL,
      // Fail fast when the database is unreachable so /health reports "down"
      // quickly instead of hanging the request.
      connectionTimeoutMillis: 3000,
    }),
};
