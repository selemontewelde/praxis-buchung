# Operations runbook

Task- and incident-oriented procedures for running praxis-buchung in production:
*when X happens, or when you need to do Y, do these steps.* It is the counterpart
to the [README](../README.md), which is the reference for **how** each piece
works — this runbook links there for the mechanics rather than repeating them, so
there is one source of truth per fact.

All server commands run on the production host, from the directory that holds
`compose.prod.yml` and the server-side `.env` (so `-f compose.prod.yml` resolves
and `.env` is picked up). Configuration variables are documented in
[`infra/.env.prod.example`](../infra/.env.prod.example).

## Contents

- [1. Provision a server and go live the first time](#1-provision-a-server-and-go-live-the-first-time)
- [2. Ship a release (staging → production)](#2-ship-a-release-staging--production)
- [3. Roll back a bad release](#3-roll-back-a-bad-release)
- [4. Cut a tagged release with notes](#4-cut-a-tagged-release-with-notes)
- [5. Incident: the site is down](#5-incident-the-site-is-down)
- [6. Verify and restore a backup](#6-verify-and-restore-a-backup)
- [7. Rotate a secret](#7-rotate-a-secret)
- [8. A migration failed or an old release hit a newer schema](#8-a-migration-failed-or-an-old-release-hit-a-newer-schema)
- [9. Diagnostics cheat-sheet](#9-diagnostics-cheat-sheet)

---

## 1. Provision a server and go live the first time

The pipeline is **dormant** until it is armed, so `main` stays green long before a
server exists. To go live:

1. **Provision two hosts (or isolated targets)** — one for `staging`, one for
   `production` — with Docker + Docker Compose, a user that can run Docker, and a
   directory to deploy into. Point each environment's DNS `DOMAIN` at its host.
2. **Create the GitHub Environments** `staging` and `production`, add **Required
   reviewers** to `production`, and give each environment its scoped secrets
   (`SSH_HOST`, `SSH_USER`, `SSH_KEY`, `DEPLOY_PATH`). `GHCR_PAT` can stay a
   repo-level secret. Full steps: [README → Enabling the environments](../README.md#enabling-the-environments).
3. **Write each server's `.env`** from [`infra/.env.prod.example`](../infra/.env.prod.example)
   — `DOMAIN`, `ACME_EMAIL`, the `POSTGRES_*` credentials, `PUBLIC_BASE_URL`, the
   `SMTP_*` mail settings, and `TZ`. Keep it out of git.
4. **Arm the pipeline:** set the repo variable `DEPLOY_ENABLED` to `true`.
5. **Deploy** by merging to `main` (see scenario 2) — Caddy fetches the TLS
   certificate automatically on first start for a real `DOMAIN`.
6. **Set `MONITOR_URL`** to `https://<domain>/health` to arm uptime monitoring
   ([README → Uptime monitoring](../README.md#uptime-monitoring)).

Background and rationale: [ADR-0009](adr/0009-deployment-ghcr-ssh-compose-migrator.md)
and [ADR-0010](adr/0010-staging-production-manual-approval.md).

## 2. Ship a release (staging → production)

1. Merge the PR to `main`. CI builds and publishes the images, then **staging
   deploys automatically**.
2. Verify staging (smoke-test the booking flow, check `/health`).
3. In **Actions**, the `Deploy to production` job is **waiting for approval**.
   A required reviewer approves it; production then deploys the *same* images.

Only what already runs on staging reaches production, and a production deploy can
never overlap a rollback (shared concurrency group). Details:
[README → Deployment](../README.md#deployment), [ADR-0010](adr/0010-staging-production-manual-approval.md).

## 3. Roll back a bad release

A rollback **redeploys a previous image — it does not rebuild old code**.

1. Find the target tag: the `sha-<commit>` of the last good release (from its
   *Publish images to GHCR* run, or `git log`).
2. **Actions → Rollback → Run workflow**, enter the `image_tag` (e.g.
   `sha-abc1234`). It verifies the images exist in GHCR, then repulls that tag and
   restarts the stack over SSH.

Rollback is intentionally **not** behind the production approval gate, so it stays
fast in an emergency (though, like deploy, it only runs once `DEPLOY_ENABLED` is
`true`). Full description and the **forward-only-migration caveat**:
[README → Rollback](../README.md#rollback). If an old image can't tolerate the
current schema, see scenario 8 — roll *forward*, don't roll back.

## 4. Cut a tagged release with notes

```bash
git tag -a v1.2.0 -m "v1.2.0"   # annotate the commit to release
git push origin v1.2.0          # pushing the tag triggers the Release workflow
```

GitHub generates the release notes from the PRs merged since the previous tag,
grouped by PR label. Label PRs as you merge them. Details:
[README → Releases](../README.md#releases).

## 5. Incident: the site is down

Trigger: the **Uptime** workflow opened a GitHub issue labelled `uptime` (a probe
of `/health` failed). Work from the edge inward — the probe hits
`DOMAIN → Caddy → backend → database`, so narrow down where the chain breaks.

1. **Confirm the symptom.** From anywhere: `curl -sS -o /dev/null -w '%{http_code}\n' https://<domain>/health`.
   On the server: `docker compose -f compose.prod.yml ps` — is any service
   unhealthy or exited?
2. **Edge / TLS.** `docker compose -f compose.prod.yml logs --tail=100 caddy` —
   certificate errors, or is the upstream unreachable?
3. **Backend.** `docker compose -f compose.prod.yml logs --tail=200 backend` —
   the logs are structured JSON; filter by the request id or error level (see
   scenario 9 and [README → Logging](../README.md#logging)).
4. **Database.** Is `postgres` healthy? `docker compose -f compose.prod.yml exec postgres pg_isready`.
   If the backend reports it can't connect, check the `POSTGRES_*` values in `.env`.
5. **Recover.**
   - A single crashed service: `docker compose -f compose.prod.yml up -d` (recreates it).
   - The release itself is bad: **roll back** (scenario 3).
   - Data problem from a bad write/migration: consider **restore** (scenario 6) —
     last resort, it loses data written since the dump.
6. **Close the loop.** When `/health` succeeds again, the next uptime probe closes
   the alert issue automatically. Add a note on cause + fix for the record.

> Mail outages are silent to patients but not to the site: a failed confirmation
> email is logged, not fatal. Check `SMTP_*` in `.env` and the backend logs; the
> site stays up. See [README → Email (production)](../README.md#email-production).

## 6. Verify and restore a backup

A `backup` service dumps the database daily (gzipped, to `./backups/`, retention
`BACKUP_RETENTION_DAYS`). **Verify** regularly:

- A recent dump exists: `ls -lh backups/` (newest within the last day).
- It is readable: `gunzip -c backups/backup-<timestamp>.sql.gz | head`.
- The **offsite** copy is current — the on-server copy does not survive losing the
  server. Copy `./backups/` offsite on the same retention schedule.
- On demand: `docker compose -f compose.prod.yml exec backup sh /backup.sh once`.

**Restore** is a destructive, ordered procedure (stop writers → drop/recreate DB →
load dump → bring back up). Run it exactly as documented in
[README → Restore a backup](../README.md#restore-a-backup). Dumps contain personal
data — handle under the revDSG (access-controlled, encrypted at rest).

## 7. Rotate a secret

General shape: update the secret where it lives, then restart what reads it.

- **SMTP password (`SMTP_PASS`) / mail settings:** edit the server `.env`, then
  `docker compose -f compose.prod.yml up -d backend` to pick it up. Never commit it.
- **SSH deploy key (`SSH_KEY`):** generate a new keypair, add the public key to the
  server's `authorized_keys`, update the **environment** secret in GitHub, then
  remove the old public key from the server.
- **`GHCR_PAT`:** create a new token (packages: read), update the repo secret,
  revoke the old one. Used by deploy/rollback to pull images.
- **Postgres password (`POSTGRES_PASSWORD`):** change it in Postgres **and** in
  `.env` together, then restart the stack; a mismatch stops the backend from
  connecting. Treat as planned maintenance.
- **Admin session/cookie secret:** rotating it invalidates existing admin sessions
  (admins re-login). See [ADR-0008](adr/0008-admin-auth-server-side-sessions.md).

After any rotation, confirm `/health` and a booking smoke-test still pass.

## 8. A migration failed or an old release hit a newer schema

Migrations are **forward-only**: the `migrate` service runs `prisma migrate deploy`
(applies pending migrations, never reverts) before the backend starts, so a deploy
is blocked if a migration fails — the backend won't start on a half-migrated DB.

- **A migration failed mid-deploy:** the `migrate` service exits non-zero and the
  backend does not start. Read `docker compose -f compose.prod.yml logs migrate`,
  fix the migration (**roll forward** with a corrected migration), and redeploy.
  Do **not** hand-edit the schema to "unblock" — that desyncs the migration state.
- **An old image was rolled back onto a newer schema:** because rollback restores
  code but not schema, an old release may meet a column it doesn't expect. The fix
  is a forward-fix (a compatible code release or a compatible migration), not
  another rollback. This is why migrations must be **backward-compatible** — add
  columns/tables, don't rename or drop in the same release that stops using them.
- **Last resort (data corruption only):** restore a pre-incident dump (scenario 6),
  accepting the loss of writes since the dump.

## 9. Diagnostics cheat-sheet

```bash
# Service state and health
docker compose -f compose.prod.yml ps

# Follow logs for one service (structured JSON from the backend)
docker compose -f compose.prod.yml logs -f --tail=200 backend

# Trace one request across log lines by its correlation id
docker compose -f compose.prod.yml logs backend | grep '<request-id>'

# Log verbosity is LOG_LEVEL (default "info"). To raise it in production you must
# first expose it on the backend service in compose.prod.yml, e.g.
#   LOG_LEVEL: ${LOG_LEVEL:-info}
# then set LOG_LEVEL=debug in .env and `up -d backend` (reset it afterwards).

# Health from the outside (full edge -> backend -> DB path)
curl -sS https://<domain>/health

# Postgres reachable?
docker compose -f compose.prod.yml exec postgres pg_isready

# Which image is actually running?
docker compose -f compose.prod.yml images
```

Correlation ids and `LOG_LEVEL` are described in
[README → Logging](../README.md#logging); the deployment topology in
[README → Deployment](../README.md#deployment) and the ADRs under
[`docs/adr/`](adr/).
