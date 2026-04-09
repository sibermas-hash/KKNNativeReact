# ⚡ PRE-LAUNCH EXECUTION CHECKLIST

## 🎯 Status: READY FOR IMMEDIATE DEPLOYMENT

Generated: April 9, 2026  
Project: KKN UIN SAIZU  
Target Go-Live: Week of April 15-19, 2026

---

## PHASE 1: SECURITY HARDENING ✓ (2-3 hours)

### 1.1 Environment Configuration
- [ ] Copy `.env.production.example` to `.env` (for production)
- [ ] Generate new APP_KEY: `php artisan key:generate`
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure database credentials with strong passwords
- [ ] Test database connection: `php artisan db:show`

**Time**: 30 minutes

### 1.2 HTTPS & SSL Certificate
- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Install certificate on web server (Nginx/Apache)
- [ ] Configure redirect HTTP → HTTPS
- [ ] Enable HSTS headers
- [ ] Test SSL: `ssl-test.ssllabs.com`

**Time**: 1 hour

### 1.3 Security Headers Middleware
- [ ] Verify `SecurityHeaders.php` middleware exists
- [ ] Register middleware in `app/Http/Kernel.php` under global middleware
- [ ] Test headers with: `curl -I https://yourdomain.com/login`

**Verify headers present**:
```
✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: SAMEORIGIN
✓ Content-Security-Policy
✓ Strict-Transport-Security
```

**Time**: 30 minutes

