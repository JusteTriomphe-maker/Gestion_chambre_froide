#!/bin/sh
set -e

# ── Supprimer le fichier public/hot de Vite (dev server) s'il existe ──────────
# Ce fichier force Laravel à pointer vers le dev server Vite au lieu du build.
rm -f /var/www/html/public/hot

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
# Ensure framework storage directories exist before caching configuration.
mkdir -p storage/framework/views storage/framework/sessions storage/framework/cache bootstrap/cache || true
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

php artisan migrate --force || true
php artisan db:seed --force || true
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan config:cache || true
php artisan route:cache || true

# ── Configurer Nginx avec le port assigné par Render ─────────────────────────
NGINX_LISTEN_PORT="${PORT:-10000}"
echo "[entrypoint] Configuring Nginx with PORT=${NGINX_LISTEN_PORT}"
sed -i "s/NGINX_PORT/${NGINX_LISTEN_PORT}/g" /etc/nginx/nginx.conf

# Ensure framework subfolders exist and are writable
mkdir -p storage/framework/views storage/framework/sessions storage/framework/cache bootstrap/cache || true
chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

echo "[entrypoint] Starting services"
# Start php-fpm in foreground to capture errors in container logs, background it so nginx can run
php-fpm -F &
PHP_FPM_PID=$!

echo "[entrypoint] php-fpm started with pid=$PHP_FPM_PID"

echo "[entrypoint] Waiting for php-fpm to listen on 127.0.0.1:9000"
RETRY=0
MAX=15
while ! nc -z 127.0.0.1 9000 >/dev/null 2>&1; do
  if ! kill -0 "$PHP_FPM_PID" >/dev/null 2>&1; then
    echo "[entrypoint] php-fpm process died"
    exit 1
  fi
  RETRY=$((RETRY+1))
  if [ "$RETRY" -ge "$MAX" ]; then
    echo "[entrypoint] php-fpm did not start on 127.0.0.1:9000 after $MAX attempts"
    exit 1
  fi
  sleep 1
done

echo "[entrypoint] php-fpm is ready"
exec nginx -g 'daemon off;'
