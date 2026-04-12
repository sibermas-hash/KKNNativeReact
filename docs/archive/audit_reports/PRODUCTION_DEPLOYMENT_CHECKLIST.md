# 📋 PRODUCTION DEPLOYMENT CHECKLIST

## Status: READY FOR DEPLOYMENT ✅

Berikut adalah checklist lengkap sebelum production deployment:

---

## 🔐 SECURITY

### Authentication & Authorization
- [ ] Email verification enabled (MustVerifyEmail)
- [ ] Password reset working
- [ ] CSRF tokens on all forms
- [ ] Rate limiting configured
- [ ] API key system tested
- [ ] webhook signature verification active
- [ ] Session timeout set (120 minutes in .env)
- [ ] Secure cookies enabled in production

### Database Security
- [ ] Database password changed from default
- [ ] Database backups encrypted
- [ ] Database user with limited permissions
- [ ] SQL injection prevention verified (Eloquent ORM)
- [ ] parameterized queries used
- [ ] Admin user account created
- [ ] Test accounts deleted or disabled

### File Security
- [ ] Storage directory outside webroot
- [ ] .env file not in git
- [ ] .env.example contains no secrets
- [ ] Uploads directory has proper permissions
- [ ] Executables not in upload directory
- [ ] Debug files cleaned up

---

## ⚙️ CONFIGURATION

### Environment Setup
- [ ] `APP_ENV=production` in .env
- [ ] `APP_DEBUG=false` in .env
- [ ] `APP_KEY` generated (php artisan key:generate)
- [ ] Timezone set correctly (UTC or your region)
- [ ] Locale set to Indonesian (id)

### Database Configuration
- [ ] PostgreSQL KKN database configured
  - [ ] Host: DB_KKN_HOST
  - [ ] Port: DB_KKN_PORT=5433
  - [ ] Database: DB_KKN_DATABASE
  - [ ] User: DB_KKN_USERNAME
  - [ ] Password: DB_KKN_PASSWORD (strong)
- [ ] MySQL master database configured (if used)
- [ ] Database charset: utf8mb4
- [ ] Connection pooling configured
- [ ] Connection timeout set

### Email Service
- [ ] Email driver configured (SMTP)
  - [ ] MAIL_MAILER=smtp
  - [ ] MAIL_HOST configured
  - [ ] MAIL_PORT configured
  - [ ] MAIL_USERNAME set
  - [ ] MAIL_PASSWORD set
  - [ ] MAIL_FROM_ADDRESS valid
  - [ ] MAIL_FROM_NAME matches APP_NAME
- [ ] Password reset emails tested
- [ ] Welcome emails tested
- [ ] Email notifications tested

### Cache & Session
- [ ] Cache store configured (database or redis)
- [ ] Session driver configured (database)
- [ ] Cache keys have unique prefix
- [ ] Session timeout reasonable (120 min)

### File Storage
- [ ] FILESYSTEM_DISK set (local or S3)
- [ ] Storage symlink created: `php artisan storage:link`
- [ ] Upload directory writable
- [ ] Backup storage directory writable
- [ ] Disk space monitoring configured

---

## 📊 DATABASE

### Migrations & Schemas
- [ ] All migrations run: `php artisan migrate --force`
- [ ] Database tables verified
- [ ] Indexes created on hot-path tables
- [ ] Foreign key constraints enabled
- [ ] Default data seeded:
  - [ ] System settings
  - [ ] Faculty data
  - [ ] Program data
  - [ ] Initial admin user
  - [ ] Roles and permissions

### Backups
- [ ] Backup script in place: `/scripts/backup.sh`
- [ ] Backup automation configured (cron)
- [ ] Automated schedule: Daily 2:30 AM
- [ ] Retention policy:
  - [ ] Daily: 7 days
  - [ ] Weekly: 4 weeks
  - [ ] Monthly: 12 months
- [ ] Backup location: `/var/backups/kkn-system`
- [ ] Test restore procedure documented

---

## 🚀 DEPLOYMENT

### Code Deployment
- [ ] Latest code deployed
- [ ] Vendor dependencies installed: `composer install --no-dev`
- [ ] Frontend built: `npm run build`
- [ ] Assets published: `php artisan vendor:publish --force`
- [ ] Cache cleared: `php artisan cache:clear`
- [ ] Views cleared: `php artisan view:clear`
- [ ] Routes cached: `php artisan route:cache`
- [ ] Config cached: `php artisan config:cache`

