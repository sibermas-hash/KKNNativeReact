# 🚀 Production AI Configuration - No .env Needed

## Ringkas: Kenapa Tidak Perlu .env untuk Production

**Setup KKN sudah production-ready:**

```
❌ SEBELUM: API key harus di .env
              └─ Tidak secure
              └─ Harus restart untuk update
              └─ Git conflict risk

✅ SEKARANG: API key di-manage via Admin Panel
             └─ Encrypted di database
             └─ Update tanpa restart
             └─ 100% GUI-based configuration
             └─ No .env needed
```

---

## 🎯 Arsitektur Production

### Configuration Loading Flow

```
Application Start
      ↓
AiConfigServiceProvider boots
      ↓
Check database ready? ←─ YES ─→ Query SystemSetting table
      ↓
Load AI config from DB (cached 1 hour)
      ↓
Decrypt API keys securely
      ↓
Update Laravel config at runtime
      ↓
✅ Ready to serve requests (no .env needed!)
```

### Updating Configuration in Production

```
Admin updates API key via GUI
      ↓
Form POST to /admin/pengaturan-sistem
      ↓
SystemSettingController validates & encrypts
      ↓
Save to SystemSetting table
      ↓
INVALIDATE CACHE (ai_provider_config)
      ↓
Next request loads fresh config from DB
      ↓
✅ Live update without restart!
```

---

## 📋 What You Need to Do in Production

### ✅ Things to Do

1. **Generate API Key**
   ```
   → https://aistudio.google.com/apikey
   → Create API key
   ```

2. **Setup via Admin Panel** (Only step needed!)
   ```
   → URL: http://yoursite.com/admin/pengaturan-sistem
   → Tab: "Monitor Intelegensi"
   → Paste API key
   → Click "Cek Sambungan" (verify)
   → Click "Simpan Pengaturan AI" (save)
   → Done! 🎉
   ```

3. **Verify Status**
   ```
   → Check: Status Koneksi = "✅ TERHUBUNG"
   → AI features now active
   ```

### ❌ Things NOT to Do

1. ❌ Do NOT set GEMINI_API_KEY in production .env
2. ❌ Do NOT hardcode API key in config files
3. ❌ Do NOT commit .env with API key to Git
4. ❌ Do NOT manual edit database (use GUI)
5. ❌ Do NOT restart app after config change

---

## 🔒 Security Features

### Encryption at Rest
```php
// In database (SystemSetting table)
- config_key: 'gemini_api_key'
- config_value: '..encrypted_string..' (Laravel Crypt)

When Admin adds API key:
1. Form validates input
2. Crypt::encryptString() applied
3. Stored in database
4. Retrieved only by authorized admin users
```

### Secure Decryption
```php
// In AiConfigServiceProvider
when loading config:
1. Check if key is in 'SECRET_KEYS' list
2. If yes, Crypt::decryptString() on retrieval
3. Error handling for corruption/tampering
4. Logging for security audit
```

### No Hardcoding
```
Before (❌ Bad):
- API_KEY=AIzaSy... in .env
- Visible in code repo
- In production server files
- Risk if someone gets server access

Now (✅ Good):
- API_KEY only in database
- Encrypted at rest
- Accessible only via secure admin panel
- Audit-logged
```

---

## 🔄 How to Update API Key in Production

### Scenario 1: Rotating Keys (Security Best Practice)

**Step 1:** Generate new key
```
→ https://aistudio.google.com/apikey
→ Create new key
```

**Step 2:** Update in Admin Panel
```
→ /admin/pengaturan-sistem
→ Tab: "Monitor Intelegensi"
→ Clear old key, paste new key
→ Click "Cek Sambungan" (verify new key works)
→ Click "Simpan Pengaturan AI"
```

**Step 3:** Verify
```
→ Status shows "✅ TERHUBUNG"
→ AI features continue working
→ NO APP RESTART NEEDED!
```

**Optional:** Delete old key from Google Cloud Console

### Scenario 2: Switching AI Provider

**Step 1:** Generate API key for new provider
```
Example: Switch from Gemini to OpenAI
→ https://platform.openai.com/api-keys
→ Create API key
```

**Step 2:** Update via Admin Panel
```
→ /admin/pengaturan-sistem
→ Update provider (if form has selector)
→ Update API key field
→ Test connection
→ Save
```

**Step 3:** Update Backend Config (if needed)
```
In config/ai.php - if you have model-specific settings:
- Update default model
- Update model aliases
- Clear cache
```

### Scenario 3: Removing API Key (Disable AI)

**Step 1:** Access Admin Panel
```
→ /admin/pengaturan-sistem
→ Tab: "Monitor Intelegensi"
```

**Step 2:** Remove Key
```
→ Clear API key field
→ Uncheck "Aktifkan Bantuan AI"
→ Click "Simpan Pengaturan AI"
```

**Step 3:** Verify
```
→ Status shows "BELUM DIATUR" (disabled)
→ AI features automatically disabled
```

---

## 🔧 Technical Implementation

