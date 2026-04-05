---
description: How to maintain the project locally (Deployment placeholder)
---
// turbo-all

## Local Project Maintenance

1. Stage and commit all changes:
```bash
git add -A
git commit -m "your commit message here"
```

2. Push to GitHub (Remote Storage):
```bash
git push origin main
```

3. Local Verification:
```bash
php artisan migrate
npm run build
php artisan optimize
```

> [!NOTE]
> Production server (`server.infiatin.cloud`) has been decommissioned. 
> All operations currently focus on Local/Staging environment.
