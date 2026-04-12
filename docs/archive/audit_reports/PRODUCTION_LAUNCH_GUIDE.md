# ⚡ PRODUCTION CONFIGURATION GUIDE - KKN UIN SAIZU
**Status**: Ready for immediate deployment  
**Date**: April 9, 2026  
**Version**: 1.0

---

## 📋 PRE-LAUNCH CHECKLIST (1-2 minggu)

### BLOCK 1: SECURITY HARDENING (2-3 jam)

#### 1.1 Environment Configuration
```bash
# .env production settings
APP_ENV=production              # CRITICAL: Production mode
APP_DEBUG=false                 # CRITICAL: Disable debug
DEBUGBAR_ENABLED=false          # Disable debugbar completely
SESSION_DOMAIN=yourdomain.com   # Set proper domain
SESSION_SECURE_COOKIES=true     # HTTPS only
SESSION_HTTP_ONLY=true          # Prevent JavaScript access

# Encryption
APP_CIPHER=AES-256-CBC         # Strong encryption
APP_KEY=<generated-key>         # Use: php artisan key:generate
```

#### 1.2 HTTPS & SSL
```bash
# Before production:
1. Obtain SSL certificate (Let's Encrypt recommended)
2. Configure Nginx/Apache for HTTPS
3. Redirect HTTP → HTTPS
4. Enable HSTS headers
5. Test with: https://www.ssllabs.com/ssltest/

# Nginx example:
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000";
}
```

#### 1.3 Database Hardening
```sql
-- Create limited user for app (don't use root/admin)
CREATE USER 'kkn_app'@'localhost' IDENTIFIED BY 'strong-password-here';
GRANT SELECT, INSERT, UPDATE, DELETE ON kkn.* TO 'kkn_app'@'localhost';

-- For PostgreSQL:
CREATE USER kkn_app WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE kkn TO kkn_app;
GRANT USAGE ON SCHEMA public TO kkn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kkn_app;
```

#### 1.4 Security Headers
```php
// Already implemented in app\Http\Middleware\CspHeaders.php
// Verify these headers are sent:
✓ Content-Security-Policy
✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: SAMEORIGIN
✓ X-XSS-Protection
✓ Referrer-Policy: strict-origin-when-cross-origin
```

---

### BLOCK 2: EMAIL SERVICE CONFIGURATION (1-2 jam)

#### 2.1 SMTP Setup
```bash
# .env production
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com          # Or your provider
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password   # Use app-specific password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="KKN UIN SAIZU"

# For production:
# 1. Use dedicated email service (SendGrid, AWS SES, Brevo)
# 2. Setup SPF, DKIM, DMARC records
# 3. Monitor bounce/complaint rates
# 4. Configure return path
```

#### 2.2 Test Email Service
```bash
# Test script:
php artisan tinker
Mail::raw('Test email', function($m) {
    $m->to('test@example.com')->subject('Test');
});

# Check logged emails:
tail -f storage/logs/laravel.log | grep -i mail
```

#### 2.3 Email Templates Verification
```php
// Test all email types before launch:
✓ Password reset (app/Mail/ResetPassword.php)
✓ Email verification (built-in)
✓ Notifications (app/Notifications/)
✓ Admin alerts (if any)

// Test with:
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### BLOCK 3: RATE LIMITING (1-2 jam)

#### 3.1 Current Rate Limiting (Already Configured ✓)
```php
// routes/web.php
Route::middleware(['guest', 'kkn.throttle'])->group(function() {
    // Login: 5 attempts per 15 minutes
    // Password reset: 3 attempts per day
    // Certificate verification: 20/minute
});
```

#### 3.2 Recommended Additional Limits
```php
// Add to routes/api.php:
Route::middleware(['auth:sanctum', 'throttle:100,1'])->group(function() {
    // API endpoints: 100 requests per minute
});

Route::middleware('throttle:30,1']->group(function() {
    // Public endpoints: 30 requests per minute
});

// Critical endpoints need stricter limits:
'password.email' => '3,1440',  // 3 per day
'login.store' => '5,15',       // 5 per 15 minutes
'student.registration.store' => '10,60', // 10 per hour
```

#### 3.3 Rate Limit Monitoring
```bash
# Check rate limit hits:
php artisan monitor:throttle

# View in Redis:
redis-cli KEYS "*throttle*"

