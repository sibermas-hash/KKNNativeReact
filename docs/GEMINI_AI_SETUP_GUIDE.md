# 📚 Panduan Setup Gemini AI untuk Portal KKN

## 🎯 Ringkasan Eksekutif

Portal KKN menggunakan **Google Gemini 2.5** sebagai AI provider untuk fitur-fitur intelligent:
- Asisten berbasis AI untuk mahasiswa
- Verifikasi dokumen dan laporan otomatis
- Monitoring dan analisis data KKN
- Rekomendasi penempatan kelompok

Setup terbaik untuk production memilih **`gemini-2.5-flash`** sebagai model default karena keseimbangan optimal antara kecepatan, akurasi, dan biaya.

---

## 📊 Perbandingan Model Gemini 2.5

| Model | Use Case | Kecepatan | Akurasi | Biaya | Rekomendasi |
|-------|----------|----------|---------|-------|-------------|
| **gemini-2.5-flash** | General purpose, real-time | ⚡⚡⚡ Fast | ⭐⭐⭐⭐⭐ Sangat akurat | ✅ Murah | ✅ **DEFAULT** |
| **gemini-2.5-flash-lite** | High-volume, simple tasks | ⚡⚡⚡⚡ Sangat cepat | ⭐⭐⭐⭐ Akurat | ✅ Termurah | 📢 Real-time notifications |
| **gemini-2.5-pro** | Complex reasoning, analysis | ⚡⚡ Sedang | ⭐⭐⭐⭐⭐ Paling akurat | 💰 Lebih mahal | 🔍 Admin verification tasks |

### Rekomendasi Penggunaan:

1. **Untuk Mahasiswa & User Biasa** (real-time assistance)
   ```
   ✅ Gunakan: gemini-2.5-flash (DEFAULT)
   - Respon cepat < 2 detik
   - Akurat untuk task umum (penjelasan, rekomendasi)
   - Hemat biaya untuk high-volume requests
   ```

2. **Untuk Admin & Verification** (analisis mendalam)
   ```
   ✅ Gunakan: gemini-2.5-pro
   - Reasoning lebih dalam untuk verifikasi dokumen kompleks
   - Analisis data KKN yang detail
   - Worth the cost untuk decision-critical tasks
   ```

3. **Untuk Notifikasi & Background Jobs** (ultra-lightweight)
   ```
   ✅ Gunakan: gemini-2.5-flash-lite
   - Notifikasi push tanpa delay
   - Summarization ringan
   - Minimum cost untuk volume besar
   ```

---

## � Production vs Development Deployment

### ✅ Production Deployment (Recommended)
```
Configuration Management:
- ✅ API Key di-set HANYA via Admin Panel
- ✅ Disimpan encrypted di database
- ✅ Tidak perlu .env
- ✅ Dapat diubah tanpa restart aplikasi
- ✅ Cache auto-invalidate on update

Location: /admin/pengaturan-sistem → "Monitor Intelegensi"

Keuntungan:
- Secure: Key tidak pernah di-commit ke Git
- Flexible: Admin dapat update key kapan saja
- NoOps: Tidak perlu re-deploy untuk ubah API key
- Auditabe: Sistem logging terintegrasi
```

### 🔧 Development Deployment
```
Configuration Management (optional):
- Dapat gunakan .env untuk quick testing
- Contoh: GEMINI_API_KEY=AIzaSy...
- Fallback: Jika database tidak ada, gunakan .env

Location: .env.example (template)

Catatan:
- Database config lebih diprioritaskan daripada .env
- Untuk dev, cukup setup via admin panel juga
```

### 🔄 Configuration Priority (Runtime)

```
┌─────────────────────────────────────────────────────┐
│              AI Configuration Loading              │
├─────────────────────────────────────────────────────┤
│                                                    │
│  1. Check Database (SystemSetting)                │
│     └─ Encrypted, via Admin Panel                 │
│     └─ ✅ PRODUCTION PRIMARY                      │
│                                                    │
│  2. If not in DB, Fallback to .env                │
│     └─ Plain text, development only               │
│     └─ ⚠️  DEVELOPMENT FALLBACK                   │
│                                                    │
│  3. If not in .env, Use Default                   │
│     └─ Null, AI features disabled                 │
│     └─ ❌ NO CONFIG                               │
│                                                    │
└─────────────────────────────────────────────────────┘
```

