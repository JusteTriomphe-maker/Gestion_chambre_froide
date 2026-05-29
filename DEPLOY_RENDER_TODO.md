# Déploiement Render (Laravel + Vite/Inertia)

## 1) Côté Render
- [ ] Créer un **PostgreSQL** (si besoin) + récupérer `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
- [ ] Créer un **Web Service** : `Custom`
- [ ] Branch : `main`
- [ ] Build command :
  - [ ] `composer install --no-dev --optimize-autoloader`
  - [ ] `npm ci`
  - [ ] `npm run build`
- [ ] Start command :
  - [ ] `php artisan serve --host 0.0.0.0 --port $PORT`
- [ ] Environment variables (au minimum) :
  - [ ] `APP_ENV=production`
  - [ ] `APP_DEBUG=false`
  - [ ] `APP_URL=https://<ton-url>`
  - [ ] `APP_KEY=<valeur de ton .env>`
  - [ ] `DB_CONNECTION=pgsql`
  - [ ] `DB_HOST`
  - [ ] `DB_PORT`
  - [ ] `DB_DATABASE`
  - [ ] `DB_USERNAME`
  - [ ] `DB_PASSWORD`

## 2) Migrations
- [ ] Après le premier build, exécuter : `php artisan migrate --force`
- [ ] Vérifier les seeds si nécessaire.

## 3) Vérifications
- [ ] Tester l’URL publique (connexion, pages Inertia, API).
- [ ] Si erreurs : consulter les logs Render.


