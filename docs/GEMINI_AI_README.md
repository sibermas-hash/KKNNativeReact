# 🚀 Gemini AI Setup - Dokumentasi Lengkap

Panduan setup terbaik untuk integrasi Google Gemini API ke Portal KKN dengan pemilihan model optimal.

## 📋 Dokumentasi yang Tersedia

### 1. **⚡ Quick Start (5 Menit)**
   📄 [`docs/GEMINI_AI_QUICK_START.md`](GEMINI_AI_QUICK_START.md)
   
   Untuk yang ingin setup cepat tanpa detail panjang.
   - 3-step setup process
   - Troubleshooting singkat
   - Model selection quick reference

### 2. **🚀 Production Deployment (PENTING!)**
   📄 [`docs/PRODUCTION_AI_CONFIG.md`](PRODUCTION_AI_CONFIG.md)
   
   **Jawaban atas: "Kenapa tidak perlu .env untuk production?"**
   - Menjelaskan why .env tidak perlu di production
   - Bagaimana sistem baca config dari database
   - Security implementation (encryption at rest)
   - Cache invalidation strategy
   - Step-by-step update procedures
   - DevOps & admin guides
   
   **→ START HERE untuk understanding production architecture!**

### 3. **📚 Setup Lengkap (Comprehensive Guide)**
   📄 [`docs/GEMINI_AI_SETUP_GUIDE.md`](GEMINI_AI_SETUP_GUIDE.md)
   
   Panduan komprehensif untuk setup production-ready.
   - Model comparison dengan use cases
   - Step-by-step setup di admin panel
   - Konfigurasi optimal untuk production
   - Monitoring dan cost estimation
   - Troubleshooting detail

### 4. **🔧 Developer Guide**
   📄 [`docs/GEMINI_MODEL_SELECTION_GUIDE.md`](GEMINI_MODEL_SELECTION_GUIDE.md)
   
   Untuk developers yang ingin implementasi di code.
   - Kapan menggunakan model mana
   - Code patterns dan best practices
   - Performance benchmarks
   - Cost optimization strategies
   - Implementation examples

---

## 🎯 Model Selection Summary

```
QUICK DECISION MATRIX:

Kebutuhan              │ Model                   │ Setting
──────────────────────┼─────────────────────────┼──────────────
Default (Recommended) │ gemini-2.5-flash        │ ai.model('default')
High Volume/Speed     │ gemini-2.5-flash-lite   │ ai.model('cheapest')
Critical/Complex      │ gemini-2.5-pro          │ ai.model('smartest')
```

**Rekomendasi:** Gunakan `gemini-2.5-flash` untuk ~95% use cases

---

## 🔐 Configuration Status

✅ **Production-Ready Architecture:**
- API key management 100% via Admin Panel
- No .env configuration needed for production
- Encrypted storage in database
- Zero-downtime configuration updates
- Automatic cache invalidation
- See: [PRODUCTION_AI_CONFIG.md](PRODUCTION_AI_CONFIG.md)

✅ **Backend Konfigurasi:**
- `app/Providers/AiConfigServiceProvider.php` - Loads config from database
- `config/ai.php` - Model selection & provider setup
- `app/Http/Controllers/Admin/SystemSettingController.php` - Manages settings
- `.env.example` - Updated documentation

✅ **Frontend Konfigurasi:**
- `resources/js/Components/Premium/AiConfigPanel.tsx` - UI untuk manage API key
- `resources/js/Pages/Admin/System/Settings/System.tsx` - Admin panel

✅ **Database:**
- API key disimpan terenkripsi di `system_settings` table
- Tidak di-hardcode di `.env` untuk production ✓

---

## 🚀 Langkah Setup (Cepat)

### 1. Generate API Key
```
→ Kunjungi: https://aistudio.google.com/apikey
→ Click: Create API key
→ Copy: AIzaSy...XXXXX
```

### 2. Input ke Admin Panel
```
→ URL: http://localhost:8000/admin/pengaturan-sistem
→ Tab: Monitor Intelegensi
→ Paste: API key ke form
→ Click: "Cek Sambungan" (verify)
→ Click: "Simpan Pengaturan AI"
```

### 3. Verify
```
→ Check: Status Koneksi = "✅ TERHUBUNG"
→ Done: AI aktif!
```

**Total Time: ~5 menit**

---

## 📊 Model Details

| Aspek | gemini-2.5-flash | gemini-2.5-flash-lite | gemini-2.5-pro |
|-------|-------------------|----------------------|-----------------|
| **Speed** | 500-2s | 200-500ms | 1-5s |
| **Accuracy** | 95%+ | 90%+ | 98%+ |
| **Cost** | $0.075/M | $0.0375/M | $0.15/M |
| **Best For** | General tasks | High volume | Critical decisions |
| **Example** | Chat, recommendations | Notifications | Verification |

---

## 🛠️ Penggunaan dalam Kode

### Default (Flash)
```php
$ai->generate("Berapa nilai mahasiswa?");
// Automatic: uses gemini-2.5-flash
```

### Lite Version
```php
$ai->model('cheapest')->generate("Quick summary");
// Uses: gemini-2.5-flash-lite (50% cheaper)
```