### 🎯 Implementation Details

**How it works technically:**

1. **Application Bootstrap** (`AiConfigServiceProvider`)
   - On app start, load AI config from database
   - Cached for 1 hour (minimal DB load)
   - Auto-invalidate when admin updates settings

2. **Admin Panel Update**
   - User input API key via `/admin/pengaturan-sistem`
   - Key encrypted before database storage
   - Cache invalidated immediately
   - Next request uses updated key

3. **Runtime Usage**
   - Laravel AI facade uses updated config
   - No restart needed
   - Seamless for production

**Code Flow:**

```php
// In app/Providers/AiConfigServiceProvider.php

public function boot(): void {
    // 1. Check if database is ready
    if ($this->isDatabaseReady()) {
        // 2. Load config from SystemSetting table
        $config = Cache::remember('ai_provider_config', 3600, fn() => 
            $this->fetchProviderConfigFromDatabase()
        );
        
        // 3. Update runtime config
        config(['ai.providers' => $config]);
    }
}
```

---

## �🔑 Langkah 1: Generate API Key dari Google AI Studio

### A. Kunjungi Google AI Studio
1. Buka browser, akses: **https://aistudio.google.com/apikey**
2. Login dengan akun Google yang dipunyai

### B. Create API Key
```
Langkah:
1. Klik tombol "Create API key" (warna biru)
2. Pilih opsi "Create API key in new Google Cloud project"
   atau
   "Create API key in existing project" (jika sudah ada)
3. Tunggu project dibuat (~30 detik)
4. API key akan ditampilkan dan dicopy otomatis
```

### C. Format API Key
```
Contoh format valid:
AIzaSyD...karakterXYZ (panjang ~40 karakter)

⚠️ PENTING:
- Jangan share API key dengan siapapun
- Jangan commit ke Git repository
- Gunakan environment variable atau secure storage
- Rotate key setiap 3 bulan untuk production
```

---

## ⚙️ Langkah 2: Setup di Admin Panel

### A. Akses System Settings
1. Login sebagai **Admin**
2. Navigasi ke: **⚙️ Pengaturan Sistem** 
   - Menu → Administrasi → Pengaturan Sistem
   - Atau langsung: `http://localhost:8000/admin/pengaturan-sistem`

### B. Buka Tab "Monitor Intelegensi"
```
Tampilan:
┌─────────────────────────────────────────┐
│ Konfigurasi Sistem │ Monitor Intelegensi│ (Tab)
├─────────────────────────────────────────┤
│                                         │
│ Teknologi AI: [GEMINI GOOGLE AI]        │
│ Status Koneksi: [●●● BELUM DIATUR]      │
│ Tindakan Bantuan: [0 aksi berhasil]     │
│                                         │
│ ────────────────────────────────────────│
│                                         │
│ Kunci Akses (API Key) Gemini:           │
│ [ Input field untuk API key ]           │
│                                         │
│ [✓] Aktifkan Bantuan AI                 │
│ [Cek Sambungan] [Simpan Pengaturan]     │
│                                         │
└─────────────────────────────────────────┘
```

### C. Input API Key
1. Paste API key yang sudah di-copy dari Google AI Studio
2. Form akan terlihat: `[ •••••••••••••••••• ]` (masked untuk keamanan)

### D. Test Koneksi
```
Langkah:
1. Klik tombol [Cek Sambungan] (warna biru)
2. Tunggu 5-10 detik untuk response

Hasil Sukses:
✅ Koneksi berhasil ke Google Gemini 2.5 Flash
   Model: gemini-2.5-flash
   Response: "OK" (atau respon singkat dari API)

Hasil Gagal:
❌ API Key ditolak: 403 Permission Denied
   (Lihat troubleshooting di bawah)
```

### E. Enable AI Assistance
1. Centang checkbox: **✓ Aktifkan Bantuan AI**
2. Klik **[Simpan Pengaturan AI]** (warna hijau emerald)

### F. Verifikasi Status
```
Setelah berhasil, tampilan akan berubah:

Teknologi AI: GEMINI GOOGLE AI
Status Koneksi: ✅ TERHUBUNG
Tindakan Bantuan: 0 aksi (akan bertambah saat AI features digunakan)
```

