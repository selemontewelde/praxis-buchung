# praxis-buchung

Configurable website for a single physiotherapy practice with online appointment
booking. Sold as a template to practices and used as a fullstack + DevOps portfolio
reference. A new practice is customised through a config file only (name, colours, logo,
services, team, contact) — no code changes.

Full project briefing: [`claude-code-prompt-praxis-buchung.md`](./claude-code-prompt-praxis-buchung.md).

## Language

- Talk to the user (Selemon) in **German**.
- Write **code, issues, PRs, commit messages and docs in English**.

## Learning mode (most important rule)

The user is a frontend developer (Angular/TypeScript) and a trained physiotherapist who
wants to learn fullstack + DevOps. Optimise for his understanding, not for speed.

- **Plan before each issue**: a short plan (files, concepts, decisions), then wait for his OK.
- **Explain decisions and the why**, especially everything outside Angular: NestJS, database,
  Docker, CI/CD, server, monitoring. That is where he wants to learn the most.
- **Let him write part of it** each milestone: create a file with a `// TODO(Selemon):`
  marker plus a hint, explain it, then review his code. On DevOps milestones this can be a
  workflow file or part of a Dockerfile.
- **2–3 comprehension questions** to him at the end of each milestone.
- **Don't run ahead**: never do several issues in a row without his approval.
- **Check current stable versions** via npm / official docs before scaffolding — not from memory.
- The user pushes and merges himself (to learn the flow). Claude never runs `git push`,
  `git reset --hard` or `git clean` — a guardrail hook blocks these.

## Per-issue workflow

1. Own branch per issue; finish with a Pull Request that closes the issue. The user merges
   himself after CI is green.
2. Build logic test-first with `tdd` (red-green-refactor) — especially the slot calculation.
3. On bugs use `diagnosing-bugs` instead of guessing.
4. Before every PR run `code-review` on the own diff; write the PR body with the `pr` skill.

## Milestone cadence

- At the end of each milestone: an architecture review and capture key decisions as ADRs under
  `docs/adr/`. (`improve-codebase-architecture` is not installed in this skill set — substitute
  a manual architecture review, optionally with `/simplify`.)
- One GitHub milestone per project milestone; issues are vertical slices grouped by milestone.

## Skill name mapping

The installed Matt Pocock skills differ slightly in name from the briefing:
grill-me → `grill-with-docs`, to-prd → `to-spec`, to-issues → `to-tickets`,
diagnose → `diagnosing-bugs`. The planning skills (`setup-matt-pocock-skills`,
`grill-with-docs`, `to-spec`, `to-tickets`) are **user-invoked only** — the user triggers the
slash command, then Claude executes it.

## Tech stack

- **Frontend**: Angular (standalone components, signals), lean custom styling.
- **Backend**: NestJS, REST, input validation, `/health` endpoint with a DB check.
- **Database**: PostgreSQL with Prisma (migrations, seed data for one demo practice).
- **Email**: Mailpit locally, SMTP via env vars in staging/production.
- **Admin auth**: hashed passwords, HTTP-only cookie or JWT (explain the choice).
- **Monorepo**: `frontend/`, `backend/`, `infra/`, `docker-compose.yml`.
- **Tests**: unit tests (slot logic thoroughly, with edge cases), Playwright E2E for booking.
- **CI/CD**: GitHub Actions on every PR (lint, typecheck, unit tests, build; npm caching);
  branch protection on `main`; multi-stage Dockerfiles (non-root); deploy on merge to `main`
  via GHCR + SSH + Docker Compose; Prisma migrations before app start; Caddy reverse proxy
  (automatic HTTPS); daily `pg_dump` backup.
- **Project Node version**: 22.

## Milestones

1. Scaffold: monorepo, local Docker Compose, Angular + NestJS + DB running, CI, branch protection.
2. Data model & config: Prisma schema, seed data, practice config file.
3. Public website rendered from the config.
4. Slot calculation with TDD.
5. Booking flow plus confirmation & cancellation email.
6. Reminder job (24 h before the appointment).
7. Admin area with login.
8. Deployment: production Dockerfiles, images to GHCR, SSH deploy, HTTPS, backup.
9. Security pass (rate limiting on booking, validation, security headers), one local Playwright
   booking test, polish.
10. Portfolio polish: README with screenshots, architecture & pipeline diagram, setup guide,
    live-demo link, ADR summary.

## Out of MVP scope

Payments, prescriptions/billing, patient records or diagnoses, SMS, multiple practices per
instance, native apps. Data-minimal: no health data — only name, contact, appointment.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `selemontewelde/praxis-buchung` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
