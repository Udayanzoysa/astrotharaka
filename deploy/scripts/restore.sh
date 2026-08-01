#!/usr/bin/env bash
# Restore from a backup directory created by backup.sh
# Usage: ./deploy/scripts/restore.sh ./deploy/backups/20260801T120000Z
set -euo pipefail

SRC="${1:?Usage: $0 /path/to/backup-dir}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

if [ ! -d "$SRC" ]; then
  echo "Backup dir not found: $SRC"
  exit 1
fi

echo "==> Restoring from $SRC"
echo "WARNING: This overwrites database and volumes. Ctrl+C to abort."
sleep 5

# Restore env if missing
if [ ! -f .env.production ] && [ -f "$SRC/env.production.copy" ]; then
  cp "$SRC/env.production.copy" .env.production
  echo "==> Restored .env.production"
fi

$COMPOSE up -d postgres redis minio
sleep 8

# Postgres
if [ -f "$SRC/postgres.dump" ]; then
  echo "==> Restoring Postgres..."
  $COMPOSE exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < "$SRC/postgres.dump" \
    || $COMPOSE exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /dev/stdin' < "$SRC/postgres.dump" \
    || true
fi

# Volumes
restore_vol() {
  local name="$1"
  local archive="$SRC/${name}.tar.gz"
  [ -f "$archive" ] || return 0
  local full
  full="$(docker volume ls -q | grep -E "_${name}$|${name}$" | head -1 || true)"
  if [ -z "$full" ]; then
    echo "Volume $name not found yet — start stack once, then re-run restore for volumes."
    return 0
  fi
  echo "==> Restoring volume $full"
  docker run --rm -v "${full}:/v" -v "$(cd "$SRC" && pwd):/src:ro" alpine \
    sh -c "rm -rf /v/* /v/.[!.]* 2>/dev/null; tar xzf /src/${name}.tar.gz -C /v"
}

$COMPOSE stop api worker web nginx || true
for vol in minio_data api_uploads worker_uploads report_uploads certbot_certs; do
  restore_vol "$vol"
done

$COMPOSE up -d --build
echo "==> Restore complete. Check: curl -fsS https://astrotharaka.com && curl -fsS https://api.astrotharaka.com/api/v1/health"
