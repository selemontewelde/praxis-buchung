# Off-site database backups with restic

ADR-0009 added a `backup` sidecar that runs `pg_dump` daily into `./backups/` on
the server. That protects against application and database faults, but not against
losing the server itself: the only copy lives next to the database it backs up.
This records automating an off-site copy, and the tool chosen to do it.

## Decisions

**1. Replicate the dumps off-site, dormant until configured.** The daily job, after
writing the local gzipped dump, pushes `./backups/` to a remote repository when
`RESTIC_REPOSITORY` is set, and does nothing otherwise. This matches the project's
established pattern for operational features (deploy, uptime monitoring): shipped in
the code, inert until an operator opts in with configuration, so the template runs
out of the box without mandating a storage account.

**2. Use restic, not rclone or scp.** The off-site copy holds personal data
(patient names and contact details), so the revDSG requires it to be encrypted at
rest, access-controlled, and pruned on the same retention schedule as the local
dumps. restic covers all three in one tool: it encrypts every snapshot with
`RESTIC_PASSWORD` by default, deduplicates, and has native retention
(`restic forget --keep-within --prune`). The alternatives each need extra moving
parts — `rclone` would need a separately configured `crypt` remote for encryption
and has no native retention; `scp` to a second host offers neither. restic also
speaks many backends (S3-compatible object storage, SFTP, ...), so the choice of
provider stays the operator's.

**3. Install restic lazily, only when off-site is enabled.** The `backup` service
reuses the `postgres:18-alpine` image (so `pg_dump` matches the server version),
which has no restic. Rather than switch base images or bake restic into every
deployment, the script runs `apk add restic` on first use and only when
`RESTIC_REPOSITORY` is set. The default, un-configured path stays dependency-free
and unchanged.

## Consequences

- Enabling off-site backups is pure configuration in the server `.env`
  (`RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, and backend credentials) — no image
  rebuild or redeploy.
- The off-site copy is only as recoverable as its passphrase: a lost
  `RESTIC_PASSWORD` means the encrypted snapshots cannot be read. The passphrase
  must be stored safely and separately from the server, and this is documented in
  the README and `.env.prod.example`.
- Off-site replication is **non-fatal**: a failed push (network, credentials,
  provider outage) is logged but never fails the local backup or a pre-deploy run,
  so the local dump remains the primary guarantee and the off-site copy is defence
  in depth.
- The lazy `apk add` means the first enabled run (and any container restart) pays a
  one-off install cost and needs outbound network to the Alpine package mirror. For
  a once-a-day job this is negligible.
- restic keeps its own encrypted, deduplicated repository format, so restoring
  off-site is a `restic restore` to fetch the dump, then the existing `pg_restore`
  flow — documented in the README's "Backups & restore".
