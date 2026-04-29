# Panduan Integrasi REST API SIAKAD Kampus ↔ Sistem KKN UIN Saizu

## 📋 Ikhtisar

Sistem KKN membutuhkan sinkronisasi data **mahasiswa**, **dosen**, **fakultas**, dan **program studi** secara rutin dari sistem kampus (SIAKAD).

Sesuai kesepakatan, integrasi ini menggunakan metode **API Pull**.
Dalam metode ini, **Tim IT Kampus cukup menyediakan 4 endpoint REST API** (sebagai *provider*), dan Sistem KKN akan secara otomatis mengambil (pull) data tersebut secara berkala.

---

## 🔗 Endpoint API yang Harus Disediakan Kampus

Sistem KKN akan memanggil endpoint berikut pada server API SIAKAD. Semua response diwajibkan dalam format **JSON**.

| Endpoint | Kegunaan |
|----------|----------|
| `GET /sync/organizations` | Mengambil daftar **Fakultas** |
| `GET /programs` | Mengambil daftar **Program Studi** |
| `GET /sync/dosen` | Mengambil daftar **Dosen** |
| `GET /sync/mahasiswa` | Mengambil daftar **Mahasiswa** |

> **Mode Delta (Opsional namun Sangat Disarankan):**
> Endpoint di atas sebaiknya mendukung parameter query `?since=<ISO8601>` (contoh: `?since=2024-01-01T00:00:00Z`). Jika parameter ini dikirim oleh KKN, SIAKAD hanya perlu mengembalikan data yang **berubah, ditambah, atau dihapus** sejak waktu tersebut untuk menghemat *bandwidth* dan *processing time*.

---

## 📄 Struktur Respons JSON & Kamus Data

Sistem KKN mengharapkan SIAKAD mengembalikan respons JSON dengan format *wrapper* `data` berupa *array of objects*. Berikut adalah struktur untuk masing-masing entitas:

### 1. Data Mahasiswa (`GET /sync/mahasiswa`)

Field akademik seperti `sks_completed` dan `status_bta_ppi` **SANGAT KRUSIAL** untuk menentukan kelayakan mahasiswa mendaftar KKN.

**Contoh Respons JSON:**

```json
{
    "data": [
        {
            "id": "mhs-123456789",
            "nim": "123456789",
            "nama": "Ahmad Budi Santoso",
            "email": "ahmad@student.uinsaizu.ac.id",
            "nik": "3302100101000001",
            "nama_ibu": "Siti Aminah",
            "fakultas_id": "01",
            "prodi_id": "0123",
            "angkatan": 2022,
            "jenis_kelamin": "L",
            "tanggal_lahir": "2000-05-15",
            "phone": "081234567890",
            "alamat": "Jl. Raya No. 123",
            "sks_completed": 120,
            "gpa": 3.65,
            "status_bta_ppi": "LULUS",
            "is_paid_ukt": true,
            "status_aktif": "AKTIF"
        }
    ]
}
```

**Kamus Data Mahasiswa:**

| Field | Wajib? | Tipe | Keterangan |
|-------|--------|------|------------|
| `id` | Opsional | string | ID unik record dari SIAKAD kampus |
| `nim` | ✅ **Ya** | string | Nomor Induk Mahasiswa |
| `nama` | ✅ **Ya** | string | Nama lengkap |
| `email` | Opsional | string | Akan dibuat otomatis jika kosong (`{nim}@student.uinsaizu.ac.id`) |
| `nik` | Opsional | string | Nomor Induk Kependudukan |
| `nama_ibu` | Opsional | string | Nama ibu kandung |
| `fakultas_id` | ✅ **Ya** | string | ID / Kode Fakultas |
| `prodi_id` | ✅ **Ya** | string | ID / Kode Program Studi |
| `angkatan` | Opsional | integer | Tahun masuk (contoh: `2022`) |
| `jenis_kelamin` | Opsional | string | `L` (Laki-laki) atau `P` (Perempuan) |
| `tanggal_lahir` | Opsional | string | Format: `YYYY-MM-DD` (Digunakan sistem KKN sebagai password awal akun) |
| `phone` | Opsional | string | Nomor HP / WhatsApp |
| `alamat` | Opsional | string | Alamat domisili |
| `sks_completed` | ✅ **Ya** | integer | **Total SKS yang sudah LULUS** |
| `gpa` | Opsional | float | Indeks Prestasi Kumulatif (IPK) |
| `status_bta_ppi` | ✅ **Ya** | string | Wajib berisi `LULUS` atau `BELUM_LULUS` |
| `is_paid_ukt` | Opsional | boolean | Status pelunasan UKT semester berjalan |
| `status_aktif` | Opsional | string | Status akademik (contoh: `AKTIF`, `CUTI`, `LULUS`) |

