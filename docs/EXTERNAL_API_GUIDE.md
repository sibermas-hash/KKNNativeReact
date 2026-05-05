# 📚 Panduan Integrasi API SIAKAD UIN Saizu

Selamat datang di Panduan Integrasi API SIAKAD UIN Saizu. Dokumen ini ditujukan bagi **Developer Eksternal** (seperti tim pengembang Sistem KKN atau pihak ketiga lainnya) yang akan menarik data dari SIAKAD.

---

## 🔒 Autentikasi & Pengaturan Dasar

API ini menggunakan perlindungan **Sanctum (Bearer Token)**. Anda akan diberikan sebuah *Token* unik oleh Administrator SIAKAD.

Setiap request ke API (kecuali `/api/health`) **WAJIB** menyertakan 2 Header berikut:

```http
Authorization: Bearer <TOKEN_ANDA>
Accept: application/json
```

> **Catatan Penting:**
> Kegagalan menyertakan header `Accept: application/json` akan menyebabkan API mengembalikan error `500 Internal Server Error` (Route [login] not defined) karena sistem mencoba melakukan redirect ke halaman login visual.

---

## ⚙️ Best Practices (Wajib Diikuti)

Mengingat volume data SIAKAD yang sangat besar (terutama data mahasiswa), developer pihak ketiga diwajibkan menerapkan standar berikut:

### 1. Pagination (Pembatasan Halaman)

Semua endpoint data secara otomatis menggunakan *pagination*. Anda harus melakukan *looping* untuk mengambil seluruh data.

- Tambahkan `?page=1`, `?page=2`, dst.
- Atur batas data per request dengan `?per_page=100` (maksimal yang disarankan adalah 200 untuk mencegah *Timeout*).

### 2. Delta Sync (Sinkronisasi Bertahap)

Setelah Anda menarik semua data untuk pertama kalinya (*Full Sync*), penarikan data pada hari-hari berikutnya **HARUS** menggunakan mode Delta.

- Tambahkan parameter `?since=YYYY-MM-DDTHH:mm:ssZ`.
- Contoh: `?since=2026-05-01T00:00:00Z`
- API hanya akan merespon data yang baru ditambahkan atau diubah setelah tanggal tersebut. Sangat menghemat *bandwidth* dan waktu proses.

---

## 📡 Daftar Endpoint API

**Base URL Production:** `https://api.uinsaizu.ac.id`

### 1. Health Check

Mengecek apakah server API sedang menyala dan dapat diakses.

- **Endpoint:** `GET /api/health`
- **Auth:** Tidak perlu
- **Respons Sukses:**

```json
{
    "status": "ok",
    "service": "API SIAKAD UIN Saizu",
    "version": "1.0.0",
    "time": "2026-05-04T12:00:00+00:00"
}
```

### 2. Referensi: Fakultas & Program Studi

Menarik referensi/kamus data untuk relasi Fakultas dan Prodi.

- **Fakultas:** `GET /api/sync/organizations`
- **Prodi:** `GET /api/programs`

### 3. Data Utama: Mahasiswa & Dosen

Menarik data *master* dengan dukungan *pagination* dan *delta sync*.

- **Mahasiswa:** `GET /api/sync/mahasiswa`
- **Dosen:** `GET /api/sync/dosen`

**Contoh Response Data Berhasil:**

```json
{
    "status": "success",
    "message": "Data mahasiswa berhasil diambil",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1001,
                "nim": "20123456",
                "nama": "Ahmad Fulan",
                "prodi_id": 10,
                "fakultas_id": 2,
                "sks_completed": 120,
                "gpa": 3.45,
                "status_aktif": "A"
            }
        ],
        "first_page_url": "...",
        "last_page": 50,
        "per_page": 100,
        "total": 5000
    }
}
```

---

## 💻 Contoh Implementasi Kode

Berikut adalah contoh bagaimana Sistem Anda bisa menarik data mahasiswa secara *looping* hingga halaman terakhir.

### PHP (Laravel Http Client)

```php
use Illuminate\Support\Facades\Http;

$page = 1;
$hasMore = true;
$token = 'TOKEN_DARI_ADMIN';

while ($hasMore) {
    $response = Http::withToken($token)
        ->withHeaders(['Accept' => 'application/json'])
        ->get('https://api.uinsaizu.ac.id/api/sync/mahasiswa', [
            'page' => $page,
            'per_page' => 100,
            'since' => '2026-05-01T00:00:00Z' // Hapus ini jika Full Sync
        ]);

    if ($response->successful()) {
        $data = $response->json()['data'];
        
        // Simpan $data['data'] ke database sistem Anda di sini
        
        if ($page < $data['last_page']) {
            $page++;
        } else {
            $hasMore = false; // Selesai
        }
    } else {
        // Handle Error
        break;
    }
}
```

### JavaScript (Axios / Node.js)

```javascript
const axios = require('axios');

async function syncDataDosen() {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await axios.get('https://api.uinsaizu.ac.id/api/sync/dosen', {
                headers: {
                    'Authorization': 'Bearer TOKEN_DARI_ADMIN',
                    'Accept': 'application/json'
                },
                params: {
                    page: page,
                    per_page: 50
                }
            });

            const paginationData = response.data.data;
            const listDosen = paginationData.data;

            // Proses listDosen ke database lokal Anda di sini...

            if (page < paginationData.last_page) {
                page++;
            } else {
                hasMore = false;
            }
        } catch (error) {
            console.error("Gagal sinkronisasi pada halaman " + page, error.response?.data || error.message);
            break;
        }
    }
}
```

> **Penyelesaian Masalah:**
> Jika Anda menerima kode status **`403 Forbidden`** berformat HTML saat melakukan penarikan data, artinya IP server Anda diblokir oleh sistem keamanan Cloudflare. Silakan hubungi Administrator Jaringan Kampus untuk memasukkan (Whitelist) IP Server Anda ke sistem.
