#!/usr/bin/env bash
# First-time Let's Encrypt certificates for astrotharaka.com
# Run on the server from the repo root.
set -euo pipefail

DOMAIN="${DOMAIN:-astrotharaka.com}"
EMAIL="${SSL_EMAIL:?Set SSL_EMAIL=you@astrotharaka.com}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo "==> Using HTTP-only nginx for ACME challenge"
cp deploy/nginx/conf.d/astrotharaka.http-only.conf.example deploy/nginx/conf.d/astrotharaka.conf
$COMPOSE up -d nginx

echo "==> Requesting certificate for ${DOMAIN}, www.${DOMAIN}, api.${DOMAIN}"
$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  -d "api.$DOMAIN"

echo "==> Restoring HTTPS nginx config"
# Restore from git if available, else keep a copy named .https.bak
if [ -f deploy/nginx/conf.d/astrotharaka.conf.https.bak ]; then
  cp deploy/nginx/conf.d/astrotharaka.conf.https.bak deploy/nginx/conf.d/astrotharaka.conf
elif git show HEAD:deploy/nginx/conf.d/astrotharaka.conf > /tmp/astrotharaka.conf 2>/dev/null; then
  cp /tmp/astrotharaka.conf deploy/nginx/conf.d/astrotharaka.conf
else
  echo "WARNING: restore HTTPS conf manually from the repo file deploy/nginx/conf.d/astrotharaka.conf"
fi

$COMPOSE exec nginx nginx -s reload || $COMPOSE up -d nginx
echo "==> SSL ready. Visit https://${DOMAIN}"
