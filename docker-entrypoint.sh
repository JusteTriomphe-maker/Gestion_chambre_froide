#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
RETRY=0
MAX=30
while ! pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" >/dev/null 2>&1; do
  RETRY=$((RETRY+1))
  if [ "$RETRY" -ge "$MAX" ]; then
    echo "[entrypoint] Database not available after $MAX attempts"
    exit 1
  fi
  sleep 2
done

echo "[entrypoint] Database is ready"

echo "[entrypoint] Running migrations & caches"
php artisan migrate --force || true
php artisan config:cache || true
php artisan route:cache || true

echo "[entrypoint] Starting services"
php-fpm -D
nginx -g 'daemon off;'
