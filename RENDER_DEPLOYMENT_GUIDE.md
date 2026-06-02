# 🚀 Guide Complet : Déploiement Render

**Application:** Chambre Froide (Gestion de Stock)  
**Tech Stack:** Laravel 11 + Inertia + React + PostgreSQL  
**Date:** 29 mai 2026

---

## ✅ État actuel du projet

- ✅ **Migrations** : 18/18 exécutées en local
- ✅ **Authentification** : Laravel Breeze + Sanctum configuré
- ✅ **Frontend** : React avec Inertia JS, Tailwind CSS
- ✅ **API** : 50+ endpoints REST
- ✅ **Pages** : Dashboard, Products, Clients, Suppliers, Stock, Debts, Sales, Users
- ✅ **Tests locaux** : Application fonctionnelle sur http://localhost:8000

---

## 📋 Checklist de déploiement

### 1️⃣ Préparer le dépôt GitHub

```bash
# Depuis le projet local
git push origin main

# Vérifier le commit
git log --oneline | head -1
# Output: eeb2b38 Fix: Configure Sanctum for session-based API authentication
```

### 2️⃣ Créer les ressources Render

#### A) PostgreSQL Database
1. Aller sur [render.com/dashboard](https://render.com/dashboard)
2. **New** > **PostgreSQL**
3. Configuration :
   - **Name**: `chambre-froide-db`
   - **Database Name**: `chambre_froide`
   - **User**: `chambre_froide_user` (ou un autre nom personnalisé, `postgres` n'est pas accepté)
   - **Region**: Sélectionner la plus proche (ex: `Frankfurt`)
4. **Create Database**
5. Noter les credentials (affichés après création) :
   - `DB_HOST` : (example: `dpg-xyz.render.internal`)
   - `DB_PORT` : `5432`
   - `DB_DATABASE` : `chambre_froide`
   - `DB_USERNAME` : `chambre_froide_user`
   - `DB_PASSWORD` : (généré, notez-le!)

#### B) Web Service
Pour Laravel sur Render, le plus simple est de déployer un seul service PHP si Render le propose. Si ton interface force `Node`, choisis plutôt `Docker` et ajoute un `Dockerfile`.

##### Option 1 — Service PHP (recommandé si disponible)
1. **New** > **Web Service**
2. Configuration :
   - **Repository** : `JusteTriomphe-maker/Gestion_chambre_froide`
   - **Branch** : `main`
   - **Name** : `chambre-froide-backend`
   - **Root Directory** : (laisser vide)
   - **Environment** : `PHP`
   - **Build Command** :
     ```bash
     composer install --no-dev --optimize-autoloader
     php artisan config:cache || true
     php artisan route:cache || true
     ```
   - **Start Command** :
     ```bash
     php artisan migrate --force && php -S 0.0.0.0:$PORT -t public
     ```
   - **Plan** : Free ou Starter

> Astuce : si la console Render détecte `Node`, ignore cette détection et change manuellement le runtime en `PHP`.

##### Option 2 — Service Docker (si PHP n’apparaît pas dans la liste)
1. **New** > **Web Service**
2. Configuration :
   - **Repository** : `JusteTriomphe-maker/Gestion_chambre_froide`
   - **Branch** : `main`
   - **Name** : `chambre-froide-backend`
   - **Root Directory** : (laisser vide)
   - **Environment** : `Docker`
   - **Dockerfile Path** : `./Dockerfile`
   - **Build Command** : laisser vide
   - **Start Command** : laisser vide
   - **Plan** : Free ou Starter

3. Ajoute un `Dockerfile` à la racine du dépôt avec ce contenu :

```dockerfile
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
CMD ["sh", "-c", "php artisan migrate --force && php-fpm -D && nginx -g 'daemon off;'"]
```

4. Crée un fichier `nginx.conf` à la racine du dépôt :

```nginx
worker_processes 1;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events { worker_connections 1024; }

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    server {
        listen 80;
        server_name localhost;
        root /var/www/html/public;
        index index.php index.html;

        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }

        location ~ /\.ht {
            deny all;
        }
    }
}
```

5. Ajoute aussi un fichier `.dockerignore` :

```
node_modules
vendor
storage
.env
.git
```

> Le Dockerfile ci-dessus compile Vite + React, installe Composer, puis lance PHP+NGINX.

### 3️⃣ Configurer les variables d'environnement

Dans Render, aller à **Environment** et ajouter :

```bash
# App Configuration
APP_NAME="Chambre Froide"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:hEktQiQBsYSYbmV9HtOUlx2RHuqK7+qPkZ5BVIflU2s=
APP_URL=https://chambre-froide-app.onrender.com
APP_TIMEZONE=UTC

# Database (Render PostgreSQL)
DATABASE_URL=postgres://<db_user>:<db_password>@<db_host>:5432/<db_name>
DB_CONNECTION=pgsql
DB_HOST=<db_host>
DB_PORT=5432
DB_DATABASE=<db_name>
DB_USERNAME=<db_user>
DB_PASSWORD=<db_password>

# Sanctum/Authentication
SANCTUM_STATEFUL_DOMAINS=chambre-froide-app.onrender.com
SESSION_DRIVER=cookie

# Logging & Queue
LOG_CHANNEL=stack
LOG_LEVEL=info
QUEUE_CONNECTION=sync
CACHE_DRIVER=file

# Email (optionnel, déjà configuré dans .env)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=justenicous239@gmail.com
MAIL_PASSWORD=xqptqfqumgphglfs
MAIL_ENCRYPTION=tls
```

**Important** :
- `APP_KEY` doit provenir de `php artisan key:generate --show` si tu le génères après coup.
- `DATABASE_URL` est l’URL interne de la base PostgreSQL fournie par Render.
- `DB_USERNAME` ne doit pas être `postgres` si Render le refuse.

**⚠️ Important** : Le `APP_URL` doit être mis à jour avec l'URL exacte que Render vous donnera après création du service.

### 4️⃣ Déployer

1. Retour au **Web Service** > **Deploy** button
2. Attendre que Render construise et lance l'application (~5-10 min)
3. Vérifier les logs en cas d'erreur

### 5️⃣ Vérifications post-déploiement

```bash
# 1. Vérifier que l'app respond
curl https://chambre-froide-app.onrender.com
# Vous devriez voir la page de login HTML

# 2. Vérifier l'API (depuis le navigateur ou Postman)
https://chambre-froide-app.onrender.com/api/dashboard/stats
# Status: 401 Unauthorized (normal, authentification requise)

# 3. Tester la connexion
# Email: dg@chambrefroide.ci
# Mot de passe: dg123456
```

---

## 🔧 Commandes utiles (exécutées automatiquement par Render)

Ces commandes s'exécutent automatiquement dans le **Start Command** :

```bash
# 1. Run migrations
php artisan migrate --force

# 2. Seed utilisateurs (si nécessaire)
php artisan db:seed --class=UserSeeder

# 3. Cache config
php artisan config:cache
php artisan route:cache
```

---

## 📊 Architecture après déploiement

```
┌─────────────────────────────────────────────┐
│         Render.com                          │
├─────────────────────────────────────────────┤
│ Web Service (chambre-froide-app)            │
│ ├─ Laravel 11 (PHP 8.2)                     │
│ ├─ Node.js build (Vite + React)             │
│ └─ Port: $PORT (dynamique)                  │
├─────────────────────────────────────────────┤
│ PostgreSQL Database (chambre-froide-db)     │
│ └─ Persistent Storage                       │
└─────────────────────────────────────────────┘
         ↓ HTTPS automatique
    https://chambre-froide-app.onrender.com
```

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| **Build fail** | Vérifier les logs Render > Build Logs |
| **500 Error** | Vérifier `APP_KEY` dans env vars |
| **DB connection error** | Vérifier `DB_HOST`, `DB_PASSWORD` |
| **CSRF/Auth failures** | Vérifier `SANCTUM_STATEFUL_DOMAINS` correspond à votre URL |
| **CSS/JS not loading** | Le build Vite s'est-il terminé ? Vérifier Build Logs |

---

## 📚 Documentation

- [Laravel Deployment on Render](https://render.com/docs/deploy-php)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Sanctum SPA Documentation](https://laravel.com/docs/11.x/sanctum)

---

## ✨ Notes importantes

1. **First deployment** : La base de données sera créée automatiquement avec les migrations
2. **Seed utilisateur** : L'utilisateur DG est créé automatiquement via `UserSeeder`
3. **Vite build** : Vérifier que les assets sont générés dans `public/build/`
4. **Environment variables** : Peuvent être modifiées sans redeployer (nécessite juste un restart)
5. **Persistent storage** : Les fichiers dans `/storage` ne persisteront pas entre redéploiements (utiliser S3 ou similar si besoin)

---

## 🎯 Prochaines étapes

- [ ] Push les changements vers `main`
- [ ] Créer la base PostgreSQL sur Render
- [ ] Créer le Web Service
- [ ] Configurer les variables d'environnement
- [ ] Attendre la première construction et vérifier les logs
- [ ] Tester l'application en ligne
- [ ] Configurer un domaine custom (optionnel)
- [ ] Mettre en place les backups de base de données

