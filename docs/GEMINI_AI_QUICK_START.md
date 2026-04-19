# ⚡ Quick Start: Gemini AI Setup (5 Menit)

## 🎯 TL;DR - Setup Tercepat

### 1. Generate API Key (1 menit)
```
URL: https://aistudio.google.com/apikey
Klik "Create API key" → Copy key
Format: AIzaSy...XXXXX
```

### 2. Input ke Admin Panel (2 menit)
```
Path: http://localhost:8000/admin/pengaturan-sistem
Tab: "Monitor Intelegensi"
Input: API key ke field "Kunci Akses (API Key) Gemini"
Click: "Cek Sambungan" ✅ Success
Click: "Simpan Pengaturan AI"
```

### 3. Verify Status (1 menit)
```
Check: Status Koneksi → "✅ TERHUBUNG"
Done: AI features aktif!
```

---

## 📊 Pilih Model Sesuai Kebutuhan

| Kebutuhan | Model | Setting |
|-----------|-------|---------|
| **Umum** (default) | gemini-2.5-flash | Sudah di-set di `config/ai.php` |
| **Speed** (notifikasi) | gemini-2.5-flash-lite | Model: 'cheapest' |
| **Power** (verifikasi) | gemini-2.5-pro | Model: 'smartest' |

### Pakai di Code:
```php
// Default (Flash)
$ai->generate("query");

// Lite version
$ai->model('cheapest')->generate("query");

// Pro version
$ai->model('smartest')->generate("query");
```

---

## ❌ Troubleshooting Cepat

| Error | Solusi |
|-------|--------|
| "API Key tidak valid" | Regenerate dari https://aistudio.google.com/apikey |
| "403 Forbidden" | Enable Generative Language API di Google Cloud Console |
| "Status BELUM DIATUR" | Klik "Cek Sambungan" → "Simpan Pengaturan" → Refresh page |
| Timeout > 10s | Network issue atau Google servers busy |

---

## 📚 Dokumentasi Lengkap
Lihat: **`docs/GEMINI_AI_SETUP_GUIDE.md`** untuk setup mendalam, troubleshooting, monitoring, dan best practices.

---

## 🔐 Security Checklist
- ✅ API key disimpan di database (terenkripsi)
- ✅ Bukan di `.env` untuk production
- ✅ Rotate key setiap 3 bulan
- ✅ Tidak di-commit ke Git

---

**Status:** ✅ Production Ready  
**Model:** Gemini 2.5 (Latest)  
**Setup Time:** ~5 menit
