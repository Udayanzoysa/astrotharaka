#!/usr/bin/env bash
# High-level migration helper (run checklist, not fully automated).
set -euo pipefail

cat <<'EOF'
============================================================
  Taraka server migration checklist
============================================================

ON OLD SERVER
-------------
1. Put site in maintenance (optional):
     docker compose -f docker-compose.prod.yml stop web nginx

2. Create backup:
     ./deploy/scripts/backup.sh

3. Copy archive off-box:
     scp deploy/backups/taraka-backup-*.tar.gz user@NEW_SERVER:/home/user/

ON NEW SERVER
-------------
1. Install Docker + Docker Compose plugin
2. Clone repo, checkout same commit as old server
3. Extract backup:
     mkdir -p deploy/backups && tar xzf taraka-backup-XXXX.tar.gz -C deploy/backups
4. Copy env:
     cp deploy/backups/XXXX/env.production.copy .env.production
5. Point DNS (Namecheap) A records to NEW server IP
   - @ → NEW_IP
   - www → NEW_IP
   - api → NEW_IP
   Keep TTL low (300s) before cutover.
6. Bootstrap HTTP nginx + SSL:
     cp deploy/nginx/conf.d/astrotharaka.conf deploy/nginx/conf.d/astrotharaka.conf.https.bak
     SSL_EMAIL=you@astrotharaka.com ./deploy/scripts/init-ssl.sh
   OR restore certbot_certs volume from backup (faster, no re-issue).
7. Restore data:
     ./deploy/scripts/restore.sh ./deploy/backups/XXXX
8. Smoke test:
     curl https://astrotharaka.com
     curl https://api.astrotharaka.com/api/v1/health
9. Update PayHere notify URL if API host changed (should stay api.astrotharaka.com)

DNS tip (Namecheap): lower TTL to 300 a day before migration; raise again after.

============================================================
EOF