---

### 2. Data Dosen (`GET /sync/dosen`)

**Contoh Respons JSON:**

```json
{
    "data": [
        {
            "id": "dsn-198501012010011001",
            "nip": "198501012010011001",
            "nama": "Dr. H. Ahmad Fauzi, M.Pd",
            "email": "fauzi@uinsaizu.ac.id",
            "fakultas_id": "01",
            "jenis_kelamin": "L",
            "tanggal_lahir": "1985-01-01",
            "phone": "081234567890",
            "status_pegawai": "PNS",
            "status_aktif": "AKTIF"
        }
    ]
}
```

**Kamus Data Dosen:**

| Field | Wajib? | Tipe | Keterangan |
|-------|--------|------|------------|
| `id` | Opsional | string | ID unik record dari SIAKAD kampus |
| `nip` | ✅ **Ya** | string | Nomor Induk Pegawai / Dosen |
| `nama` | ✅ **Ya** | string | Nama lengkap beserta gelar |
| `email` | Opsional | string | Akan dibuat otomatis jika kosong (`{nip}@kkn.local`) |
| `fakultas_id` | ✅ **Ya** | string | ID / Kode Fakultas |
| `jenis_kelamin` | Opsional | string | `L` (Laki-laki) atau `P` (Perempuan) |
| `tanggal_lahir` | Opsional | string | Format: `YYYY-MM-DD` (Digunakan sistem KKN sebagai password awal akun) |
| `phone` | Opsional | string | Nomor HP / WhatsApp |
| `status_pegawai` | Opsional | string | `PNS`, `CPNS`, `NON-PNS`, dll |
| `status_aktif` | Opsional | string | `AKTIF`, `TUGAS BELAJAR`, dll |

---

### 3. Data Fakultas (`GET /sync/organizations`)

**Contoh Respons JSON:**

```json
{
    "data": [
        {
            "id": "01",
            "name": "Fakultas Tarbiyah dan Ilmu Keguruan",
            "short_name": "FTIK"
        }
    ]
}
```

---

### 4. Data Program Studi (`GET /programs`)

**Contoh Respons JSON:**

```json
{
    "data": [
        {
            "id": "0123",
            "organization_id": "01",
            "name": "Pendidikan Agama Islam",
            "short_name": "PAI",
            "jenjang": "S1"
        }
    ]
}
```

---

## ⚙️ Keamanan API (Otentikasi)

Sistem KKN mendukung beberapa metode otentikasi untuk mengambil data dari SIAKAD. Kampus bisa memilih mana yang ingin digunakan. Silakan informasikan pilihan otentikasi kepada Admin KKN:

1. **Static Bearer Token**: KKN akan mengirim header `Authorization: Bearer <TOKEN>`.
2. **OAuth2 Client Credentials**: KKN akan menggunakan `Client ID` dan `Client Secret` untuk *request* token secara dinamis.
3. **No Auth (IP Whitelist)**: API SIAKAD dibuka khusus untuk IP Server KKN.

---

## ❓ FAQ (Tanya Jawab)

**Q: Kapan sinkronisasi data ini dilakukan?**
A: Admin KKN akan menjadwalkan penarikan data secara otomatis menggunakan *cron job* di server KKN (misal: setiap malam pukul 01:00) atau mengeksekusinya secara manual di *dashboard* admin ketika ada masa pendaftaran KKN.

**Q: Apakah API SIAKAD perlu menangani penyimpanan data?**
A: Tidak. API Kampus cukup berfungsi sebagai sumber baca (*read-only*). Sistem KKN akan mengurus proses insert/update/pembuatan akun *user* di database KKN.

**Q: Bagaimana jika *field* tertentu (seperti `nama_ibu`) tidak ada di SIAKAD?**
A: Tidak masalah. Cukup berikan nilai `null` atau hilangkan kunci (key) JSON tersebut. Sistem KKN hanya mewajibkan *field* yang ditandai "✅ Ya".

**Q: Siapa yang dihubungi jika ada masalah koneksi API?**
A: Admin sistem KKN di <admin@uinsaizu.ac.id>