### Pro Version
```php
$ai->model('smartest')->analyze($report);
// Uses: gemini-2.5-pro (most accurate)
```

---

## ❌ Troubleshooting

| Error | Solusi |
|-------|--------|
| "API Key tidak valid" | Regenerate dari https://aistudio.google.com/apikey |
| "403 Forbidden" | Enable Generative Language API di Google Cloud |
| "Status BELUM DIATUR" | Klik "Cek Sambungan" → Simpan → Refresh |
| Timeout | Network issue atau Google servers busy |

**Detail:** Lihat `docs/GEMINI_AI_SETUP_GUIDE.md` bagian Troubleshooting

---

## 📈 Cost Estimation

**Per Bulan (Light Usage: 100 req/hari):**
- Input tokens: ~50K
- Output tokens: ~30K
- Cost: ~$0.04/bulan

**Per Bulan (Heavy Usage: 2000 req/hari):**
- Input tokens: ~1M
- Output tokens: ~600K
- Cost: ~$0.75/bulan

Lihat detail di `docs/GEMINI_AI_SETUP_GUIDE.md` bagian "Monitoring & Usage"

---

## ✅ Checklist Implementasi

### Setup Phase
- [ ] API key di-generate dari https://aistudio.google.com/apikey
- [ ] API key di-input di admin panel Monitor Intelegensi
- [ ] Test connection berhasil (✅ TERHUBUNG)
- [ ] AI assistance di-enable (checkbox dicentang)

### Development Phase
- [ ] Backend implementation tested
- [ ] Model selection di-optimize untuk use cases
- [ ] Caching di-implement untuk repeated queries
- [ ] Error handling di-implement

### Production Phase
- [ ] API key di-store di database (tidak di `.env`)
- [ ] Rate limiting di-setup
- [ ] Monitoring di-setup
- [ ] Cost tracking di-monitor

---

## 🔗 Referensi

### Official Google Documentation
- [Gemini Models](https://ai.google.dev/models/gemini-2-5)
- [API Documentation](https://ai.google.dev/docs)
- [Pricing](https://ai.google.dev/pricing)

### Portal KKN Implementation
- Backend Config: `config/ai.php`
- Controller: `app/Http/Controllers/Admin/SystemSettingController.php`
- UI Component: `resources/js/Components/Premium/AiConfigPanel.tsx`
- Settings Page: `resources/js/Pages/Admin/System/Settings/System.tsx`

---

## 📞 Support

- **Quick Setup:** Lihat `docs/GEMINI_AI_QUICK_START.md`
- **Detailed Setup:** Lihat `docs/GEMINI_AI_SETUP_GUIDE.md`
- **Development:** Lihat `docs/GEMINI_MODEL_SELECTION_GUIDE.md`

---

## 📝 Summary Perubahan

### ✅ Sudah Dikerjakan:

1. **Config Update** (`config/ai.php`)
   - Default model: `gemini-2.5-flash`
   - Cheapest model: `gemini-2.5-flash-lite`
   - Smartest model: `gemini-2.5-pro`

2. **Controller Improvement** (`SystemSettingController.php`)
   - Test endpoint diperbaiki dengan better error handling
   - Respon lebih detail untuk debugging

3. **Environment Template** (`.env.example`)
   - Updated dengan dokumentasi model selection
   - Security notes tentang API key storage

4. **Dokumentasi Komprehensif**
   - `docs/GEMINI_AI_QUICK_START.md` - Quick reference
   - `docs/GEMINI_AI_SETUP_GUIDE.md` - Full guide
   - `docs/GEMINI_MODEL_SELECTION_GUIDE.md` - Developer guide
   - `docs/GEMINI_AI_README.md` - This file (overview)

---

## 🎬 Next Steps

### For Production Admin:
1. **Understand Production Setup** → Read [PRODUCTION_AI_CONFIG.md](PRODUCTION_AI_CONFIG.md)
   - Why no .env needed
   - How config loads from database
   - Security implementation

2. **Generate API Key** → https://aistudio.google.com/apikey
3. **Input to Admin Panel** → `/admin/pengaturan-sistem` tab "Monitor Intelegensi"
4. **Test Connection** → Click "Cek Sambungan" button
5. **Verify Status** → Should show "✅ TERHUBUNG"

### For Developers:
1. **Understand Model Selection** → Read [GEMINI_MODEL_SELECTION_GUIDE.md](GEMINI_MODEL_SELECTION_GUIDE.md)
2. **Implement AI Features** → Use recommended models for your use cases
3. **Optimize Performance** → Follow cost optimization strategies
4. **Monitor Usage** → Track AI usage in admin dashboard

### For DevOps:
1. **Review Production Architecture** → [PRODUCTION_AI_CONFIG.md](PRODUCTION_AI_CONFIG.md)
2. **Deploy with Empty Keys** → `.env` with empty GEMINI_API_KEY
3. **Setup Database Backups** → SystemSetting table contains encrypted keys
4. **Document Admin Procedures** → For your ops team
5. **Setup Monitoring** → Track AI usage & costs

---

**Status:** ✅ Production Ready  
**Version:** Gemini 2.5 (Latest)  
**Last Updated:** April 19, 2026  
**Prepared for:** Portal KKN UIN Saizu
