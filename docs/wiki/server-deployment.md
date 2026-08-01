# Server deployment — astrotharaka.com (Docker + Nginx + SSL)

**Last updated:** 2026-08-01  
**Audience:** You (owner) + future ops / AI assistants  
**Stack:** Ubuntu VPS · Docker Compose · Nginx · Let's Encrypt · Namecheap DNS

---

## Architecture

```
Internet
   │
   ▼
Nginx :80/:443  (SSL termination)
   ├─ https://astrotharaka.com      → web (Next.js :3001)
   ├─ https://www.astrotharaka.com  → 301 → apex
   └─ https://api.astrotharaka.com  → api (NestJS :3000)
                                          ├─ postgres
                                          ├─ redis
                                          ├─ minio
                                          ├─ worker (BullMQ)
                                          └─ astrology-engine :8001
```

All app ports stay **internal**. Only Nginx exposes 80/443.

---

## 1. Buy / prepare VPS

Recommended minimum:

| Resource | Suggestion |
|----------|------------|
| OS | Ubuntu 22.04 or 24.04 LTS |
| RAM | 4 GB+ (8 GB better with Chromium later) |
| Disk | 40 GB+ SSD |
| Access | SSH root or sudo user |

Install Docker:

```bash
# Ubuntu
sudo apt update && sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out / in, then:
docker compose version
```

Open firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Namecheap DNS (astrotharaka.com)

In **Namecheap → Domain List → Manage → Advanced DNS**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `YOUR_SERVER_IP` | 300 (then Auto) |
| A Record | `www` | `YOUR_SERVER_IP` | 300 |
| A Record | `api` | `YOUR_SERVER_IP` | 300 |

**Email (if using Namecheap Private Email):** keep their MX / TXT / CNAME records for mail — do **not** delete them when adding A records.

Wait until DNS resolves:

```bash
dig +short astrotharaka.com
dig +short api.astrotharaka.com
```

Both should show your VPS IP before requesting SSL.

---

## 3. Deploy the app

```bash
# On the server
git clone <YOUR_REPO_URL> taraka
cd taraka

# Production env
cp .env.production.example .env.production
nano .env.production   # fill ALL secrets

# Generate secrets
openssl rand -base64 48   # → JWT_ACCESS_SECRET
openssl rand -base64 24   # → POSTGRES_PASSWORD / REDIS_PASSWORD
```

**Critical `.env.production` values for this domain:**

```env
WEB_APP_URL=https://astrotharaka.com
CORS_ORIGIN=https://astrotharaka.com
NEXT_PUBLIC_API_URL=https://api.astrotharaka.com/api/v1
PAYHERE_MODE=live
PAYHERE_NOTIFY_URL=https://api.astrotharaka.com/api/v1/webhooks/payhere
PAYHERE_RETURN_URL=https://astrotharaka.com/orders
PAYHERE_CANCEL_URL=https://astrotharaka.com/orders
SMTP_HOST=mail.privateemail.com
SMTP_USER=info@astrotharaka.com
```

Keep a HTTPS nginx backup, start HTTP-only for ACME, then SSL:

```bash
cp deploy/nginx/conf.d/astrotharaka.conf deploy/nginx/conf.d/astrotharaka.conf.https.bak
cp deploy/nginx/conf.d/astrotharaka.http-only.conf.example deploy/nginx/conf.d/astrotharaka.conf

# Build & start apps (nginx HTTP for now)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Issue certificates
chmod +x deploy/scripts/*.sh
SSL_EMAIL=admin@astrotharaka.com ./deploy/scripts/init-ssl.sh

# Ensure HTTPS conf is active
cp deploy/nginx/conf.d/astrotharaka.conf.https.bak deploy/nginx/conf.d/astrotharaka.conf
docker compose -f docker-compose.prod.yml --env-file .env.production exec nginx nginx -s reload
```

Seed admin **once** (optional — change password immediately):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec api \
  sh -c 'cd /app/apps/api && npx tsx prisma/seed.ts'
```

(If seed tooling is missing in the slim image, run seed from a one-off build container or create the admin via SQL / register + promote in DB.)

---

## 4. Smoke tests after deploy

```bash
curl -fsS https://api.astrotharaka.com/api/v1/health
curl -I https://astrotharaka.com
```

Manual:

1. Open https://astrotharaka.com  
2. Register → verification email (Namecheap SMTP)  
3. Admin: https://astrotharaka.com/admin/login  
4. PayHere notify URL in merchant dashboard = `https://api.astrotharaka.com/api/v1/webhooks/payhere`  
5. Upload a bank slip → approve in admin  

