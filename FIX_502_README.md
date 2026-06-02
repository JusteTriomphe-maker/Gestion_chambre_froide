# 🔧 Fix Erreur 502 Bad Gateway - Render Deployment

## ✅ Problème identifié
L'erreur 502 était due à une **mismatch de communication** entre nginx et PHP-FPM:
- nginx essayait de se connecter via socket Unix (`/var/run/php-fpm.sock`)
- PHP-FPM (Alpine) écoute sur le port TCP `9000`

## ✅ Corrections appliquées

### 1. **nginx.conf**
```diff
- fastcgi_pass unix:/var/run/php-fpm.sock;
+ fastcgi_pass 127.0.0.1:9000;
```

### 2. **.env** (sécurité + production)
```diff
- APP_DEBUG=true
+ APP_DEBUG=false

- APP_URL=http://localhost
+ APP_URL=https://gestion-chambre-froide.onrender.com
```

### 3. **Dockerfile**
Ajouté configuration PHP-FPM pour écouter correctement sur le port 9000:
```dockerfile
RUN echo "[www]" > /usr/local/etc/php-fpm.d/zz-docker.conf && \
    echo "listen = 127.0.0.1:9000" >> /usr/local/etc/php-fpm.d/zz-docker.conf && \
    # ... configuration PM (process manager)
```

---

## 📍 Prochaines étapes

### 1️⃣ Git Push
```bash
git add .
git commit -m "fix: Fix 502 Bad Gateway - Configure nginx TCP connection to PHP-FPM port 9000"
git push origin main
```

### 2️⃣ Vérifier les variables d'environnement sur Render

Allez sur votre dashboard Render et vérifiez que vos **Environment Variables** incluent:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://gestion-chambre-froide.onrender.com
APP_KEY=base64:vqrNInqJZu4Qdvq2I4109IVfC1RsqXk+fIYt40WZ6VA=

DB_CONNECTION=pgsql
DB_HOST=dpg-XXXXX.render.internal      ← Récupérer de votre BD Render
DB_PORT=5432
DB_DATABASE=chambre_froide
DB_USERNAME=chambre_froide_user          ← Selon votre config BD
DB_PASSWORD=XXXXX                        ← Selon votre config BD
```

⚠️ **Important**: Le `DB_HOST` doit être l'adresse **interne Render** de votre BD PostgreSQL (pas `127.0.0.1` !)

### 3️⃣ Déclencher un nouveau déploiement

- Render redéploiera automatiquement après le `git push`
- OU allez dans Render Dashboard > Web Service > "Trigger Deploy" > "Deploy"

### 4️⃣ Test
```
https://gestion-chambre-froide.onrender.com
```

---

## 🔍 Dépannage si toujours 502

Vérifiez les logs Render:

```bash
# Depuis Render Dashboard > Web Service > Logs
# Cherchez les erreurs PHP-FPM ou nginx
```

Commandes à essayer:
- `php artisan config:cache --force`
- `php artisan route:cache --force`
- Redémarrer le service (Render Dashboard > Web Service > Manual Restart)

---

## ✨ Optimisations supplémentaires (optionnel)

Si la performance est lente:
1. **Cache Driver**: Changer de `file` à `redis` (ajouter service Redis sur Render)
2. **Session Driver**: Changer de `file` à `redis`
3. **Log Level**: Réduire de `debug` à `info` en production

```env
LOG_LEVEL=info
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

---

## 📚 Références
- RENDER_DEPLOYMENT_GUIDE.md - Guide complet de déploiement
- DEPLOY_RENDER_TODO.md - Checklist de déploiement