# Alerts if threshold exceeded:
- Email to admin if 100+ hits/hour
- Log suspicious IP addresses
- Implement captcha after N failures
```

---

### BLOCK 4: MONITORING & LOGGING (3-4 jam)

#### 4.1 Application Monitoring Setup

**Option A: Self-Hosted (Recommended for budget)**
```bash
# Install monitoring tools:
1. Prometheus (metrics collection)
2. Grafana (visualization)
3. AlertManager (notifications)
4. ELK Stack (logs - optional)

# Cost: $0 (open-source)
# Setup time: 2-3 hours
```

**Option B: SaaS (Recommended for simplicity)**
```bash
# Services to consider:
- Sentry (error tracking) - Free tier available
- DataDog (APM) - $15-50/month
- New Relic (APM) - $20-60/month
- UptimeRobot (uptime) - Free tier available
```

#### 4.2 Logging Configuration
```php
// config/logging.php already set to:
'stack' => ['single', 'daily']

// Recommended for production:
LOG_CHANNEL=daily
LOG_LEVEL=warning  // Don't log debug in production

// Monitor these logs:
storage/logs/laravel.log  // Application errors
storage/logs/laravel-YYYY-MM-DD.log  // Daily rotation
```

#### 4.3 Error Tracking Setup (Simple)
```php
// Add to app/Providers/AppServiceProvider.php:
public function boot()
{
    if (app()->environment('production')) {
        // Option 1: Email errors
        Log::useLogChannel('stack');
        
        // Option 2: Send to Sentry (free tier)
        if (env('SENTRY_LARAVEL_DSN')) {
            Sentry::captureException($exception);
        }
    }
}

// .env
SENTRY_LARAVEL_DSN=https://your-sentry-key@sentry.io/project-id
```

#### 4.4 Database Performance Monitoring
```sql
-- Enable slow query log (MySQL/PostgreSQL)
-- Log queries taking > 2 seconds

-- Check indexes:
EXPLAIN ANALYZE SELECT * FROM registrations WHERE user_id = 1;

-- Monitor connections:
SHOW PROCESSLIST;  -- MySQL
SELECT * FROM pg_stat_activity;  -- PostgreSQL
```

---

### BLOCK 5: BACKUP & DISASTER RECOVERY (1-2 jam)

#### 5.1 Automated Backup Configuration
```bash
# Scripts already available:
scripts/backup.sh          # Run daily
scripts/production-setup.sh # One-time setup

# Setup cron job:
0 2 * * * /path/to/script/backup.sh >> /var/log/kkn-backup.log 2>&1

# Backup schedule:
- Daily: Last 7 days (local storage)
- Weekly: Last 4 weeks (cloud storage)
- Monthly: Last 12 months (cold storage)
```

#### 5.2 Test Restore Process
```bash
# CRITICAL before going live:
1. Create backup: ./scripts/backup.sh
2. Verify backup integrity: gz integrity check
3. Test restore on staging server
4. Verify data consistency
5. Document restore procedure

# Estimated time: 1 hour
```

#### 5.3 Backup Verification Script
```bash
#!/bin/bash
# Add to cron: Run daily at 3 AM

BACKUP_DIR="/backups/kkn"
LOG_FILE="/var/log/kkn-backup-verify.log"

