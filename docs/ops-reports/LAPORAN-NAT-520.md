# Laporan Gangguan Akses Publik SIBERMAS

**Tanggal:** 8 Juni 2026
**Pelapor:** Admin SIBERMAS
**Tujuan:** Admin Jaringan UIN Saizu Purwokerto

---

## Ringkasan

Website **https://sibermas.uinsaizu.ac.id** mengembalikan **HTTP 520
(Cloudflare: origin unreachable)** di seluruh halaman dan endpoint API.
Pengguna tidak dapat mengakses sistem.

**Status aplikasi (sisi server) sehat 100%.** Masalah berada di jalur
NAT publik kampus.

---

## Bukti Diagnosa

| # | Uji | Hasil | Kesimpulan |
|---|---|---|---|
| 1 | `curl https://127.0.0.1` dari dalam VM (172.16.2.70) | **200 OK** | Aplikasi & Nginx sehat |
| 2 | `curl https://103.147.241.33` (public IP, bypass Cloudflare) | **timeout (000)** | NAT publik → internal mati |
| 3 | `curl https://sibermas.uinsaizu.ac.id` (via Cloudflare) | **520** | Cloudflare gagal connect origin |
| 4 | DNS resolve | 104.21.55.142, 172.67.149.32 | Cloudflare proxy aktif normal |

---

## Akar Masalah

NAT/port-forward dari IP publik **103.147.241.33** (port 80/443) ke
internal **172.16.2.70** pada router kampus (gateway 172.16.2.65) tidak
berfungsi. Cloudflare tidak dapat menjangkau origin, sehingga seluruh
request publik diterminasi dengan 520.

---

## Yang Sudah Dipastikan SEHAT (sisi server)

- ✅ Aplikasi Laravel & Next.js berjalan normal
- ✅ Nginx aktif, listening pada 80/443
- ✅ PHP-FPM, PostgreSQL, Redis aktif
- ✅ Akses internal LAN (172.16.2.70) responsif
- ✅ Config cache & route cache fresh

---

## Permintaan

Mohon **periksa & restore NAT/port-forward** pada router/firewall kampus
untuk:

```
103.147.241.33:80  → 172.16.2.70:80
103.147.241.33:443 → 172.16.2.70:443
```

Setelah NAT pulih, **layanan akan langsung kembali normal tanpa
deployment ulang** di sisi aplikasi.

---

## Kontak

Admin SIBERMAS — siap dihubungi untuk verifikasi pasca-perbaikan.