---

## 5. Day-2 operations

### View logs

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f api worker nginx
```

### Update / redeploy

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

API container runs `prisma migrate deploy` on start.

### Renew SSL

Certbot container renews automatically. Manual:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm certbot renew
docker compose -f docker-compose.prod.yml --env-file .env.production exec nginx nginx -s reload
```

---

## 6. Backup (do this weekly + before every deploy)

```bash
./deploy/scripts/backup.sh
# → deploy/backups/taraka-backup-YYYYMMDDTHHMMSSZ.tar.gz
```

**Copy the archive off the server** (another VPS, S3, Google Drive, etc.).  
The archive includes:

| File | Contents |
|------|----------|
| `postgres.dump` | Full database |
| `minio_data.tar.gz` | Report / object storage |
| `api_uploads.tar.gz` / `report_uploads.tar.gz` | Bank slips, local files |
| `certbot_certs.tar.gz` | SSL certs (optional restore) |
| `env.production.copy` | Secrets — encrypt / restrict access |

Cron example (daily 02:30 UTC):

```bash
crontab -e
# 30 2 * * * cd /home/YOU/taraka && ./deploy/scripts/backup.sh >> /var/log/taraka-backup.log 2>&1
```

---

## 7. Restore / migrate to a new server

Print the checklist:

```bash
./deploy/scripts/migrate-to-new-server.sh
```

### Short version

**Old server**

```bash
./deploy/scripts/backup.sh
scp deploy/backups/taraka-backup-*.tar.gz user@NEW_IP:~/
```

**New server**

1. Install Docker, clone same git commit  
2. Extract backup → restore `.env.production`  
3. Point Namecheap A records (`@`, `www`, `api`) to **new IP** (TTL 300)  
4. Either restore `certbot_certs` volume **or** run `init-ssl.sh` again  
5. `./deploy/scripts/restore.sh ./deploy/backups/<stamp>`  
6. Smoke test health + login + PayHere  

DNS cutover tip: lower TTL to **300 seconds** a day before migration so the switch is fast.

---

## 8. What lives where (migration map)

| Data | Location | Migrates via |
|------|----------|--------------|
| Users, orders, payments | Postgres volume | `postgres.dump` |
| Report PDFs / objects | MinIO volume | `minio_data.tar.gz` |
| Bank slips | `api_uploads` | volume tar |
| Generated reports (disk) | `report_uploads` | volume tar |
| SSL certs | `certbot_certs` | volume tar **or** re-issue |
| Secrets | `.env.production` | copy in backup |
| Code | Git | `git clone` / `git pull` |

You do **not** need to copy `node_modules` or Docker images — rebuild on the new host.

---

## 9. Security checklist

- [ ] `.env.production` never in git  
- [ ] Strong `JWT_ACCESS_SECRET`, DB, Redis, MinIO passwords  
- [ ] `PAYHERE_MODE=live` only with live merchant credentials  
- [ ] `OTP_RETURN_IN_RESPONSE=false`  
- [ ] `ALLOW_DEV_PAYMENTS=false`  
- [ ] Firewall: only 22/80/443 public  
- [ ] Change default seeded admin password  
- [ ] Off-site backups verified by a test restore once  

---

## 10. Files added for this setup

| Path | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Full production stack |
| `docker/api.Dockerfile` | API image |
| `docker/web.Dockerfile` | Web image |
| `docker/worker.Dockerfile` | Worker image |
| `deploy/nginx/*` | Nginx + SSL snippets |
| `deploy/scripts/init-ssl.sh` | Let's Encrypt bootstrap |
| `deploy/scripts/backup.sh` | Backup |
| `deploy/scripts/restore.sh` | Restore |
| `deploy/scripts/migrate-to-new-server.sh` | Migration checklist |
| `.env.production.example` | Prod env template |

---

## Related

- [Go-live readiness](./go-live-readiness.md)  
- [Recent updates & roadmap](./recent-updates-and-roadmap.md)  
- Namecheap Private Email SMTP: `mail.privateemail.com:465`  
