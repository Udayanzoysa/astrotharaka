#!/usr/bin/env bash
# Backup Postgres + MinIO + uploads + env for migration / disaster recovery.
# Run on the server from the repo root.
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${BACKUP_DIR:-./deploy/backups}/${STAMP}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"
mkdir -p "$OUT_DIR"

echo "==> Backup stamp: $STAMP"
echo "==> Output: $OUT_DIR"

# 1) Postgres dump
echo "==> Dumping Postgres..."
$COMPOSE exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$OUT_DIR/postgres.dump"

# 2) Redis AOF/RDB (optional snapshot via SAVE)
echo "==> Snapshotting Redis..."
$COMPOSE exec -T redis sh -c 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning BGSAVE' || true
sleep 2

# 3) Docker volumes → tar (postgres already dumped; still copy data dirs for safety)
echo "==> Archiving Docker volumes..."
VOL_PREFIX="$(docker volume ls -q | head -1 | sed 's/_.*//' || true)"
# Prefer named project volumes
for vol in postgres_data redis_data minio_data api_uploads worker_uploads report_uploads certbot_certs; do
  full="$(docker volume ls -q | grep -E "_${vol}$|${vol}$" | head -1 || true)"
  if [ -n "$full" ]; then
    echo "    - $full"
    docker run --rm -v "${full}:/v:ro" -v "$(pwd)/${OUT_DIR}:/out" alpine \
      tar czf "/out/${vol}.tar.gz" -C /v .
  fi
done

# 4) Env (secrets) — keep offline / encrypted
if [ -f .env.production ]; then
  cp .env.production "$OUT_DIR/env.production.copy"
  echo "==> Copied .env.production (store securely!)"
fi

# 5) Manifest
cat > "$OUT_DIR/MANIFEST.txt" <<EOF
Taraka backup
Created: $STAMP
Host: $(hostname)
Domain: astrotharaka.com
Contents:
  postgres.dump          - pg_dump custom format
  *.tar.gz               - docker volume archives
  env.production.copy    - production secrets (sensitive)
Restore: see docs/wiki/server-deployment.md
EOF

# 6) Optional: pack everything
tar czf "./deploy/backups/taraka-backup-${STAMP}.tar.gz" -C "./deploy/backups" "$STAMP"
echo "==> Packed: deploy/backups/taraka-backup-${STAMP}.tar.gz"
echo "==> Done."
echo "Copy this archive off-server (S3, another VPS, Namecheap storage, etc)."
