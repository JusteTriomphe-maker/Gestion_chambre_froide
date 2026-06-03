# 1) Build front-end assets
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build en mode production et supprimer public/hot s'il existe
RUN NODE_ENV=production npm run build && rm -f public/hot

# 2) Install PHP dependencies
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts --no-progress

# 3) Runtime image
FROM php:8.2-fpm-alpine
RUN apk add --no-cache nginx icu-dev libzip-dev oniguruma-dev postgresql-dev postgresql-client zlib-dev bash shadow git netcat-openbsd \
    && docker-php-ext-install pdo_pgsql intl bcmath pcntl zip opcache

# Configure PHP-FPM to listen on TCP port 9000
RUN echo "[www]" > /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "listen = 127.0.0.1:9000" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "listen.backlog = 4096" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm = dynamic" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.max_children = 10" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.start_servers = 2" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.min_spare_servers = 1" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "pm.max_spare_servers = 5" >> /usr/local/etc/php-fpm.d/zz-docker.conf

WORKDIR /var/www/html

# ── Copie explicite de chaque répertoire (évite de copier node_modules) ────────
# Fichiers PHP source
COPY --from=frontend /app/app ./app
COPY --from=frontend /app/bootstrap ./bootstrap
COPY --from=frontend /app/config ./config
COPY --from=frontend /app/database ./database
COPY --from=frontend /app/resources ./resources
COPY --from=frontend /app/routes ./routes
COPY --from=frontend /app/storage ./storage
# Fichiers racine
COPY --from=frontend /app/artisan ./artisan
COPY --from=frontend /app/composer.json ./composer.json
# Assets publics buildés par Vite (public/build/ généré lors du npm run build)
COPY --from=frontend /app/public ./public
# Vendor PHP depuis le stage composer (priorité absolue)
COPY --from=vendor /app/vendor ./vendor

# ── Garantie absolue : public/hot ne doit JAMAIS exister en production ─────────
RUN rm -f /var/www/html/public/hot

# NGINX & permissions setup
RUN mkdir -p /run/nginx \
               /var/www/html/storage/framework/views \
               /var/www/html/storage/framework/sessions \
               /var/www/html/storage/framework/cache \
               /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

COPY nginx.conf /etc/nginx/nginx.conf

# Add entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Render assigne le port 10000 par défaut
EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