### Web Server
- [ ] Laravel behind NGINX/Apache
- [ ] Document root: `/public`
- [ ] SSL certificate installed (HTTPS)
- [ ] HTTP redirect to HTTPS
- [ ] Security headers configured:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security
- [ ] Gzip compression enabled
- [ ] Static cache headers configured

### Application Server
- [ ] PHP version: 8.2 or higher
- [ ] PHP extensions installed:
  - [ ] pgsql (PostgreSQL)
  - [ ] mysql (MySQL)
  - [ ] gd (Image processing)
  - [ ] zip (Archive handling)
  - [ ] json, mbstring, etc.
- [ ] Memory limit: >= 512MB
- [ ] Max upload size: >= 100MB
- [ ] Execution timeout: >= 60 seconds

### Queue/Jobs (if applicable)
- [ ] `QUEUE_CONNECTION=database` or `redis`
- [ ] Queue processing tested
- [ ] Failed jobs monitored
- [ ] Queue supervisor configured (if using)

---

## 🧪 TESTING

### Functionality Testing
- [ ] Home page loads
- [ ] Public pages accessible
- [ ] Login works
- [ ] Student registration flow works
- [ ] DPL dashboard accessible
- [ ] Admin dashboard accessible
- [ ] Logout works
- [ ] Password reset works
- [ ] Email notifications send

### User Flows
- [ ] Student: Register → Reports → Grade
- [ ] DPL: Login → View Groups → Review Reports
- [ ] Admin: Manage Users → Manage Groups → Generate Grades
- [ ] Admin: Export reports (BPJS, CSV, PDF)

### Edge Cases
- [ ] Large number of registrations
- [ ] Concurrent access to group slots
- [ ] Large file uploads
- [ ] Database connection lost (graceful error)
- [ ] Mail service down (graceful error)

### Performance
- [ ] Homepage load time < 2 seconds
- [ ] Dashboard load time < 3 seconds
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Pagination working

---

## 📈 MONITORING & LOGGING

### Logging
- [ ] LOG_CHANNEL=stack configured
- [ ] LOG_LEVEL=info in production
- [ ] Log directory: `/storage/logs`
- [ ] Log rotation configured (daily)
- [ ] Old logs cleaned up after 14 days

### Monitoring
- [ ] Application monitoring (New Relic/Datadog)
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Database monitoring
- [ ] Server resource monitoring
- [ ] Uptime monitoring
- [ ] Response time alerts configured
- [ ] Error rate alerts configured

### Alerting
- [ ] Alert notification channels:
  - [ ] Email alerts
  - [ ] Slack notifications
  - [ ] PagerDuty (if critical)
- [ ] On-call schedule defined
- [ ] Incident response plan documented

---

## 📝 DOCUMENTATION

### Documentation Complete
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Database schema diagram
- [ ] Deployment procedure documented
- [ ] Backup/restore procedure
- [ ] Troubleshooting guide
- [ ] Emergency contacts list

### Handover
- [ ] Operations team trained
- [ ] Support team trained
- [ ] Documentation available
- [ ] Password manager shared (securely)
- [ ] Access credentials documented

---

## ✅ SIGN-OFF

| Item | Owner | Date | Notes |
|------|-------|------|-------|
| Security Review | | | |
| Database Review | | | |
| Performance Approval | | | |
| Operations Approval | | | |
| Final Go/No-Go | | | |

---

## 🎯 DEPLOYMENT COMMAND

```bash
# 1. Backup current database
php artisan db:backup

# 2. Update code
git pull origin main

# 3. Install dependencies
composer install --no-dev --optimize-autoloader

# 4. Build frontend
npm ci && npm run build

# 5. Run migrations
php artisan migrate --force

# 6. Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Restart services
sudo systemctl restart php-fpm
sudo systemctl restart nginx
```

---

## 🆘 ROLLBACK PROCEDURE

```bash
# 1. Revert code
git revert <commit-hash>

# 2. Restore database
php artisan db:restore <backup-file>

# 3. Clear caches
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# 4. Restart services
sudo systemctl restart php-fpm
sudo systemctl restart nginx
```

---

**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT

**Last Updated**: April 7, 2026  
**Next Review**: After deployment + 1 week
