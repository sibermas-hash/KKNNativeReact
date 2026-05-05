# SIBERMAS Security Guide

Complete security guidelines and best practices for SIBERMAS (KKN Management System).

## 🔒 Security Overview

### Security Layers

SIBERMAS implements a multi-layered security approach:

1. **Network Security** - HTTPS, SSL/TLS, Firewall
2. **Authentication** - CAPTCHA, Rate limiting, Session management
3. **Authorization** - RBAC, Permission checks, Phase validation
4. **Input Validation** - Form validation, File upload validation
5. **Output Security** - XSS prevention, Response envelope, Error handling

## 🛡️ Authentication Security

### CAPTCHA Implementation

**Features:**
- Redis-backed storage
- Argon2id-hashed answers
- 5-minute TTL
- One-time use
- Random math questions

**Configuration:**

```php
// CaptchaService.php
- UUID-based captcha_id
- Math questions (12 + 7 = ?)
- Answer range: 1-20
- Stats tracking
- Automatic cleanup
```

**Best Practices:**
- Never store plain text answers
- Use Argon2id for hashing
- Implement rate limiting
- Log failed attempts

### Password Safety

**Hashing:**
```php
// Argon2id configuration
'memory' => 2^17,  // 128MB
'time' => 4,
'threads' => 2
```

**Rules:**
- Minimum 8 characters
- Require mixed case
- Require at least 1 number
- Force password change for first login
- Expiration: 30 days (configurable)

**Best Practices:**
- Never log passwords
- Use Argon2id, not bcrypt
- Implement password strength meter
- Change password requirements by role

### Session Management

**Sanctum Configuration:**
```php
'expiration' => 43200,  // 30 days
'stateful' => ['sibermas.uinsaizu.ac.id', 'localhost']
```

**Best Practices:**
- Use secure cookies only
- Implement session timeout
- Regenerate session ID on login
- Invalidate on password change
- Logout from all devices option

### Rate Limiting

**Configuration:**
```php
// Auth endpoints
'throttle:10,1'  // 10 requests per minute

// API endpoints
'throttle:60,1'  // 60 requests per minute

// Public endpoints
'throttle:60,1'  // 60 requests per minute
```

**Implementation:**
```php
// Middleware
RateLimiter::hit($key, $decaySeconds);
RateLimiter::tooManyAttempts($key, $maxAttempts);
RateLimiter::availableIn($key);
RateLimiter::clear($key);
```

**Best Practices:**
- Implement progressive delays
- Log rate limit hits
- Whitelist admin IPs
- Differentiate by user role

## 👤 Authorization Security

### Role-Based Access Control (RBAC)

**Role Hierarchy:**
```
superadmin (Full access)
├── admin (Operational)
│   └── faculty_admin (Faculty-scoped)
├── dosen (Lecturer)
│   └── dpl (Field supervisor)
└── student (KKN participant)
```

**Permission Examples:**
```php
// Student permissions
'daily_report.create'
'daily_report.update'
'daily_report.delete'
'program_kerja.create'
'profile.update'

// DPL permissions
'daily_report.approve'
'daily_report.request_revision'
'evaluasi.submit'
'monitoring.create'

// Admin permissions
'periode.manage'
'kelompok.manage'
'peserta.manage'
'user.manage'
'system.settings'
```

**Implementation:**
```php
// Controller check
$this->authorize('view', $report);

// Route middleware
Route::middleware('permission:daily_report.approve');

// Blade directive
@can('update', $user)
@endcan
```

**Best Practices:**
- Use least privilege principle
- Implement permission inheritance
- Log permission denials
- Regular permission audits

### Phase Validation

**Middleware:**
```php
// EnsurePhase
- Check current period phase
- Block operations outside phase
- Return appropriate error code

// Errors
PHASE_BLOCKED (403)
```

**Best Practices:**
- Clear error messages
- Log phase transitions
- Notify users of phase changes
- Test phase transitions

### Profile Validation

**Middleware:**
```php
// EnsureProfileCompleted
- Check required fields
- Block sensitive operations
- Return PROFILE_INCOMPLETE error

// Errors
PROFILE_INCOMPLETE (403)
```

**Best Practices:**
- Required fields by role
- Progressive completion
- Clear indicators
- Skip on non-sensitive routes

## 🔐 API Security

### CORS Configuration

**Settings:**
```php
'allowed_origins' => [
    'https://sibermas.uinsaizu.ac.id',
    'http://localhost:3000',
]
'allowed_methods' => ['*']
'allowed_headers' => ['*']
'supports_credentials' => true
```

**Best Practices:**
- Whitelist only necessary origins
- Use specific methods in production
- Enable credentials for auth
- Log CORS errors

### API Key Management

**Features:**
- Unique tokens (UUID-based)
- Permissions-based access
- Expiration tracking
- Revocation support
- Usage logging

**Implementation:**
```php
// Middleware
ValidateApiKey
- Check x-api-key header
- Validate against stored keys
- Check active status
- Log usage asynchronously
```

**Best Practices:**
- Audit key usage
- Regular key rotation
- Minimum necessary permissions
- Revoke unused keys

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Terjadi kesalahan"
  }
}
```

**Best Practices:**
- Consistent format
- No stack traces in production
- Sensitive filtering
- Error logging

## 📁 File Upload Security

### Validation

**Magic Bytes:**
```php
// Allowed types
'image/jpeg'  => FF D8 FF
'image/png'   => 89 50 4E 47
'application/pdf' => 25 50 44 46
```

**Size Limits:**
- Avatar: 2MB
- Report photo: 5MB
- Documents: 10MB
- Final report: 10MB

**Implementation:**
```php
// Validate file type
$this->validate([
    'file' => 'required|mimes:jpg,jpeg,png,pdf|max:10240'
]);