---

## 🔍 Langkah 3: Verifikasi Konfigurasi

### A. Check Backend Config
```bash
# Terminal: Buka di workspace
cd /Users/macm4/Documents/Projek/KKN/kknuinsaizu

# Verify config/ai.php settings
cat config/ai.php | grep -A 10 "'gemini'"
```

Expected output:
```php
'gemini' => [
    'driver' => 'gemini',
    'key' => env('GEMINI_API_KEY'),
    'models' => [
        'text' => [
            'default' => 'gemini-2.5-flash',
            'cheapest' => 'gemini-2.5-flash-lite',
            'smartest' => 'gemini-2.5-pro',
        ],
    ],
],
```

### B. Check Database Storage
```bash
# Terminal: Inspect stored API key in database
php artisan tinker

# Jalankan command berikut:
$setting = \App\Models\SystemSetting::where('config_key', 'gemini_api_key')->first();
echo "Key stored: " . ($setting ? 'YES' : 'NO') . "\n";
if ($setting) {
    echo "Encrypted value (first 20 chars): " . substr($setting->config_value, 0, 20) . "...\n";
}
exit;
```

Expected: Key stored with encrypted value

### C. Health Check Endpoint
```bash
# Terminal: Test API connection
curl -X POST http://localhost:8000/admin/pengaturan/sistem/ai/test \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $(php artisan tinker --execute='echo csrf_token();')" \
  -d '{"gemini_api_key":"YOUR_API_KEY_HERE"}'
```

---

## 🎛️ Langkah 4: Konfigurasi Optimal untuk Production

### A. Environment Variable Setup (.env) - TIDAK PERLU UNTUK PRODUCTION ✅

```bash
# ❌ PRODUCTION: Jangan set di .env
# Semua konfigurasi sudah di-database via admin panel

# ✅ LOCAL DEVELOPMENT: Bisa optional test dengan .env
AI_PROVIDER=gemini
GEMINI_API_KEY=  # Kosongkan untuk production

# Sistem akan cek:
# 1. Database dulu (primary) ← Production uses this
# 2. Fallback ke .env (secondary) ← Development uses this
```

**Production Deployment Checklist:**

```
✅ DO:
- Set API key via Admin Panel (/admin/pengaturan-sistem)
- Let system encrypt & store in database
- Update .env.example with documentation
- Keep .env values empty in production

❌ DO NOT:
- Hardcode API key di .env production
- Commit .env ke Git dengan API key
- Manual edit database (use admin panel)
```

**How Production Config Works:**

```
┌─────────────────────────────────────────────┐
│      Production Startup Sequence            │
├─────────────────────────────────────────────┤
│                                             │
│  AiConfigServiceProvider boots              │
│         ↓                                    │
│  Check database ready? YES                  │
│         ↓                                    │
│  Load from SystemSetting table (cached)     │
│         ↓                                    │
│  Update config at runtime                   │
│         ↓                                    │
│  ✅ Ready to use AI                        │
│                                             │
│  NO RESTART NEEDED after admin updates!     │
│                                             │
└─────────────────────────────────────────────┘
```

### B. Model Selection untuk Different Workloads

#### 1️⃣ Default Model (Most Requests)
```php
// config/ai.php
'default' => 'gemini-2.5-flash'
```
**Gunakan untuk:**
- Student notifications & assistance
- General recommendations
- Real-time chat features
- Standard document assistance

**Karakteristik:**
- Respon time: 500ms - 2s
- Accuracy: 95%+
- Cost: $0.075 per 1M input tokens

---

#### 2️⃣ Fastest Model (High Volume)
```php
// config/ai.php
'cheapest' => 'gemini-2.5-flash-lite'
```
**Gunakan untuk:**
- Bulk notification generation
- Background job processing
- Lightweight summarization
- Non-critical assistance

**Karakteristik:**
- Respon time: 200-500ms
- Accuracy: 90%+
- Cost: $0.0375 per 1M input tokens (50% lebih murah)

**Contoh implementasi:**
```php
// app/Services/NotificationService.php
$response = $this->ai->model('cheapest')
    ->generateNotification($student);
```

---

#### 3️⃣ Smartest Model (Critical Decisions)
```php
// config/ai.php
'smartest' => 'gemini-2.5-pro'
```
**Gunakan untuk:**
- Document verification & validation
- KKN report analysis
- Placement group recommendations (critical)
- Admin decision support

