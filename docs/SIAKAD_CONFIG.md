# Konfigurasi Produksi — SIAKAD API Integration

**Terakhir diverifikasi:** 2026-05-05  
**Status:** ✅ Berjalan — 13.934 mahasiswa, 6.967 halaman

---

## Konfigurasi `.env` (apps/api)

```env
MASTER_API_URL=https://api.uinsaizu.ac.id/api
MASTER_API_TOKEN=2|qvOvRxbr10wO72F3ktSDWWPrTii4MOaj8sVbkMEC7c7fcde3
MASTER_API_TIMEOUT=30
MASTER_API_CIRCUIT_BREAKER_THRESHOLD=5
MASTER_API_CIRCUIT_BREAKER_TIMEOUT=300
```

> **Penting:** `MASTER_API_URL` harus diakhiri `/api` (bukan `/api/`).  
> Token adalah Bearer Token statis dari Administrator SIAKAD — tidak perlu OAuth.

---

## Endpoint yang Digunakan

| Endpoint | Keterangan |
|---|---|
| `GET /api/health` | Health check (tanpa auth) |
| `GET /api/sync/mahasiswa` | Data mahasiswa (paginasi + delta) |
| `GET /api/sync/dosen` | Data dosen (paginasi + delta) |
| `GET /api/sync/organizations` | Data fakultas |
| `GET /api/programs` | Data program studi |

---

## Format Respons Aktual

API SIAKAD menggunakan **Laravel Resource Collection** standar:

```json
{
    "data": [ { "nim": "20123456", "nama": "Ahmad Fulan", ... } ],
    "meta": { "current_page": 1, "last_page": 6967, "total": 13934 },
    "links": { "next": "...?page=2", "last": "...?page=6967" }
}
```

> **Catatan:** Panduan resmi SIAKAD menunjukkan format `{ data: { data: [...], last_page } }` — format ini **tidak akurat**. Format aktual adalah `data` + `meta` + `links` di root.

---

## Field Mahasiswa dari API

```
id, nim, nama, email, nik, nama_ibu, fakultas_id (kode: "FTIK"),
prodi_id (kode: "70233"), angkatan, jenis_kelamin, birth_place,
tanggal_lahir, phone, alamat, sks_completed, gpa,
status_bta_ppi, is_paid_ukt, semester, status_aktif
```

**Mapping ke database lokal:**
- `fakultas_id` (kode string) → `Fakultas.master_id` → `Fakultas.id`
- `prodi_id` (kode string) → `Prodi.master_id` → `Prodi.id`

---

## Menjalankan Sync

```bash
# Full sync pertama kali (semua data)
php artisan master:sync --type=all

# Delta sync harian (hanya data baru/berubah)
php artisan master:sync --type=mahasiswa --since=2026-05-05T00:00:00Z
php artisan master:sync --type=dosen --since=2026-05-05T00:00:00Z
```

---

## Troubleshooting

| Error | Penyebab | Solusi |
|---|---|---|
| `403 Forbidden` (HTML) | IP diblokir Cloudflare | Minta whitelist IP ke Admin Jaringan Kampus |
| `500 Internal Server Error` | Header `Accept: application/json` tidak dikirim | Sudah difix di `MasterApiClient.php` |
| `Route [login] not defined` | Sama seperti di atas | Sama |
| Data hanya 1 halaman | `yieldAllPages()` tidak baca `meta.last_page` | Sudah difix 2026-05-05 |
| `RedisException: Connection refused` | Redis tidak aktif | Set `CACHE_STORE=database` di `.env` |