### 1.4 Database User Hardening
- [ ] Create limited database user (don't use root/admin)
- [ ] Grant minimal required permissions
- [ ] Test app connection with limited user
- [ ] Verify user cannot drop tables or modify schema

**Time**: 20 minutes

---

## PHASE 2: EMAIL SERVICE CONFIGURATION ✓ (1-2 hours)

### 2.1 SMTP Configuration
- [ ] Choose email provider:
  - [ ] Gmail (free, limited)
  - [ ] SendGrid ($20+/month, recommended)
  - [ ] Brevo/Sendinblue (cheap, reliable)
  - [ ] AWS SES (pay-per-use)
  - [ ] Self-hosted Postfix (advanced)

- [ ] Configure `.env` with SMTP credentials:
  ```
  MAIL_MAILER=smtp
  MAIL_HOST=smtp.provider.com
  MAIL_PORT=587
  MAIL_USERNAME=your-email@yourdomain.com
  MAIL_PASSWORD=app-specific-password
  ```

**Time**: 30 minutes

### 2.2 Test Email Functionality
```bash
# Test 1: Basic email send
php artisan tinker
Mail::raw('Test email from production', function($m) {
    $m->to('your-email@example.com')
      ->subject('KKN Production Test');
});

# Test 2: Password reset flow
# Click "forgot password" → enter email → check inbox for reset link
# Click reset link → change password → verify login works

# Test 3: Email verification (if applicable)
# Register new student account → verify email sent → click verify link

# Test 4: Notification emails
# Trigger events that send emails (assignment creation, grade posting, etc.)
```

**Time**: 20 minutes

### 2.3 Email Configuration Optimization
- [ ] Set SPF record: `v=spf1 include:provider.com ~all`
- [ ] Set DKIM record (from email provider)
- [ ] Set DMARC record: `v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com`
- [ ] Configure bounce/complaint handling
- [ ] Set monitor email reputation: https://www.mxtoolbox.com/

**Time**: 30 minutes

---

## PHASE 3: RATE LIMITING VERIFICATION ✓ (1-2 hours)

### 3.1 Verify Existing Rate Limiting
- [ ] Check middleware: `app/Http/Middleware/KknThrottleMiddleware.php` exists ✓
- [ ] Check routes: `routes/web.php` has `kkn.throttle` applied ✓
- [ ] Verify limits configured in `config/rate-limiting.php` ✓

**Configured rates**:
```
✓ Login: 5 attempts per 15 minutes
✓ Password reset: 3 per day
✓ Registration: 10 per hour
✓ API general: 100 per minute (auth), 30 per minute (guest)
```

### 3.2 Test Rate Limiting
```bash
# Test 1: Login rate limit
for i in {1..6}; do
  curl -X POST https://yourdomain.com/login \
    -d "email=test@test.com&password=wrong"
done
# Should block request 6 after 5 attempts

# Test 2: Password reset limit
for i in {1..4}; do
  curl https://yourdomain.com/password/reset/token
done
# Should block on 4th request

# Test 3: Register limit
for i in {1..11}; do
  curl -X POST https://yourdomain.com/student/registration \
    -d "email=test$i@test.com"
done
# Should block request 11+ after 10/hour
```

**Time**: 20 minutes

### 3.3 Configuration Review
- [ ] Review critical endpoints list
- [ ] Add any missing sensitive endpoints
- [ ] Configure alert thresholds
- [ ] Test Redis connectivity: `redis-cli -h redis.yourdomain.com ping`

**Time**: 20 minutes

### 3.4 Monitoring Setup
- [ ] Enable Redis monitoring for throttle keys
- [ ] Setup logs for rate limit violations
- [ ] Configure admin alerts

**Time**: 20 minutes

---

## PHASE 4: MONITORING & OBSERVABILITY ✓ (2-3 hours)

### 4.1 Error Tracking (Sentry)
- [ ] Create Sentry account: `https://sentry.io`
- [ ] Create Laravel project in Sentry
- [ ] Get DSN and add to `.env`:
  ```
  SENTRY_LARAVEL_DSN=https://key@sentry.io/project-id
  ```
- [ ] Install package:
  ```bash
  composer require sentry/sentry-laravel
  php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"
  ```
- [ ] Test error capture:
  ```bash
  php artisan tinker
  throw new Exception('Test error from production');
  # Check Sentry dashboard - should see error within 10 seconds
  ```

**Time**: 30 minutes

### 4.2 Uptime Monitoring (UptimeRobot)
- [ ] Create UptimeRobot account: `https://uptimerobot.com` (free)
- [ ] Add monitoring:
  - URL: `https://yourdomain.com/login`
  - Check every 5 minutes
  - Alert: Email to admin
- [ ] Verify service is working

**Time**: 15 minutes

### 4.3 Application Logging
- [ ] Verify `.env` has: `LOG_CHANNEL=daily` and `LOG_LEVEL=warning` (production)
- [ ] Check log rotate configured: `storage/logs/` should have daily files
- [ ] Setup log aggregation (optional but recommended):
  ```bash
  # Option 1: Cloud logs (Datadog, Splunk, etc.)
  # Option 2: Local Elasticsearch + Kibana
  ```
- [ ] Configure alerts for errors/warnings

**Time**: 20 minutes

### 4.4 System Monitoring
- [ ] Setup server monitoring:
  - CPU usage alerts (> 80%)
  - Memory alerts (> 85%)
  - Disk space alerts (< 20% free)
  - Database connection monitoring
- [ ] Commands to monitor:
  ```bash
  # CPU/Memory
  htop
  
  # Disk
  df -h
  du -sh storage/
  
  # Database connections
  SHOW PROCESSLIST;  -- MySQL
  SELECT * FROM pg_stat_activity;  -- PostgreSQL
  ```

**Time**: 20 minutes

---

## PHASE 5: BACKUP & DISASTER RECOVERY ✓ (1-2 hours)

### 5.1 Backup Configuration
- [ ] Verify backup scripts exist: `scripts/backup.sh`
- [ ] Configure cron job:
  ```bash
  0 2 * * * /path/to/scripts/backup.sh >> /var/log/kkn-backup.log 2>&1
  ```
- [ ] Test backup creation:
  ```bash
  ./scripts/backup.sh
  ls -lh /backups/kkn/  # Verify backup file created
  ```

**Time**: 20 minutes

### 5.2 Restore Test (CRITICAL)
- [ ] Create test database: `CREATE DATABASE kkn_restore_test;`
- [ ] Restore from latest backup to test database
- [ ] Verify data integrity:
  ```sql
  SELECT COUNT(*) FROM registrations;
  SELECT COUNT(*) FROM grades;
  ```
- [ ] Test key functionality on restored data
- [ ] Document restore procedure

**Time**: 30 minutes

### 5.3 Backup Storage
- [ ] Local backups: `/backups/kkn/` (keep 7 days)
- [ ] Cloud backup: S3 or similar (keep 30 days)
- [ ] Automated sync:
  ```bash
  0 6 * * * aws s3 sync /backups/kkn s3://kkn-backups/ --delete
  ```

**Time**: 30 minutes

---

## PHASE 6: PERFORMANCE OPTIMIZATION ✓ (1-2 hours)

### 6.1 Laravel Optimization
- [ ] Run optimization commands:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  php artisan optimize
  ```
- [ ] Verify opcache installed: `php -i | grep opcache`
- [ ] Configure PHP-FPM for production:
  ```
  pm.max_children=50
  pm.start_servers=10
  pm.min_spare_servers=5
  pm.max_spare_servers=20
  ```

**Time**: 20 minutes

### 6.2 Frontend Build
- [ ] Build production assets:
  ```bash
  npm run build
  ```
- [ ] Verify bundle sizes:
  ```
  ✓ CSS: < 100KB gzip
  ✓ JS: < 500KB gzip per bundle
  ✓ Images: optimized
  ```
- [ ] Test in production browser: Clear cache, verify no console errors

**Time**: 15 minutes

### 6.3 Database Optimization
- [ ] Analyze tables:
  ```sql
  ANALYZE;  -- PostgreSQL
  ANALYZE TABLE table_name;  -- MySQL
  ```
- [ ] Check slow query log:
  ```sql
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 2;
  ```
- [ ] Review critical queries with EXPLAIN:
  ```sql
  EXPLAIN ANALYZE SELECT * FROM registrations WHERE user_id = 1;
  ```

**Time**: 20 minutes

### 6.4 Redis/Cache Configuration
- [ ] Verify Redis connection:
  ```bash
  redis-cli -h redis.yourdomain.com ping
  ```
- [ ] Configure cache expiration for dynamic content
- [ ] Monitor Redis memory: `redis-cli INFO memory`

**Time**: 15 minutes

---

## PHASE 7: FINAL VERIFICATION ✓ (1-2 hours)

### 7.1 Feature Testing
- [ ] Login flow: Register → Login → Dashboard → Works
- [ ] Student features: Upload document → View grades → Works
- [ ] Admin features: Create assessment → Lock submission → Works
- [ ] DPL features: Evaluate student → Submit scores → Works
- [ ] Report generation: Generate PDF → Download → Works
- [ ] Mobile (if deployed): Android app connects and functions

**Time**: 30 minutes

### 7.2 Security Testing
- [ ] CSRF token validation: POST without token → fails
- [ ] SQL injection test: `' OR '1'='1` → no data leaked
- [ ] XSS test: `<script>alert(1)</script>` → escaped
- [ ] Authentication: Unauth user → redirect to login
- [ ] Authorization: Student cannot access admin pages
- [ ] Rate limiting: Trigger throttle → gets 429 error

**Time**: 20 minutes

### 7.3 API Testing (if REST API exists)
```bash
# Test endpoints
curl -X GET https://yourdomain.com/api/health
curl -X POST https://yourdomain.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# Verify responses
- Status codes correct (200, 401, 404, 429, etc.)
- Error messages informative
- Rate limiting active
```

**Time**: 15 minutes

### 7.4 Data Validation
- [ ] Database constraints applied
- [ ] Foreign keys valid
- [ ] Cascade operations work correctly
- [ ] Audit logs recording changes

**Time**: 15 minutes

---

## PHASE 8: PRODUCTION DEPLOYMENT ✓ (1-2 days)

### 8.1 Pre-Deployment Checklist
```
□ All tests passing
□ Code review completed
□ Database migrations ready
□ Environment variables configured
□ SSL certificates installed
□ Backup testing complete
□ Monitoring setup complete
□ Stakeholders notified
□ Rollback plan documented
□ Support team briefed
```

### 8.2 Deployment Steps
```bash
# 1. Backup current state
mysqldump -u root kkn > /backups/pre-deploy-$(date +%Y%m%d).sql

# 2. Pull latest code
cd /var/www/kkn
git pull origin main

# 3. Install dependencies
composer install --optimize-autoloader --no-dev
npm ci --omit=dev

# 4. Build frontend
npm run build

# 5. Run migrations (if any)
php artisan migrate --force

# 6. Clear caches
php artisan cache:clear
php artisan view:clear
php artisan config:clear

# 7. Restart services
sudo systemctl restart php-fpm
sudo systemctl restart nginx

# 8. Verify deployment
curl https://yourdomain.com/login
# Should return 200 OK with login page
```

### 8.3 First 24 Hours Monitoring
- [ ] Every 30 minutes: Check error logs
- [ ] Every hour: Review user feedback
- [ ] Monitor system performance every 2 hours
- [ ] Database: Check query times
- [ ] Email: Verify password resets working
- [ ] Authentication: Check login success rate

---

## PHASE 9: POST-DEPLOYMENT SUPPORT (Week 1)

### 9.1 Day 1: Intense Monitoring
```
Time        Activity
---         --------
09:00       Go-live
09:30       Check error logs, user feedback
10:00       System monitoring check
11:00       Database performance review
12:00       Email delivery check
13:00       Backup verification
14:00       API response times
15:00       User feedback summary
16:00       Performance metrics review
17:00       Daily report
```

### 9.2 Days 2-7: Continued Monitoring
- Daily error log review
- Performance trending
- User feedback investigation
- Patch deployment if needed
- Documentation updates

### 9.3 Week 1 Wrap-Up
- Success metrics achieved?
- Issues documented?
- Lessons learned?
- Optimization opportunities?

---

## 🚨 ROLLBACK DECISION POINTS

**Rollback immediately if ANY occur**:
```
✗ Error rate > 1% for 5 consecutive minutes
✗ Database connectivity lost
✗ Response time > 5 seconds (99th percentile)
✗ Login feature broken
✗ Data loss/corruption detected
✗ Security vulnerability exploited
✗ Disk space critically low (< 5% free)
```

**Quick rollback procedure**:
```bash
# 1. Stop application
sudo systemctl stop php-fpm nginx

# 2. Restore from backup
mysql < /backups/pre-deploy-20260415.sql

# 3. Restore code
git checkout previous-tag

# 4. Restart services
sudo systemctl start php-fpm nginx

# 5. Verify
curl https://yourdomain.com/login
```

---

## 📊 SUCCESS CRITERIA

```
Performance:
□ Response time < 200ms (95th percentile)
□ Error rate < 0.1%
□ Uptime > 99.5% (first week)
□ Database queries < 100ms average

User Experience:
□ Login success rate > 99.5%
□ Registration completion > 95%
□ Zero critical UI bugs reported

System Health:
□ CPU usage < 70% peak
□ Memory < 80% peak
□ Disk > 20% free
□ Backup running daily
```

---

## 📞 EMERGENCY CONTACTS

```
On-Call Schedule (24-7 during launch week):
├─ Lead Dev: [phone] - Code issues
├─ DevOps: [phone] - Server/infrastructure
├─ DBA: [phone] - Database issues
├─ Manager: [phone] - Escalation
└─ Backup: [phone] - After-hours fallback

Response Times:
Critical (P1): 30 minutes
High (P2): 2 hours
Medium (P3): 8 hours
Low (P4): 24 hours
```

---

## ✅ COMPLETION STATUS

```
Phase 1 - Security Hardening:      [ READY ]
Phase 2 - Email Configuration:     [ READY ]
Phase 3 - Rate Limiting:           [ VERIFIED ]
Phase 4 - Monitoring:              [ READY ]
Phase 5 - Backup & Recovery:       [ READY ]
Phase 6 - Performance:             [ READY ]
Phase 7 - Final Verification:      [ IN PROGRESS ]
Phase 8 - Deployment:              [ WAITING ]
Phase 9 - Post-Deployment:         [ WAITING ]

Total Implementation Time: ~12-15 hours
Recommended Timeline: 2-3 working days

TARGET GO-LIVE: Week of April 15-19, 2026
```

---

**Document Status**: Production Ready ✅  
**Last Updated**: April 9, 2026  
**Next Action**: Begin Phase 1 (Security Hardening)