**Karakteristik:**
- Respon time: 2-5s
- Accuracy: 98%+
- Cost: $0.15 per 1M input tokens

**Contoh implementasi:**
```php
// app/Services/DocumentVerificationService.php
$analysis = $this->ai->model('smartest')
    ->analyzeReport($studentReport);
```

---

## 🛠️ Langkah 5: Backend Implementation

### A. Menggunakan Model yang Sesuai dalam Code

#### Default Usage (Flash)
```php
// app/Services/AssistantService.php
namespace App\Services;

use App\Contracts\AiProviderContract;

class AssistantService
{
    public function __construct(private AiProviderContract $ai) {}
    
    public function generateAssistance($query)
    {
        // Automatically uses 'gemini-2.5-flash'
        return $this->ai->generate($query);
    }
}
```

#### Specify Model Explicitly
```php
// app/Services/DocumentVerificationService.php
public function verifyDocument($document)
{
    // Use smartest model untuk verification penting
    $result = $this->ai->model('smartest')->analyze($document->content);
    
    return [
        'is_valid' => $result['confidence'] > 0.95,
        'issues' => $result['issues'],
        'suggestions' => $result['suggestions'],
        'model_used' => 'gemini-2.5-pro',
    ];
}

public function sendNotification($student)
{
    // Use cheapest model untuk notification tidak kritis
    $message = $this->ai->model('cheapest')->generate(
        "Buat notifikasi ringkas untuk mahasiswa tentang: " . $student->message
    );
    
    $student->notify(new AiNotification($message));
}
```

### B. Caching AI Responses
```php
// Avoid duplicate API calls dengan caching
public function getAnalysis($reportId)
{
    return Cache::remember(
        "ai_analysis_{$reportId}",
        now()->addHours(24), // Cache 24 jam
        function () use ($reportId) {
            $report = Report::find($reportId);
            return $this->ai->model('smartest')->analyze($report);
        }
    );
}
```

---

## 🐛 Troubleshooting

### Issue 1: "API Key tidak valid atau ditolak oleh Google AI"

**Penyebab Umum:**
- ❌ API key format tidak valid
- ❌ API key sudah expired
- ❌ Project tidak mengaktifkan Gemini API
- ❌ Konfigurasi endpoint/model salah

**Solusi:**

```
1. Verifikasi format API key:
   ✓ Harus dimulai dengan "AIzaSy..."
   ✓ Panjang minimum 39 karakter
   ✓ Tidak ada spasi atau karakter special

2. Regenerate API key:
   → Kunjungi https://aistudio.google.com/apikey
   → Delete key lama
   → Create new key
   → Copy dan paste ke admin form

3. Verifikasi Google Cloud Project:
   → https://console.cloud.google.com
   → Pilih project yang benar
   → Cek: APIs & Services → Enabled APIs
   → Pastikan "Generative Language API" aktif
   
4. Test dengan curl:
   curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}'
   
   Respon error codes:
   - 403 Forbidden: Project akses ditolak
   - 400 Bad Request: Format salah
   - 429 Too Many Requests: Rate limit tercapai
   - 401 Unauthorized: Key tidak valid
```

---

### Issue 2: Response Timeout (> 10 detik)

**Penyebab:**
- Network latency tinggi
- Google servers sedang busy
- Query terlalu kompleks

**Solusi:**
```php
// Increase timeout di config/ai.php
'timeout' => env('AI_TIMEOUT', 15), // Default 15 detik

// Atau async untuk long-running tasks
Queue::dispatch(new AnalyzeDocumentJob($document));
```

---

### Issue 3: Status AI Shows "BELUM DIATUR" (Not Configured)

**Verifikasi Checklist:**

```
□ API Key sudah di-input di form
□ Tombol "Cek Sambungan" sudah diklik dan SUCCESS
□ Checkbox "Aktifkan Bantuan AI" sudah dicentang
□ Tombol "Simpan Pengaturan AI" sudah diklik
□ Page di-refresh (F5) setelah save
```

