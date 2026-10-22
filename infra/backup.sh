#!/bin/sh
# Daily PostgreSQL backup for the production stack (the `backup` service in
# compose.prod.yml). Once a day at BACKUP_HOUR it runs pg_dump, gzips the result
# into /backups, and deletes dumps older than BACKUP_RETENTION_DAYS.
#
# pg_dump reads the connection from the standard PG* environment variables
# (PGHOST / PGUSER / PGPASSWORD / PGDATABASE), set by the compose service.
#
# Run `sh backup.sh once` to take a single backup immediately (used for manual
# backups and in verification) instead of entering the daily loop.
set -eu

BACKUP_DIR=/backups
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
# server-local hour, 0-23. Strip a leading zero so "08"/"09" don't trip POSIX
# octal parsing in $(( )); keep plain "0" for midnight.
BACKUP_HOUR="${BACKUP_HOUR:-3}"
BACKUP_HOUR="${BACKUP_HOUR#0}"
BACKUP_HOUR="${BACKUP_HOUR:-0}"

# Off-site replication. When RESTIC_REPOSITORY is set, push the dumps to an
# encrypted, deduplicated restic repository (object storage, SFTP, ...) and prune
# it to the same retention window as the local dumps. restic encrypts every
# snapshot with RESTIC_PASSWORD, so the off-site copy is encrypted at rest.
#
# Dormant until configured, and never fatal: a failed off-site copy must not fail
# the local backup or a pre-deploy run, so the caller swallows a non-zero return.
# restic is installed lazily (only when off-site is actually enabled), keeping the
# default, un-configured path dependency-free.
replicate_offsite() {
  [ -n "${RESTIC_REPOSITORY:-}" ] || return 0

  if [ -z "${RESTIC_PASSWORD:-}" ]; then
    echo "[backup] RESTIC_REPOSITORY set but RESTIC_PASSWORD missing; skipping off-site" >&2
    return 1
  fi

  if ! command -v restic >/dev/null 2>&1; then
    echo "[backup] installing restic for off-site replication"
    apk add --no-cache restic >/dev/null 2>&1 ||
      { echo "[backup] could not install restic" >&2; return 1; }
  fi

  # Create the repository on first use (restic init is a no-op once it exists).
  if ! restic cat config >/dev/null 2>&1; then
    echo "[backup] initialising restic repository"
    restic init || { echo "[backup] restic init failed" >&2; return 1; }
  fi

  echo "[backup] replicating $BACKUP_DIR off-site"
  restic backup "$BACKUP_DIR" || { echo "[backup] restic backup failed" >&2; return 1; }
  # Same retention window as the local dumps.
  restic forget --keep-within "${RETENTION_DAYS}d" --prune ||
    echo "[backup] restic prune failed (non-fatal)" >&2
}

run_backup() {
  mkdir -p "$BACKUP_DIR"
  ts=$(date +%Y%m%d-%H%M%S)
  file="$BACKUP_DIR/backup-$ts.sql.gz"
  echo "[backup] dumping database to $file"
  # Dump to a temp file first and rename on success, so a crash mid-dump never
  # leaves a truncated file that looks like a valid backup.
  if pg_dump --no-owner --no-privileges | gzip >"$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "[backup] done ($(du -h "$file" | cut -f1))"
  else
    echo "[backup] FAILED" >&2
    rm -f "$file.tmp"
    return 1
  fi
  # Retention: drop gzipped dumps older than RETENTION_DAYS.
  find "$BACKUP_DIR" -name 'backup-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete
  # Off-site copy after the local dump is in place; non-fatal by design.
  replicate_offsite || echo "[backup] off-site replication failed (non-fatal)" >&2
}

# Seconds from now until the next BACKUP_HOUR:00 in the container's local time.
# The `1HH-100` trick strips the leading zero without tripping octal parsing.
seconds_until_run() {
  # One date call so h/m/s can't straddle an hour boundary across reads.
  hms=$(date +%H:%M:%S)
  h=${hms%%:*}
  rest=${hms#*:}
  m=${rest%%:*}
  s=${rest##*:}
  now=$(( (1$h - 100) * 3600 + (1$m - 100) * 60 + (1$s - 100) ))
  target=$(( BACKUP_HOUR * 3600 ))
  delta=$(( target - now ))
  [ "$delta" -le 0 ] && delta=$(( delta + 86400 ))
  echo "$delta"
}

if [ "${1:-}" = "once" ]; then
  run_backup
  exit $?
fi

echo "[backup] daily backup at ${BACKUP_HOUR}:00, keeping ${RETENTION_DAYS} days, in ${BACKUP_DIR}"
while true; do
  delta=$(seconds_until_run)
  echo "[backup] sleeping ${delta}s until next run"
  sleep "$delta"
  run_backup || true # never let one failure kill the daily loop
done
