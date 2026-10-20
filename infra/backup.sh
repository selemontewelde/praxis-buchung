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
