# Deployment: GHCR images, SSH + Compose, a one-off migrator, Caddy for HTTPS

Milestone 8 had to turn "green on main" into "running on a server over HTTPS"
without a managed platform (no Kubernetes, no PaaS) — this is sold as a template a
small practice self-hosts on one cheap VPS, and used as a DevOps portfolio
reference. Several connected choices were made here that are costly to change
later, so they are recorded together.

## Decisions

**1. Build once in CI, ship immutable images via GHCR.** On a merge to `main`, CI
builds the production images and pushes them to the GitHub Container Registry,
tagged `latest` and `sha-<commit>`. The server never builds; it only pulls. The
deploy runs the exact `sha-<commit>` image of the commit that triggered it, so a
deploy is deterministic and a rollback is "pull the previous sha tag".

**2. Deploy by SSH + Docker Compose, not a platform.** A CI `deploy` job copies
`compose.prod.yml` + `Caddyfile` + `backup.sh` to the server and runs
`docker compose pull && up -d`. One small VPS, one compose file, no control plane
to operate. The job is **dormant** behind a `DEPLOY_ENABLED` repo variable so the
pipeline is complete and green long before a server exists (the "deploy-ready,
provision later" path we actually took).

**3. Migrations run as a dedicated one-off `migrate` image, not in the app.** The
backend runtime image is deliberately slim and drops the Prisma CLI (a
devDependency). So a separate `migrator` image (Prisma CLI + schema +
`prisma.config.ts` only) runs `prisma migrate deploy` and exits; the backend
starts only after it, via Compose `depends_on: condition:
service_completed_successfully`. Migrations are thus an explicit, ordered release
step with a real guarantee — not a race, and not bundled into the app runtime
where every replica would try to migrate on boot.

**4. Caddy is the edge for automatic HTTPS.** A single Caddy service terminates
TLS (Let's Encrypt for the real domain, an internal CA for `localhost`), routes
`/api/*` to the backend and everything else to the nginx-served frontend, and
redirects HTTP→HTTPS. Only Caddy publishes ports; the app, migrator, backup and
Postgres stay on the internal network. Certificates persist in a named volume to
survive restarts (and Let's Encrypt rate limits).

**5. Backups are a sidecar using the same Postgres image.** A `backup` service
runs `pg_dump` daily into a host-mounted directory with retention, reusing
`postgres:17-alpine` so the dump tool always matches the server's version.

## Consequences

- The whole stack is reproducible locally: running `compose.prod.yml` with
  `DOMAIN=localhost` exercises migrate-before-start, HTTPS, routing and backups
  without a server — which is how M8 was verified end to end.
- Three images instead of two (backend, frontend, migrate). The migrator carries
  Prisma's engine binaries (~hundreds of MB), but it is pulled rarely and its
  heavy layer is cached; the trade keeps the **runtime** image slim.
- Operational cost is a human running backups offsite and provisioning the VPS;
  there is no auto-scaling, no zero-downtime rolling deploy (a brief restart on
  `up -d`), and no secret manager — acceptable for a single-practice deployment,
  and the boundary to revisit if this ever grows beyond one box.
- Security depends on environment-correct settings set elsewhere: the production
  `Secure` cookie (ADR-0008), least-privilege CI token and SHA-pinned third-party
  actions, and the `${VAR:?}` guards that make a missing secret fail loudly.
- Mail is not yet production-usable: the mail service uses an unauthenticated
  SMTP host/port; authenticated SMTP (user/password/TLS) is a deferred follow-up.
