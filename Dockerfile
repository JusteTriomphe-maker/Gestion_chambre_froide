# 1) Build front-end assets
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# 2) Install PHP dependencies
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock .
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
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public ./public
COPY --from=frontend /app .

# NGINX setup
RUN mkdir -p /run/nginx /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf

# Add entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
