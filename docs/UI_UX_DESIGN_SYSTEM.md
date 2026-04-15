# SISTEM DESAIN PATEN KKN UIN SAIZU
**Versi:** 5.0.0 (High-Density Minimalist Luxury)
**Status:** MUTLAK / FINAL & PATEN

Dokumen ini memuat **ATURAN TERTULIS (HUKUM)** untuk seluruh struktur antarmuka (UI) dan pengalaman pengguna (UX) pada portal administrasi KKN UIN SAIZU.

## 1. KEPADATAN TAMPILAN (DATA DENSITY & COMPACTNESS)
- **High-Density Data First:** Seluruh modul layar operasional (khususnya Dashboard & Tabel) mutlak harus super padat (meniru terminal *Bloomberg/Aviation*). Prioritaskan arus informasi tanpa paksaan melakukan _scroll_ panjang.
- **Konstraksi Tata Letak (Anti-Pelonggaran):** Dilarang keras menggunakan *padding* atau *margin* raksasa yang membunuh ruang (seperti `p-10`, `gap-8`, `h-32`). Selalu pilih struktur mikro: `p-3`, `p-4`, `gap-2`, `space-y-4` guna memompa masuk lebih banyak data di layar awal.

## 2. STRUKTUR WARNA & GARIS KONTRAS (ANTI-PUDAR)
- **TEKS UTAMA:** Wajib bernuansa murni dan padat. Prioritaskan `text-black`.
- **TEKS SEKUNDER HARUS TAJAM:** HARAM HUKUMNYA menggunakan transparansi murahan (`opacity-40`, `text-black/50`, `text-slate-500`). Untuk memisahkan hierarki, gunakan **`text-emerald-950`** atau **`text-emerald-900`**. Ini akan menipu mata (terlihat seperti abu/hitam) namun jauh lebih kaya dan tajam (tidak membuat sakit mata karena memudar).
- **HUKUM "NO BLACK" BUKAN TEKS:** DILARANG menjadikan latar/tombol berwarna Hitam (`bg-black`), Kelabu Kusam, atau *Slate* (`bg-slate-800`). Latar belakang utama wajib bernuansa Zamrud identitas, yakni `bg-emerald-600`.
- **BEBAS ABU-ABU DI BAYANGAN:** Keseluruhan garis *(border)* dan bayangan *(box-shadow)* harus memakai keluarga warna `emerald`. (Contoh: `shadow-emerald-900/5`). Tidak boleh menggunakan `border-gray-200`.

## 3. TIPOGRAFI & SKALA VISUAL (ANTI-UKURAN MIKRO)
- **Batas Teks Terkecil (Anti-Micro):** HARAM mengaplikasikan tulisan yang terlalu kecil untuk ukuran manusia wajar. Dilarang menggunakan `text-[8px]`, `text-[9px]`, atau `text-[10px]`. Label mungil mutlak memakai **`11px`** atau mininum **`text-xs` (12px)**.
- **Penormalan Hirarki Murni (Dilarang Lebay):**
  - Judul Panel / Menu: Maksimal `text-2xl font-extrabold tracking-tight` (Tidak boleh terlalu bengkak seperti `text-7xl` agar ruang efisien).
  - Angka Operasional / Statistik: `text-2xl` dipadu dengan `font-extrabold`.
  - Teks Deskriptif: `text-xs font-semibold`.

## 4. ESTETIKA VISUAL PREMIUM
1. **Glassmorphism Rapat:** Kotak informasi tidak boleh sekadar kanvas putih. Gunakan formula penyangga standar kartu kita: `bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-2xl shadow-md shadow-emerald-900/5`.
2. **Tombol Fungsional:** Mewah, padat, responsif `hover:-translate-y-0.5`.
