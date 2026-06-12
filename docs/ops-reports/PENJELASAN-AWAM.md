# Penjelasan Mudah: Apa yang Terjadi dengan SIBERMAS?

## Ringkasan Singkat

Website SIBERMAS **sebenarnya sehat 100%**. Yang rusak hanya **"jalan
masuk" dari internet ke server** — ini di luar kendali tim aplikasi,
butuh bantuan admin jaringan kampus.

---

## Analogi: SIBERMAS itu seperti RESTORAN

Bayangkan SIBERMAS adalah sebuah **restoran** di dalam kompleks
perumahan tertutup (kampus UIN Saizu).

- **Restoran (server aplikasi)** = dapur masih nyala, koki kerja, menu
  lengkap, makanan siap saji. **SEHAT.**
- **Gerbang kompleks (NAT router kampus)** = pintu masuk dari jalan raya
  ke kompleks. **RUSAK / TERKUNCI.**
- **Google Maps (Cloudflare)** = aplikasi yang mengarahkan pelanggan
  ke restoran. Maps berfungsi, tapi pas pelanggan sampai gerbang
  kompleks, gerbangnya nggak bisa dibuka.

Akibatnya: **pelanggan (pengunjung website) lihat pesan error "tidak
bisa masuk"** — padahal restoran di dalam baik-baik saja.

---

## Apa Saja yang Sudah Diperbaiki Hari Ini?

### ✅ Perbaikan #1: Merapikan "Catatan Resep" yang Berantakan

**Masalah:** Ada beberapa perbaikan kode yang dilakukan langsung di
server tanpa dicatat di "buku resep utama" (Git repository). Kalau
dibiarkan, perbaikan ini bisa hilang saat update berikutnya.

**Yang dilakukan:**
- Mengumpulkan semua perbaikan dari server
- Mencatatnya rapi ke buku resep utama (GitHub)
- Memastikan server, komputer lokal, dan GitHub punya catatan **identik**

**Hasil:** Tidak ada perbaikan yang hilang. Semua tercatat rapi.
**4 fitur keamanan penting terselamatkan**, termasuk:
- Penguat keamanan login (anti pembobolan password)
- Halaman pengumuman publik baru
- Update library yang tadinya rentan dibobol

---

### ✅ Perbaikan #2: Mempercepat Server (Cache)

**Masalah:** Setiap kali ada pengunjung, server harus baca ulang ratusan
file konfigurasi — lambat dan boros.

**Yang dilakukan:** Membuat "ringkasan cepat" (cache) dari konfigurasi,
rute halaman, dan event sistem.

**Hasil:** Server bisa merespons jauh lebih cepat saat NAT pulih nanti.
**498 halaman/endpoint** sudah di-cache.

---

### ✅ Perbaikan #3: Diagnosa Masalah "Pintu Masuk" + Surat Laporan

**Masalah:** Website mengembalikan error 520 ke semua pengunjung.

**Yang dilakukan:** Tes 4 jalur berbeda untuk menemukan titik putusnya:

| Tes | Hasil | Artinya |
|---|---|---|
| Dari dalam server itu sendiri | ✅ Hidup | Aplikasi sehat |
| Dari luar lewat IP publik kampus | ❌ Mati | **Pintu masuk rusak** |
| Dari luar lewat Cloudflare | ❌ Error 520 | Akibat lanjutan |
| DNS (alamat website) | ✅ Normal | Tidak ada masalah |

**Kesimpulan:** Pintu masuk dari internet ke server kampus rusak.
Hanya admin jaringan kampus yang bisa memperbaiki.

**Surat laporan resmi sudah disiapkan** di file `LAPORAN-NAT-520.md`,
tinggal kirim ke admin jaringan kampus via WhatsApp/email.

---

### ✅ Perbaikan #4: Dev Tools di Komputer Lokal

**Masalah:** Tool development di MacBook nggak bisa jalan karena modul
Redis tidak terpasang.

**Yang dilakukan:** Mengganti ke versi alternatif yang murni PHP
(tidak butuh install modul tambahan).

**Hasil:** Bisa develop & test di laptop tanpa hambatan.

---

## Apa yang Harus Dilakukan SEKARANG?

### 🔴 SATU-SATUNYA YANG TERSISA:

**Kirim laporan ke admin jaringan kampus UIN Saizu.**

File laporan: `/Users/macm4/Documents/kknuinsaizu/LAPORAN-NAT-520.md`

Isi pesan singkat untuk admin jaringan:

> "Pak/Bu, mohon bantuan. Website SIBERMAS
> (sibermas.uinsaizu.ac.id) tidak bisa diakses dari internet karena
> NAT/port-forward dari IP publik 103.147.241.33 ke server internal
> 172.16.2.70 (port 80 & 443) terputus. Server aplikasi sendiri sehat
> 100%. Detail lengkap ada di lampiran. Terima kasih."

**Setelah admin jaringan memperbaiki, website langsung normal otomatis.**
Tidak perlu update atau deploy ulang apapun.

---

## Status Saat Ini

| Komponen | Status |
|---|---|
| 🟢 Aplikasi Laravel (backend API) | Sehat |
| 🟢 Aplikasi Next.js (tampilan web) | Sehat |
| 🟢 Database PostgreSQL | Sehat |
| 🟢 Redis (cache) | Sehat |
| 🟢 Nginx (web server) | Sehat |
| 🟢 Akses dari dalam LAN kampus | Sehat |
| 🟢 Repository (kode di GitHub) | Sinkron |
| 🔴 Akses dari internet publik | **Tunggu admin jaringan kampus** |

---

## Pertanyaan Yang Mungkin Muncul

**T: Kenapa kita tidak bisa memperbaiki sendiri?**
J: Karena router/firewall kampus dikelola oleh tim IT kampus.
Kita hanya "menumpang" server di sana — kita tidak punya akses ke
perangkat jaringan kampus.

**T: Berapa lama sampai pulih?**
J: Tergantung respons admin jaringan kampus. Kalau cepat: < 1 jam
setelah laporan diterima. Tidak ada yang bisa dipercepat dari sisi kita.

**T: Apakah data hilang?**
J: Tidak. Semua data aman di database. Yang putus hanya "jalan akses",
bukan datanya.

**T: Kalau pengguna komplain sekarang gimana?**
J: Jawab apa adanya: "Sedang ada gangguan jaringan kampus, tim sedang
berkoordinasi dengan admin IT UIN Saizu. Mohon ditunggu."