// Check magic bytes
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($uploadedFile->getPathname());
```

**Best Practices:**
- Always validate magic bytes
- Sanitize filenames
- Use secure storage
- Implement virus scanning (if possible)

### Storage Security

**S3 Configuration:**
```php
'bucket' => env('AWS_BUCKET'),
'region' => env('AWS_DEFAULT_REGION'),
'url' => env('AWS_URL'),
'visibility' => 'private',
```

**Best Practices:**
- Use bucket policies
- Enable logging
- Implement backup
- Regular security audits

## 🌐 Web Security

### XSS Prevention

**Implementation:**
```php
// DOMPurify sanitization
DOMPurify::sanitize($userInput)
```

**Best Practices:**
- Sanitize all user input
- Use Content Security Policy
- Validate on both client and server
- Log XSS attempts

### CSRF Protection

**Sanctum Configuration:**
```php
'middleware' => [
    'validate_csrf_token' => PreventRequestForgery::class,
]
```

**Best Practices:**
- Always include CSRF token
- Validate on form submissions
- Use secure tokens
- Rotate tokens periodically

### Content Security Policy

**Headers:**
```php
Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src * data:;
    connect-src 'self';
    font-src 'self';
    frame-ancestors 'self';
```

**Best Practices:**
- Start strict, relax as needed
- Report violations
- Log CSP errors
- Review regularly

## 💾 Database Security

### SQL Injection Prevention

**Implementation:**
```php
// Use Eloquent ORM (parameterized queries)
User::where('email', $email)->first();

// Avoid raw queries
DB::select("SELECT * FROM users WHERE email = ?", [$email]);
```

**Best Practices:**
- Always use parameterized queries
- Validate input before queries
- Use Eloquent ORM
- Log slow queries

### Connection Security

**Configuration:**
```env
DB_SSLMODE=require
```

**Best Practices:**
- Use SSL/TLS for connections
- Validate certificates
- Use strong passwords
- Regular password rotation

### Backup Security

**Best Practices:**
- Encrypt backups
- Store offsite
- Regular backups
- Test restores
- Backup access logs

## 🔍 Logging & Monitoring

### Security Logs

**Events to Log:**
- Failed login attempts
- Permission denials
- CAPTCHA failures
- Rate limit hits
- File upload attempts
- Password changes
- Admin actions

**Implementation:**
```php
Log::warning('Security event', [
    'type' => 'failed_login',
    'ip' => request()->ip(),
    'user_agent' => request()->userAgent(),
    'email' => $email,
]);
```

**Best Practices:**
- Log important security events
- Include context (IP, user agent)
- Use appropriate log levels
- Regular log review
- Secure log storage

### Intrusion Detection

**Indicators:**
- Multiple failed logins
- Unusual access patterns
- Unauthorized access attempts
- Data exfiltration
- Privilege escalation

**Best Practices:**
- Implement alerts
- Threshold-based detection
- Automated response
- Manual review critical events
- Keep detection rules updated

## 🚨 Incident Response

### Security Incident Response

**Immediate Actions:**
1. Identify scope of breach
2. Contain the incident
3. Preserve evidence
4. Notify stakeholders
5. Initiate recovery

**Post-Incident:**
1. Document incident
2. Conduct root cause analysis
3. Implement improvements
4. Update security policies
5. Train team

### Data Breach Response

**Steps:**
1. Confirm breach
2. Assess impact
3. Notify affected users
4. Implement breach notification
5. Provide support

**Best Practices:**
- Have response plan ready
- Test response plan regularly
- Legal compliance
- Transparent communication
- Compensation if needed

## 🔧 Security Hardening

### Server Security

**File Permissions:**
```bash
# Set proper permissions
chmod 755 /var/www/kknuinsaizu
chmod 644 /var/www/kknuinsaizu/apps/api/.env
chmod -R 775 /var/www/kknuinsaizu/apps/api/storage
```

**Best Practices:**
- Principle of least privilege
- Regular permission audits
- Document access
- Monitor changes

### Network Security

**Firewall:**
```bash
# UFW rules
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw default deny incoming
```

**Best Practices:**
- Use firewall
- Close unnecessary ports
- Use fail2ban
- Monitor network traffic

### SSL/TLS Security

**Configuration:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

**Best Practices:**
- Use strong protocols
- Disable weak ciphers
- Regular certificate updates
- Monitor SSL expiration

## 📋 Security Checklist

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] APP_DEBUG = false
- [ ] APP_KEY generated securely
- [ ] Database credentials secured
- [ ] SSL/TLS configured
- [ ] Firewall rules applied
- [ ] File permissions correct
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Security headers enabled
- [ ] Dependencies updated
- [ ] Code reviewed

### Regular Security Tasks

- [ ] Update dependencies weekly
- [ ] Review security logs daily
- [ ] Test backups weekly
- [ ] Audit permissions monthly
- [ ] Review access logs monthly
- [ ] Update security documentation
- [ ] Conduct security audits quarterly
- [ ] Train team on security
- [ ] Review security policies quarterly
- [ ] Conduct penetration testing annually

## 🛠️ Security Tools

### Recommended Tools

**Static Analysis:**
- PHPStan (PHP)
- ESLint (JavaScript)
- TypeScript (TypeScript)

**Dependency Scanning:**
- Composer audit
- npm audit
- Snyk

**Penetration Testing:**
- OWASP ZAP
- Burp Suite

**Monitoring:**
- Laravel Telescope
- Logwatch
- Fail2ban

---

**Version:** 1.0.0  
**Last Updated:** May 5, 2026  
**Maintained by:** Tim IT UIN Saizu
