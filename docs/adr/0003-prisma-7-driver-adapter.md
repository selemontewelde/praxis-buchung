# Prisma 7 with a driver adapter, no Rust query engine

We adopted Prisma as the ORM in milestone 2. The current stable major at that
point was Prisma 7 (the CLI's `latest` tag was a v8 release candidate; v7.10.1 was
the newest stable pair of `prisma` and `@prisma/client`). Prisma 7 is a notable
architecture change from the version most tutorials still describe, so the setup
differs from what a reader might expect.

**Decision.** Use **Prisma 7** with its new model:

- **A driver adapter instead of the Rust query engine.** Prisma 7 no longer spawns
  a separate query-engine process; the client talks to Postgres through a
  JavaScript driver adapter. We use `@prisma/adapter-pg` (node-postgres) and build
  it from `DATABASE_URL`, passed to the `PrismaClient` constructor. Both the app
  (`PrismaService`) and the standalone seed construct the client this way.
- **Connection URL in `prisma.config.ts`, not the schema.** The `datasource` block
  no longer carries `url`; the CLI reads it from `prisma.config.ts`. We read it via
  `process.env.DATABASE_URL` (not the `env()` helper, which throws eagerly and
  would break `prisma generate` when no database is configured, e.g. in CI).
- **The `prisma-client` generator with an in-tree output.** The client is generated
  into `backend/src/generated/prisma` rather than into `node_modules/@prisma/client`.
  It is gitignored and regenerated on every install via a `postinstall` hook, and is
  shielded from the host dev container by a compose anonymous volume and excluded
  from the Docker build context and from linting.

The alternative was to pin back to Prisma 6, which still supports the URL in the
schema and the bundled engine. We rejected it: v7 is the current stable line, the
driver-adapter model is how new Prisma projects should be built now, and showing the
current approach has portfolio value.

## Consequences

- One connection path for the whole app: the `@nestjs/terminus`
  `PrismaHealthIndicator` pings through the same `PrismaService`, so `/health`
  reflects the real data-access connection (the temporary `pg` pool from milestone 1
  is gone).
- Imports of the client use the generated path (`../generated/prisma/client.js`),
  not the `@prisma/client` package name, and must carry the `.js` suffix under
  NodeNext ESM.
- `prisma generate` must run before type-check/build; `postinstall` guarantees this
  locally and in CI without needing a database.
- Seeding is explicit in v7 (`prisma db seed`); it no longer runs automatically
  after `migrate dev`/`reset`, and `--skip-seed` is gone.
- `prisma migrate reset` now requires explicit human consent when run by an AI
  agent — a deliberate v7 guardrail.
- Revisit when Prisma 8 ships stable: assess upgrading, and whether the generated
  client location or the adapter choice should change.