# Check backup size
SIZE=$(du -sh $BACKUP_DIR/* | grep -v total)
if [ $SIZE -lt 100M ]; then
    echo "WARNING: Backup size too small: $SIZE" >> $LOG_FILE
    mail -s "KKN Backup Alert" admin@domain.com
fi

# Check backup age
AGE=$(find $BACKUP_DIR -name "*.gz" -mtime +1)
if [ ! -z "$AGE" ]; then
    echo "WARNING: Backup older than 1 day" >> $LOG_FILE
fi
```

---

### BLOCK 6: PERFORMANCE OPTIMIZATION (2-3 jam)

#### 6.1 Laravel Optimization
```bash
# Before production deployment:
php artisan config:cache      # Cache configs
php artisan route:cache       # Cache routes
php artisan view:cache        # Cache views
php artisan migrate --force   # Ensure DB migrated

# Clear before deployment:
php artisan cache:clear
php artisan view:clear
php artisan config:clear
```

#### 6.2 Frontend Optimization
```bash
# Build optimized assets:
npm run build  # Production build

# Verify:
- CSS minified: < 100KB
- JS bundles: < 500KB each
- Images optimized
- No console errors/warnings
```

#### 6.3 Database Optimization
```sql
-- Analyze indexes (run quarterly):
ANALYZE;

-- Check query performance:
SET SESSION query_cache_type = ON;

-- Recommended indices already applied ✓
-- Monitor slow queries:
SET SESSION long_query_time = 2;
SET SESSION log_slow_queries = 'ON';
```

---

### BLOCK 7: DEPLOYMENT STRATEGY (3-5 hari)

#### 7.1 Pre-Deployment Checklist
```
□ All tests passing (if any)
□ Database migrations ready
□ Environment variables configured
□ SSL certificates installed
□ Backup restoration tested
□ Rate limiting verified
□ Email service tested
□ Monitoring setup complete
□ Security headers verified
□ Performance baseline measured
□ Documentation updated
□ Stakeholders notified
```

#### 7.2 Deployment Steps
```bash
# 1. Backup existing data
mysqldump -u root kkn > backup-before-deploy.sql

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
composer install --optimize-autoloader --no-dev
npm ci --omit=dev

# 4. Build frontend
npm run build

# 5. Run migrations
php artisan migrate --force

# 6. Clear caches
php artisan cache:clear

# 7. Restart queue (if using)
php artisan queue:restart

# 8. Restart application
sudo systemctl restart php-fpm  # or equivalent
sudo systemctl restart nginx   # or Apache

# 9. Verify deployment
curl https://yourdomain.com/login  # Should load successfully
```

#### 7.3 Rollback Plan (If Needed)
```bash
# Keep previous version ready:
tar czf /backup/releases/kkn-$(date +%Y%m%d).tar.gz /var/www/kkn

# Quick rollback:
1. Stop application
2. Restore from backup
3. Restart services
4. Verify functionality
5. Investigate issue
```

---

### BLOCK 8: POST-DEPLOYMENT MONITORING (First 48 hours)

#### 8.1 Real-Time Monitoring
```bash
# Watch these metrics:
- Error rate (should be < 0.1%)
- Response time (should be < 200ms)
- Database connections (should be stable)
- CPU usage (should be < 80%)
- Memory usage (should be < 85%)
- Disk space (should have > 20% free)

# Commands:
# Monitor logs live:
tail -f storage/logs/laravel.log

# Monitor system:
htop
iotop
nethogs
```

#### 8.2 Quick Rollback Decision Points
```
Rollback if ANY of these occur:
✗ Error rate > 1% for 5 minutes
✗ Response time > 1 second (avg)
✗ Database connection failures
✗ Critical security issues detected
✗ Data loss or corruption
✗ User login failures > 5%

Wait & monitor if:
✓ Warnings/minor errors
✓ Slightly elevated CPU
✓ Performance degradation < 20%
```

---

## 🎯 DEPLOYMENT TIMELINE

```
Week 1 (April 9-12):
├─ Mon: Final security audit
├─ Tue: Email & monitoring setup  
├─ Wed: Load testing & optimization
└─ Thu: Soft launch (internal users)

Week 2 (April 15-19):
├─ Mon: Beta testing (50 users)
├─ Tue: Collect feedback & fix bugs
├─ Wed: Production deployment prep
├─ Thu: Go-live (limited rollout)
└─ Fri: Monitor & stabilize

Week 3+ (April 22+):
├─ Gradual expansion (10% → 50% → 100%)
├─ Continuous monitoring
├─ Bug fixes as needed
└─ Performance optimization
```

---

## 📊 SUCCESS METRICS

```
Performance:
✓ Response time < 200ms (95th percentile)
✓ Error rate < 0.1%
✓ Uptime > 99.9%
✓ Page load time < 3s

User Experience:
✓ Login success rate > 99%
✓ Registration completion > 95%
✓ No UI errors/crashes

System:
✓ CPU usage < 70% peak
✓ Memory < 80% peak
✓ Disk > 20% free
✓ Database queries < 100ms (avg)
```

---

## 📞 SUPPORT CONTACTS

```
During Go-Live (24-7):
├─ Lead Developer: [phone/email]
├─ DevOps: [phone/email]
├─ Database Admin: [phone/email]
└─ On-call Manager: [phone/email]

Issues Dashboard:
- Critical: Immediate response
- High: < 1 hour response
- Medium: < 4 hour response
- Low: < 24 hour response
```

---

**Created**: April 9, 2026  
**Status**: Ready for implementation  
**Next Step**: Execute pre-launch checklist items in order
