---
description: How to deploy changes to the KKN production server
---
// turbo-all

## Deploy to Production

1. Stage and commit all changes:
```bash
git add -A
git commit -m "your commit message here"
```

2. Push to GitHub:
```bash
git push origin main
```

3. SSH to server and pull:
```bash
ssh -o ProxyCommand="cloudflared access ssh --hostname server.infiatin.cloud" tholib_server@server.infiatin.cloud "cd /var/www/kknuinsaizu && git pull origin main"
```

4. Run migrations (if any new migrations):
```bash
ssh -o ProxyCommand="cloudflared access ssh --hostname server.infiatin.cloud" tholib_server@server.infiatin.cloud "cd /var/www/kknuinsaizu && php artisan migrate --force"
```

5. Build frontend (if any JS/TS/CSS changes):
```bash
ssh -o ProxyCommand="cloudflared access ssh --hostname server.infiatin.cloud" tholib_server@server.infiatin.cloud "cd /var/www/kknuinsaizu && npm run build"
```

6. Clear caches:
```bash
ssh -o ProxyCommand="cloudflared access ssh --hostname server.infiatin.cloud" tholib_server@server.infiatin.cloud "cd /var/www/kknuinsaizu && php artisan config:cache && php artisan route:cache && php artisan view:cache"
```
