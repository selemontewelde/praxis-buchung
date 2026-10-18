# praxis-buchung

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
├── docs/       # PRD, ADRs, agent docs
└── package.json  # npm workspaces root (scripts fan out to both apps)
```

`infra/` and `docker-compose.yml` arrive with the Docker milestone.

## Prerequisites

- Node.js 22 (`.nvmrc` pins the version — run `nvm use`)
- npm 10+

## Getting started

```bash
nvm use          # switch to Node 22
npm install      # installs both workspaces from the repo root
```

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