### Service Provider: AiConfigServiceProvider

```php
// app/Providers/AiConfigServiceProvider.php

class AiConfigServiceProvider extends ServiceProvider {
    
    public function boot(): void {
        // Load AI config from database with fallback to .env
        if ($this->isDatabaseReady()) {
            $this->loadAiProviderConfig();
        }
    }
    
    private function loadAiProviderConfig(): void {
        // Cache key: ai_provider_config (1 hour TTL)
        $config = Cache::remember('ai_provider_config', 3600, fn() => 
            $this->fetchProviderConfigFromDatabase()
        );
        
        // Update runtime config
        config(['ai.providers' => $config]);
    }
    
    private function fetchProviderConfigFromDatabase(): array {
        // Query SystemSetting table for all AI config
        return SystemSetting::where('group', 'ai_settings')
            ->orWhere('config_key', 'like', '%_api_key')
            ->get()
            ->reduce(fn($config, $setting) => 
                $this->mapDatabaseKeyToConfig($config, $setting)
            );
    }
}
```

### Cache Invalidation (Automatic)

```php
// In SystemSettingController::update()

foreach ($settings as $setting) {
    $value = encryptIfSecret($setting->value);
    $setting->update(['value' => $value]);
    
    // Auto-invalidate cache for any setting change
    Cache::forget('ai_provider_config');
}
```

### Database Schema

```sql
-- system_settings table
CREATE TABLE system_settings (
    id BIGINT PRIMARY KEY,
    config_key VARCHAR(255),      -- 'gemini_api_key', 'openai_api_key', etc
    config_value LONGTEXT,         -- Encrypted value
    group VARCHAR(255),            -- 'ai_settings', 'master_api', etc
    type VARCHAR(50),              -- 'password', 'text', 'number'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Example row:
config_key: gemini_api_key
config_value: eyJpdiI6IkFRQm... (encrypted)
group: ai_settings
type: password
```

---

## 📊 Comparison: Before vs After

| Aspect | Before (❌) | After (✅) |
|--------|-----------|----------|
| **Config Location** | .env file | Database (SystemSetting) |
| **API Key Visibility** | Plain text | Encrypted |
| **Update Method** | Edit .env + restart | Admin Panel (no restart) |
| **Security** | Risky (Git exposure) | Secure (DB only) |
| **Audit Trail** | None | Logged |
| **Multiple Admins** | Conflicts | Synchronized |
| **Rotation** | Manual + restart | One-click |
| **Backup** | DB backup | DB backup (same) |

---

## ✅ Production Deployment Checklist

```
BEFORE GOING LIVE:

Infrastructure:
  ☐ Database encrypted (PostgreSQL with SSL)
  ☐ Application SSL certificate (HTTPS)
  ☐ Regular database backups configured

Configuration:
  ☐ .env: Leave AI_PROVIDER=gemini, GEMINI_API_KEY empty
  ☐ .env.production: Copy from .env (same, empty keys)
  ☐ config/ai.php: Using fallback logic ✓

Setup:
  ☐ Login as admin
  ☐ Visit /admin/pengaturan-sistem
  ☐ Generate API key from https://aistudio.google.com/apikey
  ☐ Paste into "Monitor Intelegensi" tab
  ☐ Click "Cek Sambungan" - verify SUCCESS
  ☐ Click "Simpan Pengaturan AI"
  ☐ Check status = "✅ TERHUBUNG"

Verification:
  ☐ AI features are accessible
  ☐ No .env modification needed
  ☐ API key not in version control
  ☐ Cache properly configured
  ☐ Logs show AI config loaded

Post-Launch:
  ☐ Monitor AI usage in admin dashboard
  ☐ Setup API key rotation schedule (every 3 months)
  ☐ Document admin procedures for team
  ☐ Test API key update process
```

---

## 🎯 Summary

### For Production Admin:
```
"I don't need to touch .env anymore!
 All AI configuration is done via the admin panel.
 It's encrypted, it's secure, and it just works."
```

### For DevOps:
```
"We deploy .env with empty AI keys.
 Admins configure live via admin panel.
 Cache auto-invalidates on update.
 Zero-downtime configuration changes."
```

### For Security:
```
"API keys are encrypted at rest.
 Never stored in version control.
 Audit-logged on every change.
 Only accessible by authenticated admins."
```

---

## 📚 Related Documentation

- [GEMINI_AI_SETUP_GUIDE.md](GEMINI_AI_SETUP_GUIDE.md) - Full setup guide
- [GEMINI_MODEL_SELECTION_GUIDE.md](GEMINI_MODEL_SELECTION_GUIDE.md) - Developer guide
- [GEMINI_AI_QUICK_START.md](GEMINI_AI_QUICK_START.md) - Quick reference
- [MULTI_PROVIDER_SETUP.md](MULTI_PROVIDER_SETUP.md) - Other AI providers

---

**Status:** ✅ Production Ready  
**Last Updated:** April 19, 2026  
**For:** Portal KKN Admin & DevOps Teams