**Jika masih tidak berhasil:**
```bash
# Terminal: Clear application cache
php artisan cache:clear
php artisan config:clear

# Check database
php artisan tinker
$settings = \App\Models\SystemSetting::where('config_key', 'like', 'gemini%')->get();
$settings->each(function($s) { echo "{$s->config_key}: {$s->config_value}\n"; });
exit;
```

---

## 📈 Monitoring & Usage

### A. Track AI Usage
```php
// app/Models/AiUsageLog.php (opsional, untuk monitoring)
// Catat setiap AI request untuk analytics

public static function logRequest($model, $tokens_input, $tokens_output, $response_time)
{
    self::create([
        'model' => $model,
        'tokens_input' => $tokens_input,
        'tokens_output' => $tokens_output,
        'response_time' => $response_time,
        'created_at' => now(),
    ]);
}
```

### B. Check Dashboard Metrics
```
Admin Dashboard → Monitor Intelegensi:
- Teknologi AI: GEMINI GOOGLE AI
- Status Koneksi: ✅ TERHUBUNG
- Tindakan Bantuan: [N aksi berhasil] ← bertambah saat AI digunakan
```

### C. Estimated Monthly Cost

```
Asumsi penggunaan:

Scenario 1: Light Usage (100 requests/hari)
- Input tokens: ~50K tokens/bulan
- Output tokens: ~30K tokens/bulan
- Model: gemini-2.5-flash
- Cost: ~$0.04/bulan

Scenario 2: Medium Usage (500 requests/hari)
- Input tokens: ~250K tokens/bulan
- Output tokens: ~150K tokens/bulan
- Model: gemini-2.5-flash (80%) + pro (20%)
- Cost: ~$0.30/bulan

Scenario 3: High Usage (2000 requests/hari)
- Input tokens: ~1M tokens/bulan
- Output tokens: ~600K tokens/bulan
- Model: flash-lite (60%) + flash (30%) + pro (10%)
- Cost: ~$0.75/bulan

💡 Pricing reference (April 2025):
- gemini-2.5-flash: $0.075 input / $0.30 output
- gemini-2.5-flash-lite: $0.0375 input / $0.15 output
- gemini-2.5-pro: $0.15 input / $0.60 output

→ All costs per 1M tokens
```

---

## ✅ Best Practices Checklist

### Security
- [ ] API key NOT hardcoded di .env untuk production
- [ ] API key disimpan terenkripsi di database
- [ ] API key di-rotate setiap 3 bulan
- [ ] Access dibatasi ke authorized users only (admin)
- [ ] Implement rate limiting untuk API calls

### Performance
- [ ] Gunakan `gemini-2.5-flash` sebagai default
- [ ] Gunakan `flash-lite` untuk high-volume tasks
- [ ] Gunakan `pro` hanya untuk critical decisions
- [ ] Implement caching untuk frequent queries (24 jam)
- [ ] Use async/queue untuk long-running tasks

### Reliability
- [ ] Implement error handling & fallback untuk failed requests
- [ ] Monitor API response times (target: < 3 detik)
- [ ] Set up alerts untuk connection failures
- [ ] Test connection regularly (daily check)
- [ ] Have manual verification process as backup

### Cost Optimization
- [ ] Monitor monthly token usage
- [ ] Optimize prompts untuk fewer tokens
- [ ] Use cheaper models where appropriate
- [ ] Cache results untuk repeated queries
- [ ] Consider quotas/limits untuk high-volume usage

---

## 📞 Support & Resources

### Documentation
- [Google Gemini API Official Docs](https://ai.google.dev/docs)
- [Available Models List](https://ai.google.dev/models/gemini-2-5)
- [Pricing Calculator](https://ai.google.dev/pricing)

### Troubleshooting
- [Common Issues](https://ai.google.dev/docs/troubleshooting)
- [Rate Limits & Quotas](https://ai.google.dev/docs/usage-limits)
- [Error Codes Reference](https://ai.google.dev/docs/errors)

### Portal KKN Specific
- Backend Config: `/config/ai.php`
- Controller: `/app/Http/Controllers/Admin/SystemSettingController.php`
- UI Component: `/resources/js/Components/Premium/AiConfigPanel.tsx`
- Settings Page: `/resources/js/Pages/Admin/System/Settings/System.tsx`

---

**Last Updated:** April 19, 2026  
**Version:** 2.5 (Gemini 2.5 Release)  
**Status:** ✅ Production Ready
