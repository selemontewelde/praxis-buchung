import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * In Prisma 7 the connection URL lives here instead of in the `datasource` block
 * of schema.prisma. Only the CLI (migrate, db push, studio) reads this file; the
 * application runtime connects through the driver adapter in prisma.service.ts.
 *
 * The URL is read straight from `process.env` (not via the `env()` helper, which
 * throws eagerly when the variable is absent). That matters because `prisma
 * generate` — run by the `postinstall` hook and in CI — does not need a database,
 * so `DATABASE_URL` is typically unset then and the empty fallback is harmless.
 * Migrations do need it: Docker Compose sets it for the backend container; for a
 * host run, export it or source the repo-root `.env` first.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma db seed` runs this (Prisma 7 no longer seeds automatically). tsx
    // executes the TypeScript seed directly, no precompile step.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
