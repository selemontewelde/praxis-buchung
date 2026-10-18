# praxis-buchung

[![CI](https://github.com/selemontewelde/praxis-buchung/actions/workflows/ci.yml/badge.svg)](https://github.com/selemontewelde/praxis-buchung/actions/workflows/ci.yml)

Configurable website with online appointment booking for a single physiotherapy
practice. A new practice is launched by editing a config file (name, colours, logo,
contact, legal) — no code changes. Built as a reusable template and as a fullstack +
DevOps portfolio reference.

> Status: in active development. See the [GitHub issues](https://github.com/selemontewelde/praxis-buchung/issues) and milestones for progress.

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Frontend   | Angular 22 (standalone, signals, zoneless), custom CSS        |
| Backend    | NestJS 12 (REST), input validation, `/health` endpoint        |
| Database   | PostgreSQL + Prisma (migrations, seed data)                   |
| Email      | Mailpit locally, SMTP via env in staging/production           |
| Tests      | Vitest (unit), Playwright (E2E booking)                       |
| Infra      | Docker Compose, multi-stage Dockerfiles, Caddy, GitHub Actions |

## Monorepo layout

```
.
├── frontend/   # Angular app
├── backend/    # NestJS API
├── config/     # the single practice config (branding, contact, legal + demo seed)
├── docs/       # PRD, ADRs, agent docs
└── package.json  # npm workspaces root (scripts fan out to both apps)
```

`infra/` and `docker-compose.yml` arrive with the Docker milestone.

## Prerequisites

- Node.js 22 (`.nvmrc` pins the version — run `nvm use`)
- npm 10+
- Docker + Docker Compose v2 (for the local stack)

## Getting started

```bash
nvm use          # switch to Node 22
npm install      # installs both workspaces from the repo root
```

## Local stack (Docker Compose)

```bash
cp .env.example .env     # local dev values (gitignored)
docker compose up        # builds and starts the whole stack
```

| Service  | URL / port                      | Notes                          |
| -------- | ------------------------------- | ------------------------------ |
| Frontend | http://localhost:4200           | Angular dev server             |
| Backend  | http://localhost:3000           | NestJS API                     |
| Health   | http://localhost:3000/health    | 200 + DB connectivity, else 503 |
| Postgres | localhost:5432                  | user/pass/db from `.env`       |
| Mailpit  | http://localhost:8025           | mail UI; SMTP on 1025          |

Ports are configurable via `.env`. Stop with `docker compose down` (add `-v` to
also drop the Postgres volume).

## Database (Prisma)

The schema lives in `backend/prisma/schema.prisma`; the SQL migrations in
`backend/prisma/migrations/` are committed. On Prisma 7 the connection URL is read
from `backend/prisma.config.ts` (migrations) and from a driver adapter at runtime,
not from the schema. The Prisma client is generated into `backend/src/generated/`
on every install (`postinstall`) and is gitignored.

Run against the local stack (Postgres must be up). `DATABASE_URL` comes from `.env`:

```bash
# from the repo root; commands target the backend workspace
npm run prisma:migrate --workspace backend          # create & apply a dev migration
npm run prisma:migrate:deploy --workspace backend    # apply existing migrations (CI/prod)
npm run db:seed --workspace backend                  # seed the demo practice from config
npm run prisma:studio --workspace backend            # browse data in Prisma Studio
```

## Configuration

A practice is launched by editing **one file**: [`config/practice.config.ts`](config/practice.config.ts)
(typed by `config/practice-config.types.ts`, with invariants checked by
`config/practice-config.validation.ts`). It has two parts, per
[ADR-0001](docs/adr/0001-config-seeds-db-is-source-of-truth.md):

- **Presentation** — `branding`, `contact`, `legal` — drives the public website.
- **Seed** — `therapists`, `services`, `capabilities`, opening/working hours — the initial
  operational data loaded into the database by `npm run db:seed`. After seeding, the
  **database** is the source of truth and this data is edited in the admin, never by
  changing the file. Entities are referenced by a human-readable `key` that doubles as
  their database id, so re-seeding is idempotent.

## Scripts (run from the repo root)

| Command                 | What it does                                   |
| ----------------------- | ---------------------------------------------- |
| `npm run lint`          | Lint both apps                                 |
| `npm run typecheck`     | Type-check both apps (`tsc --noEmit`)          |
| `npm test`              | Run unit tests in both apps                    |
| `npm run build`         | Production build of both apps                  |
| `npm run start:frontend`| Serve the Angular dev server                   |
| `npm run start:backend` | Run the NestJS API in watch mode               |

## License

UNLICENSED — all rights reserved.
