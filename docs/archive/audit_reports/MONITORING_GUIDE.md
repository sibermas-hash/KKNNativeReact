# 📊 MONITORING SETUP GUIDE

## Quick Start (15 minutes)

### Option 1: UptimeRobot (Free/Easy)
1. Go to https://uptimerobot.com
2. Sign up for free account
3. Add monitoring:
   - URL: https://yourdomain.com/login
   - Interval: 5 minutes
   - Alert: Email to admin
4. Done! Free coverage.

### Option 2: Sentry (Free/Recommended)
```bash
# 1. Sign up: https://sentry.io (free tier available)
# 2. Create Laravel project
# 3. Install package:
composer require sentry/sentry-laravel

# 4. Add to .env (production):
SENTRY_LARAVEL_DSN=https://key@sentry.io/project-id

# 5. Verify:
php artisan tinker
throw new Exception('Test error');
# Check in Sentry dashboard - error should appear
```

### Option 3: Self-Hosted Monitoring
```bash
# 1. Install Prometheus:
docker run -d --name prometheus \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# 2. Install Grafana:
docker run -d --name grafana \
  -p 3000:3000 \
  grafana/grafana

# 3. Configure dashboards in http://localhost:3000
```

---

## Metrics to Monitor

### Application Level
```
✓ Error rate (target: < 0.1%)
✓ Response time (target: < 200ms)
✓ Active users (concurrent)
✓ Request throughput (requests/sec)
✓ Failed logins (unusual patterns)
✓ Database query time (target: < 100ms)
```

### System Level
```
✓ CPU usage (alert: > 80%)
✓ Memory usage (alert: > 85%)
✓ Disk space (alert: < 20% free)
✓ Network I/O
✓ Database connections (max: 50)
✓ PHP-FPM processes
```

### Business Level
```
✓ Registration success rate
✓ Student dashboard load time
✓ Report generation speed
✓ API response time
✓ Peak hours traffic
```

---

## Alert Configuration

### Critical Alerts (Email immediately)
```
- Error rate > 1% for 5 minutes
- Response time > 1 second
- Database down
- Disk space < 10%
- Server CPU > 95%
```

### Warning Alerts (Email hourly)
```
- Error rate > 0.5%
- Response time > 500ms
- Memory > 75%
- Disk space < 30%
```

---

## Log Monitoring

### Where to Look
```bash
# Application logs:
tail -f storage/logs/laravel.log

# Web server:
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System:
tail -f /var/log/syslog
journalctl -u php-fpm -f  # PHP-FPM logs
```

### Search Patterns
```bash
# Errors:
grep -i "error" storage/logs/laravel.log

# Warnings:
grep -i "warning" storage/logs/laravel.log

# Failed logins:
grep -i "failed login" storage/logs/laravel.log

# Database errors:
grep -i "database\|connection\|query" storage/logs/laravel.log

# Rate limiting hits:
grep -i "too many requests\|throttle" storage/logs/laravel.log
```

---

## Regular Maintenance

### Daily
```bash
# Check error logs
tail -50 storage/logs/laravel.log

# Verify backups ran
ls -lh /backups/kkn/

# Check disk space
df -h

# Monitor active processes
ps aux | grep -i php
```

### Weekly
```bash
# Verify monitoring is working
- Check Sentry dashboard
- Verify alert emails received
- Review error trends

# Database maintenance
- Check slow query log
- Analyze table indexes
- Verify replication (if applicable)
```

### Monthly
```bash
# Performance review
- Analyze response time trends
- Review error patterns
- Check resource utilization

# Security audit
- Review access logs for anomalies
- Check failed auth attempts
- Verify security headers
```

---

## Troubleshooting Common Issues

### High Error Rate
```
1. Check application logs: tail -f storage/logs/laravel.log
2. Review recent code changes: git log --oneline -10
3. Check database connectivity
4. Verify external service availability (email, APIs)
5. Consider temporary rollback if critical
```

### Slow Response Times
```
1. Check database slow query log
2. Review active processes: htop
3. Check memory/CPU usage
4. Clear application cache: php artisan cache:clear
5. Check network connectivity
```

### Database Issues
```
1. Check MySQL/PostgreSQL status
2. Verify disk space: df -h
3. Check connection count: SHOW PROCESSLIST;
4. Review recent migrations
5. Verify backups are available
```

### Memory Leaks
```
1. Monitor memory over time
2. Restart PHP-FPM: sudo systemctl restart php-fpm
3. Check for infinite loops in code
4. Review queue jobs
5. Consider process memory limits
```

---

Status: Ready for implementation  
Last Updated: April 9, 2026
