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
RUN apk add --no-cache nginx icu-dev libzip-dev oniguruma-dev postgresql-dev zlib-dev bash shadow git \
    && docker-php-ext-install pdo_pgsql intl bcmath pcntl zip opcache

WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public ./public
COPY --from=frontend /app .

# NGINX setup
RUN mkdir -p /run/nginx /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["sh", "-c", "php artisan migrate --force && php-fpm -D && nginx -g 'daemon off;'" ]
