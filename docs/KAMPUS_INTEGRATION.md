# Dokumentasi Integrasi Sistem KKN UIN Saizu dengan Sistem Kampus

## 📋 Overview

Sistem KKN UIN Saizu menerima data master (mahasiswa, dosen, lokasi) dari sistem kampus melalui **Webhook** yang aman. Dokumentasi ini menjelaskan cara mengkonfigurasi dan mengirim data dari sistem kampus ke sistem KKN.

---

## 🔐 Konfigurasi Keamanan

### 1. Webhook Secret

Sistem menggunakan **HMAC-SHA256** untuk verifikasi webhook.

#### Generate Secret di Sistem KKN

```bash
cd /path/to/kknuinsaizu
php -r "echo 'MASTER_WEBHOOK_SECRET=' . bin2hex(random_bytes(32)) . PHP_EOL;"
```

Output contoh:

```
MASTER_WEBHOOK_SECRET=<SECRET_YANG_DIGENERATE>
```

#### Simpan di `.env` KKN

```env
MASTER_WEBHOOK_SECRET=<SECRET_YANG_DIGENERATE>
```

#### Gunakan secret yang sama di sistem kampus untuk generate signature

---

## 📡 Endpoint Webhook

### URL

```
POST https://kkn.uinsaizu.ac.id/api/webhooks/master-data
```

### Headers yang Diperlukan

```http
Content-Type: application/json
X-Hub-Signature: sha256=<HMAC_HASH>
X-Webhook-Timestamp: <UNIX_TIMESTAMP>
```

### Contoh Generate Signature (PHP)

```php
<?php
$secret = 'WEBHOOK_SECRET_DARI_ENV';
$payload = json_encode($data);
$timestamp = time();

// Format: timestamp.payload
$signedPayload = $timestamp . '.' . $payload;
$signature = 'sha256=' . hash_hmac('sha256', $signedPayload, $secret);

$headers = [
    'Content-Type: application/json',
    'X-Hub-Signature: ' . $signature,
    'X-Webhook-Timestamp: ' . $timestamp,
];

// Kirim dengan curl atau HTTP client
```

### Contoh Generate Signature (Node.js/JavaScript)

```javascript
const crypto = require('crypto');

function generateSignature(payload, secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
    const signature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');
    
    return { signature, timestamp };
}

// Penggunaan
const payload = {
    event: 'mahasiswa.created',
    webhook_id: 'unique-id-123',
    data: {
        payload: {
            nim: '123456789',
            nama: 'John Doe',
            // ... field lainnya
        }
    }
};

const { signature, timestamp } = generateSignature(payload, process.env.WEBHOOK_SECRET);

// Kirim HTTP request dengan headers:
// X-Hub-Signature: signature
// X-Webhook-Timestamp: timestamp
```

---

## 📦 Format Data Webhook

### Struktur Umum

```json
{
    "event": "mahasiswa.created",
    "webhook_id": "unique-identifier",
    "data": {
        "payload": {
            // Data spesifik berdasarkan event
        }
    }
}
```

### 1. Event Mahasiswa

#### `mahasiswa.created` / `mahasiswa.updated`

```json
{
    "event": "mahasiswa.created",
    "webhook_id": "mhs-123456",
    "data": {
        "payload": {
            "nim": "123456789",
            "nama": "Ahmad Budi Santoso",
            "email": "ahmad@uinsaizu.ac.id",
            "fakultas_id": "01",
            "prodi_id": "0123",
            "jenis_kelamin": "L",
            "tanggal_lahir": "2000-05-15",
            "phone": "081234567890",
            "alamat": "Jl. Raya No. 123",
            "status_aktif": "AKTIF",
            "id": "unique-id-from-kampus"
        }
    }
}
```

#### `mahasiswa.deleted`

```json
{
    "event": "mahasiswa.deleted",
    "webhook_id": "mhs-123456",
    "data": {
        "payload": {
            "nim": "123456789"
        }
    }
}
```

### 2. Event Dosen

#### `dosen.created` / `dosen.updated`

```json
{
    "event": "dosen.created",
    "webhook_id": "dsn-123456",
    "data": {
        "payload": {
            "nip": "198501012010011001",
            "nama": "Dr. H. Ahmad Fauzi, M.Pd",
            "email": "fauzi@uinsaizu.ac.id",
            "fakultas_id": "01",
            "jenis_kelamin": "L",
            "tanggal_lahir": "1985-01-01",
            "phone": "081234567890",
            "status_pegawai": "PNS",
            "status_aktif": "AKTIF",
            "id": "unique-id-from-kampus"
        }
    }
}
```

#### `dosen.deleted`

```json
{
    "event": "dosen.deleted",
    "webhook_id": "dsn-123456",
    "data": {
        "payload": {
            "nip": "198501012010011001"
        }
    }
}
```

---

## 🌐 API Publik (Opsional)

Jika kampus perlu mengakses data secara langsung, gunakan **API Key**.

### Mendapatkan API Key

Hubungi admin KKN untuk generate API key, atau jika self-service diaktifkan:

```bash
POST /api/register
Content-Type: application/json

{
    "name": "Sistem Kampus",
    "email": "admin@uinsaizu.ac.id"
}
```

### Mengakses Data Lokasi

```bash
GET /api/v1/lokasi?per_page=100
Headers:
    X-API-Key: <API_KEY>
```

### Field yang Bisa Ditulis (Lokasi)

- `village_name` - Nama desa/kelurahan
- `district_name` - Nama kecamatan
- `regency_name` - Nama kabupaten/kota
- `village_code` - Kode BPS (10 digit)
- `capacity` - Kapasitas maksimal kelompok
- `address` - Alamat lengkap
- `latitude` - Koordinat latitude
- `longitude` - Koordinat longitude
- `fakultas_id` - ID fakultas
- `province_id` - ID provinsi (2 digit)
- `regency_id` - ID kabupaten (4 digit)
- `district_id` - ID kecamatan (6 digit)

---

## 🧪 Testing Webhook

### Test dari Sistem KKN

```bash
cd /Users/macm4/Documents/KKN/kknuinsaizu
php artisan tinker
```

```php
// Generate signature
$secret = env('MASTER_WEBHOOK_SECRET');
$payload = json_encode([
    'event' => 'mahasiswa.created',
    'webhook_id' => 'test-123',
    'data' => [
        'payload' => [
            'nim' => '999999',
            'nama' => 'Test Student',
            'email' => 'test@uinsaizu.ac.id'
        ]
    ]
]);
$timestamp = time();
$signedPayload = $timestamp . '.' . $payload;
$signature = 'sha256=' . hash_hmac('sha256', $signedPayload, $secret);

// Simulate request
$response = Http::withHeaders([
    'X-Hub-Signature' => $signature,
    'X-Webhook-Timestamp' => $timestamp,
])->post(config('app.url') . '/api/webhooks/master-data', json_decode($payload, true));

echo $response->status() . ': ' . $response->body();
```

### Check Log

```bash
tail -f storage/logs/laravel.log | grep -i "webhook"
```

---

## ✅ Checklist Integrasi

### Di Sistem Kampus

- [ ] Generate `MASTER_WEBHOOK_SECRET` (sama dengan KKN)
- [ ] Implementasi fungsi generate HMAC-SHA256 signature
- [ ] Tambahkan header `X-Hub-Signature` dan `X-Webhook-Timestamp`
- [ ] Pastikan format event: `mahasiswa.created`, `dosen.created`, dll
- [ ] Test webhook dengan data sample
- [ ] Setup retry mechanism jika gagal (timeout 10s, max 3x retry)

### Di Sistem KKN

- [ ] Set `MASTER_WEBHOOK_SECRET` di `.env`
- [ ] Pastikan route `/api/webhooks/master-data` bisa diakses
- [ ] Cek log webhook: `storage/logs/laravel.log`
- [ ] Verify webhook berjalan: cek tabel `mahasiswa` dan `dosen`

---

## 📞 Bantuan

Jika ada kendala, hubungi:

- **Email**: <admin@uinsaizu.ac.id>
- **Cek log**: `storage/logs/laravel.log`
- **Cek route**: `php artisan route:list | grep webhook`

---

## 🔗 Referensi

- [Laravel Webhook Documentation](https://laravel.com/docs/middleware)
- [HMAC-SHA256 Explanation](https://en.wikipedia.org/wiki/HMAC)
- [emsifa API Wilayah](https://github.com/emsifa/api-wilayah-indonesia) - Untuk referensi kode BPS)

---

## 📝 Contoh Script PHP Lengkap (Untuk Tim Kampus)

Berikut adalah script PHP lengkap yang bisa langsung dipakai untuk mengirim webhook ke sistem KKN:

### File: `send_webhook.php`

```php
<?php

declare(strict_types=1);

/**
 * Script untuk mengirim webhook ke sistem KKN UIN Saizu
 * 
 * Cara penggunaan:
 * php send_webhook.php [event] [nim/nip]
 * 
 * Contoh:
 * php send_webhook.php mahasiswa.created 123456789
 * php send_webhook.php dosen.created 198501012010011001
 */

class KKNWebhookSender
{
    private string $secret;
    private string $webhookUrl;
    private int $timeout;
    
    public function __construct(
        string $secret,
        string $webhookUrl = 'https://kkn.uinsaizu.ac.id/api/webhooks/master-data',
        int $timeout = 30
    ) {
        $this->secret = $secret;
        $this->webhookUrl = $webhookUrl;
        $this->timeout = $timeout;
    }
    
    /**
     * Generate HMAC-SHA256 signature
     */
    private function generateSignature(array $payload, int $timestamp): string
    {
        $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $signedPayload = $timestamp . '.' . $jsonPayload;
        $signature = hash_hmac('sha256', $signedPayload, $this->secret);
        
        return 'sha256=' . $signature;
    }
    
    /**
     * Kirim webhook ke sistem KKN
     */
    public function send(array $eventData): array
    {
        $timestamp = time();
        $payload = $eventData;
        $signature = $this->generateSignature($payload, $timestamp);
        
        // Setup cURL
        $ch = curl_init($this->webhookUrl);
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Hub-Signature: ' . $signature,
                'X-Webhook-Timestamp: ' . $timestamp,
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'error' => $error,
                'http_code' => $httpCode,
            ];
        }
        
        return [
            'success' => true,
            'http_code' => $httpCode,
            'response' => $response,
            'signature' => $signature,
            'timestamp' => $timestamp,
        ];
    }
    
    /**
     * Format event mahasiswa
     */
    public static function formatMahasiswaCreated(
        string $nim,
        string $nama,
        string $email,
        string $fakultasId,
        string $prodiId,
        string $jenisKelamin = 'L',
        ?string $tanggalLahir = null,
        ?string $phone = null,
        ?string $alamat = null,
        string $statusAktif = 'AKTIF'
    ): array {
        return [
            'event' => 'mahasiswa.created',
            'webhook_id' => 'mhs-' . $nim . '-' . time(),
            'data' => [
                'payload' => [
                    'nim' => $nim,
                    'nama' => $nama,
                    'email' => $email,
                    'fakultas_id' => $fakultasId,
                    'prodi_id' => $prodiId,
                    'jenis_kelamin' => $jenisKelamin,
                    'tanggal_lahir' => $tanggalLahir,
                    'phone' => $phone,
                    'alamat' => $alamat,
                    'status_aktif' => $statusAktif,
                    'id' => 'mhs-' . $nim, // unique ID dari kampus
                ]
            ]
        ];
    }
    
    /**
     * Format event dosen
     */
    public static function formatDosenCreated(
        string $nip,
        string $nama,
        string $email,
        string $fakultasId,
        string $jenisKelamin = 'L',
        ?string $tanggalLahir = null,
        ?string $phone = null,
        string $statusPegawai = 'PNS',
        string $statusAktif = 'AKTIF'
    ): array {
        return [
            'event' => 'dosen.created',
            'webhook_id' => 'dsn-' . $nip . '-' . time(),
            'data' => [
                'payload' => [
                    'nip' => $nip,
                    'nama' => $nama,
                    'email' => $email,
                    'fakultas_id' => $fakultasId,
                    'jenis_kelamin' => $jenisKelamin,
                    'tanggal_lahir' => $tanggalLahir,
                    'phone' => $phone,
                    'status_pegawai' => $statusPegawai,
                    'status_aktif' => $statusAktif,
                    'id' => 'dsn-' . $nip, // unique ID dari kampus
                ]
            ]
        ];
    }
    
    /**
     * Format event deleted
     */
    public static function formatDeleted(string $eventType, string $identifier, string $id): array
    {
        return [
            'event' => $eventType . '.deleted',
            'webhook_id' => $eventType . '-del-' . time(),
            'data' => [
                'payload' => [
                    $identifier => $id,
                ]
            ]
        ];
    }
}

// ============================================================================
// CONTOH PENGGUNAAN
// ============================================================================

// Konfigurasi (sesuaikan dengan environment kampus)
$secret = 'SECRET_DARI_ADMIN_KKN'; // Hubungi admin KKN untuk mendapatkan secret
$webhookUrl = 'https://kkn.uinsaizu.ac.id/api/webhooks/master-data';

// Inisialisasi sender
$sender = new KKNWebhookSender($secret, $webhookUrl);

// ============================================================================
// CONTOH 1: Kirim data mahasiswa baru
// ============================================================================
echo "=== Contoh 1: Mahasiswa Created ===\n";

$mahasiswaData = KKNWebhookSender::formatMahasiswaCreated(
    nim: '123456789',
    nama: 'Ahmad Budi Santoso',
    email: 'ahmad@uinsaizu.ac.id',
    fakultasId: '01',
    prodiId: '0123',
    jenisKelamin: 'L',
    tanggalLahir: '2000-05-15',
    phone: '081234567890',
    alamat: 'Jl. Raya No. 123',
    statusAktif: 'AKTIF'
);

$result = $sender->send($mahasiswaData);

if ($result['success']) {
    echo "✅ Berhasil mengirim webhook\n";
    echo "HTTP Code: " . $result['http_code'] . "\n";
    echo "Response: " . $result['response'] . "\n";
} else {
    echo "❌ Gagal mengirim webhook\n";
    echo "Error: " . $result['error'] . "\n";
}

echo "\n";

// ============================================================================
// CONTOH 2: Kirim data dosen baru
// ============================================================================
echo "=== Contoh 2: Dosen Created ===\n";

$dosenData = KKNWebhookSender::formatDosenCreated(
    nip: '198501012010011001',
    nama: 'Dr. H. Ahmad Fauzi, M.Pd',
    email: 'fauzi@uinsaizu.ac.id',
    fakultasId: '01',
    jenisKelamin: 'L',
    tanggalLahir: '1985-01-01',
    phone: '081234567890',
    statusPegawai: 'PNS',
    statusAktif: 'AKTIF'
);

$result = $sender->send($dosenData);

if ($result['success']) {
    echo "✅ Berhasil mengirim webhook\n";
    echo "HTTP Code: " . $result['http_code'] . "\n";
    echo "Response: " . $result['response'] . "\n";
} else {
    echo "❌ Gagal mengirim webhook\n";
    echo "Error: " . $result['error'] . "\n";
}

echo "\n";

// ============================================================================
// CONTOH 3: Hapus mahasiswa (soft delete)
// ============================================================================
echo "=== Contoh 3: Mahasiswa Deleted ===\n";

$deleteData = KKNWebhookSender::formatDeleted('mahasiswa', 'nim', '123456789');

$result = $sender->send($deleteData);

if ($result['success']) {
    echo "✅ Berhasil mengirim webhook delete\n";
    echo "HTTP Code: " . $result['http_code'] . "\n";
} else {
    echo "❌ Gagal mengirim webhook delete\n";
}

// ============================================================================
// CONTOH 4: Bulk send (loop dari database)
// ============================================================================
echo "\n=== Contoh 4: Bulk Send dari Database (Pseudocode) ===\n";

/**
 * Contoh penggunaan dengan database kampus:
 * 
 * $pdo = new PDO('mysql:host=localhost;dbname=kampus_db', 'user', 'pass');
 * $stmt = $pdo->query("SELECT * FROM mahasiswa WHERE sync_status = 0 LIMIT 100");
 * 
 * while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
 *     $data = KKNWebhookSender::formatMahasiswaCreated(
 *         nim: $row['nim'],
 *         nama: $row['nama'],
 *         // ... field lainnya
 *     );
 *     
 *     $result = $sender->send($data);
 *     
 *     if ($result['success'] && $result['http_code'] === 200) {
 *         // Update sync_status di database kampus
 *         // $pdo->exec("UPDATE mahasiswa SET sync_status = 1 WHERE nim = '{$row['nim']}'");
 *     }
 * }
 */

echo "Lihat komentar di kode untuk contoh bulk send\n";

// ============================================================================
// HELPER: Verify Signature (Untuk testing)
// ============================================================================
echo "\n=== Helper: Verify Signature ===\n";

function verifyWebhookSignature(string $secret, string $payload, string $receivedSignature, int $timestamp): bool
{
    $signedPayload = $timestamp . '.' . $payload;
    $expected = 'sha256=' . hash_hmac('sha256', $signedPayload, $secret);
    
    return hash_equals($expected, $receivedSignature);
}

// Test verify
$testPayload = json_encode([
    'event' => 'test',
    'data' => ['test' => 'data']
]);
$testTimestamp = time();
$testSignature = 'sha256=' . hash_hmac('sha256', $testTimestamp . '.' . $testPayload, $secret);

$isValid = verifyWebhookSignature($secret, $testPayload, $testSignature, $testTimestamp);
echo $isValid ? "✅ Signature valid\n" : "❌ Signature invalid\n";

echo "\n";
echo "📊 Dokumentasi lengkap: docs/KAMPUS_INTEGRATION.md\n";
```

### Cara Menjalankan

1. **Simpan script** sebagai `send_webhook.php`
2. **Set secret** di baris 193: `$secret = 'YOUR_SECRET_HERE';`
3. **Jalankan** dari command line:

   ```bash
   php send_webhook.php
   ```

### Fitur Script

- ✅ **Fungsi lengkap** untuk mengirim webhook mahasiswa & dosen
- ✅ **Generate signature** HMAC-SHA256 otomatis
- ✅ **Contoh kode** untuk bulk send dari database
- ✅ **Error handling** dan timeout configuration
- ✅ **Helper verify signature** untuk testing

### Integrasi dengan Database Kampus

Tambahkan flag `sync_status` di tabel mahasiswa/dosen kampus:

```sql
ALTER TABLE mahasiswa ADD COLUMN sync_status TINYINT DEFAULT 0;
ALTER TABLE dosen ADD COLUMN sync_status TINYINT DEFAULT 0;
```

Kemudian gunakan loop (Contoh 4) untuk sinkronisasi data yang belum terkirim.

---

**📁 File dokumentasi lengkap**: `/Users/macm4/Documents/KKN/kknuinsaizu/docs/KAMPUS_INTEGRATION.md`

---

## 🐍 Contoh Script Python Lengkap (Untuk Tim Kampus)

Berikut adalah script Python lengkap yang bisa langsung dipakai untuk mengirim webhook ke sistem KKN:

### File: `send_webhook.py`

```python
#!/usr/bin/env python3
"""
Script untuk mengirim webhook ke sistem KKN UIN Saizu
Cara penggunaan:
    python3 send_webhook.py [event] [identifier]
    
Contoh:
    python3 send_webhook.py mahasiswa.created 123456789
    python3 send_webhook.py dosen.created 198501012010011001
"""

import hashlib
import hmac
import json
import time
import sys
from typing import Dict, Any, Optional
import requests

class KKNWebhookSender:
    """Client untuk mengirim webhook ke sistem KKN"""
    
    def __init__(self, secret: str, webhook_url: str = 'https://kkn.uinsaizu.ac.id/api/webhooks/master-data', timeout: int = 30):
        self.secret = secret.encode('utf-8')
        self.webhook_url = webhook_url
        self.timeout = timeout
    
    def generate_signature(self, payload: Dict[str, Any], timestamp: int) -> str:
        """Generate HMAC-SHA256 signature"""
        json_payload = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
        signed_payload = f"{timestamp}.{json_payload}"
        signature = hmac.new(self.secret, signed_payload.encode('utf-8'), hashlib.sha256).hexdigest()
        return f"sha256={signature}"
    
    def send(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Kirim webhook ke sistem KKN"""
        timestamp = int(time.time())
        signature = self.generate_signature(event_data, timestamp)
        
        headers = {
            'Content-Type': 'application/json',
            'X-Hub-Signature': signature,
            'X-Webhook-Timestamp': str(timestamp),
        }
        
        try:
            response = requests.post(
                self.webhook_url,
                json=event_data,
                headers=headers,
                timeout=self.timeout,
                verify=True
            )
            
            return {
                'success': True,
                'http_code': response.status_code,
                'response': response.text,
                'signature': signature,
                'timestamp': timestamp
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'http_code': 0
            }
    
    @staticmethod
    def format_mahasiswa_created(
        nim: str,
        nama: str,
        email: str,
        fakultas_id: str,
        prodi_id: str,
        jenis_kelamin: str = 'L',
        tanggal_lahir: Optional[str] = None,
        phone: Optional[str] = None,
        alamat: Optional[str] = None,
        status_aktif: str = 'AKTIF'
    ) -> Dict[str, Any]:
        """Format event mahasiswa.created"""
        return {
            'event': 'mahasiswa.created',
            'webhook_id': f"mhs-{nim}-{int(time.time())}",
            'data': {
                'payload': {
                    'nim': nim,
                    'nama': nama,
                    'email': email,
                    'fakultas_id': fakultas_id,
                    'prodi_id': prodi_id,
                    'jenis_kelamin': jenis_kelamin,
                    'tanggal_lahir': tanggal_lahir,
                    'phone': phone,
                    'alamat': alamat,
                    'status_aktif': status_aktif,
                    'id': f"mhs-{nim}"
                }
            }
        }
    
    @staticmethod
    def format_dosen_created(
        nip: str,
        nama: str,
        email: str,
        fakultas_id: str,
        jenis_kelamin: str = 'L',
        tanggal_lahir: Optional[str] = None,
        phone: Optional[str] = None,
        status_pegawai: str = 'PNS',
        status_aktif: str = 'AKTIF'
    ) -> Dict[str, Any]:
        """Format event dosen.created"""
        return {
            'event': 'dosen.created',
            'webhook_id': f"dsn-{nip}-{int(time.time())}",
            'data': {
                'payload': {
                    'nip': nip,
                    'nama': nama,
                    'email': email,
                    'fakultas_id': fakultas_id,
                    'jenis_kelamin': jenis_kelamin,
                    'tanggal_lahir': tanggal_lahir,
                    'phone': phone,
                    'status_pegawai': status_pegawai,
                    'status_aktif': status_aktif,
                    'id': f"dsn-{nip}"
                }
            }
        }
    
    @staticmethod
    def format_deleted(event_type: str, identifier: str, id_value: str) -> Dict[str, Any]:
        """Format event deleted (mahasiswa.deleted / dosen.deleted)"""
        return {
            'event': f"{event_type}.deleted",
            'webhook_id': f"{event_type}-del-{int(time.time())}",
            'data': {
                'payload': {
                    identifier: id_value
                }
            }
        }

# ===========================================================================
# CONTOH PENGGUNAAN
# ===========================================================================

if __name__ == '__main__':
    # Konfigurasi
    SECRET = 'SECRET_DARI_ADMIN_KKN'  # Hubungi admin KKN untuk mendapatkan secret
    WEBHOOK_URL = 'https://kkn.uinsaizu.ac.id/api/webhooks/master-data'
    
    # Inisialisasi sender
    sender = KKNWebhookSender(SECRET, WEBHOOK_URL)
    
    print("=" * 60)
    print("KKN UIN Saizu Webhook Sender - Python Version")
    print("=" * 60)
    
    # ===========================================================================
    # CONTOH 1: Kirim data mahasiswa baru
    # ===========================================================================
    print("\n=== Contoh 1: Mahasiswa Created ===")
    
    mahasiswa_data = KKNWebhookSender.format_mahasiswa_created(
        nim='123456789',
        nama='Ahmad Budi Santoso',
        email='ahmad@uinsaizu.ac.id',
        fakultas_id='01',
        prodi_id='0123',
        jenis_kelamin='L',
        tanggal_lahir='2000-05-15',
        phone='081234567890',
        alamat='Jl. Raya No. 123',
        status_aktif='AKTIF'
    )
    
    result = sender.send(mahasiswa_data)
    
    if result['success']:
        print(f"✅ Berhasil mengirim webhook")
        print(f"HTTP Code: {result['http_code']}")
        print(f"Response: {result['response']}")
    else:
        print(f"❌ Gagal mengirim webhook")
        print(f"Error: {result['error']}")
    
    # ===========================================================================
    # CONTOH 2: Kirim data dosen baru
    # ===========================================================================
    print("\n=== Contoh 2: Dosen Created ===")
    
    dosen_data = KKNWebhookSender.format_dosen_created(
        nip='198501012010011001',
        nama='Dr. H. Ahmad Fauzi, M.Pd',
        email='fauzi@uinsaizu.ac.id',
        fakultas_id='01',
        jenis_kelamin='L',
        tanggal_lahir='1985-01-01',
        phone='081234567890',
        status_pegawai='PNS',
        status_aktif='AKTIF'
    )
    
    result = sender.send(dosen_data)
    
    if result['success']:
        print(f"✅ Berhasil mengirim webhook")
        print(f"HTTP Code: {result['http_code']}")
    else:
        print(f"❌ Gagal mengirim webhook")
    
    # ===========================================================================
    # CONTOH 3: Hapus mahasiswa (soft delete)
    # ===========================================================================
    print("\n=== Contoh 3: Mahasiswa Deleted ===")
    
    delete_data = KKNWebhookSender.format_deleted('mahasiswa', 'nim', '123456789')
    
    result = sender.send(delete_data)
    
    if result['success']:
        print(f"✅ Berhasil mengirim webhook delete")
        print(f"HTTP Code: {result['http_code']}")
    else:
        print(f"❌ Gagal mengirim webhook delete")
    
    # ===========================================================================
    # CONTOH 4: Bulk send dari database (SQLAlchemy contoh)
    # ===========================================================================
    print("\n=== Contoh 4: Bulk Send dari Database (Pseudocode) ===")
    print("""
Contoh penggunaan dengan database kampus (SQLAlchemy):
    
from sqlalchemy import create_engine, text
    
engine = create_engine('mysql+pymysql://user:pass@localhost/kampus_db')
    
with engine.connect() as conn:
    result = conn.execute(text("SELECT * FROM mahasiswa WHERE sync_status = 0 LIMIT 100"))
    
    for row in result:
        data = KKNWebhookSender.format_mahasiswa_created(
            nim=row['nim'],
            nama=row['nama'],
            # ... field lainnya
        )
        
        result = sender.send(data)
        
        if result['success'] and result['http_code'] == 200:
            # Update sync_status di database kampus
            conn.execute(
                text("UPDATE mahasiswa SET sync_status = 1 WHERE nim = :nim"),
                {'nim': row['nim']}
            )
""")
    
    # ===========================================================================
    # HELPER: Verify Signature (Untuk testing)
    # ===========================================================================
    print("\n=== Helper: Verify Signature ===")
    
    def verify_webhook_signature(secret: str, payload: str, received_signature: str, timestamp: int) -> bool:
        signed_payload = f"{timestamp}.{payload}"
        expected = hmac.new(
            secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        expected_signature = f"sha256={expected}"
        return hmac.compare_digest(expected_signature, received_signature)
    
    # Test verify
    test_payload = json.dumps({'event': 'test', 'data': {'test': 'data'}})
    test_timestamp = int(time.time())
    test_signature = sender.generate_signature({'event': 'test', 'data': {'test': 'data'}}, test_timestamp)
    
    is_valid = verify_webhook_signature(SECRET, test_payload, test_signature, test_timestamp)
    print(f"{'✅ Signature valid' if is_valid else '❌ Signature invalid'}")
    
    print("\n" + "=" * 60)
    print("📊 Dokumentasi lengkap: docs/KAMPUS_INTEGRATION.md")
    print("=" * 60)
```

### Cara Menjalankan

1. **Install dependencies**:

   ```bash
   pip install requests
   ```

2. **Set secret** di baris 128: `SECRET = 'YOUR_SECRET_HERE'`

3. **Jalankan**:

   ```bash
   python3 send_webhook.py
   ```

### Fitur Script Python

- ✅ **Class lengkap** `KKNWebhookSender` dengan semua fungsi
- ✅ **Generate signature** HMAC-SHA256 otomatis
- ✅ **4 contoh penggunaan** (mahasiswa/dosen created/deleted)
- ✅ **Contoh bulk send** dari database (SQLAlchemy)
- ✅ **Helper verify signature** untuk testing
- ✅ **Error handling** dan timeout configuration

---

## 📮 Postman Collection

Berikut adalah **Postman Collection** untuk testing webhook KKN:

### File: `KKN_Webhook.postman_collection.json`

```json
{
    "info": {
        "name": "KKN UIN Saizu - Webhook API",
        "description": "Collection untuk testing webhook KKN UIN Saizu dari sistem kampus",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        "version": "1.0.0"
    },
    "variable": [
        {
            "key": "base_url",
            "value": "https://kkn.uinsaizu.ac.id"
        },
        {
            "key": "webhook_secret",
            "value": "SECRET_DARI_ADMIN_KKN"
        },
        {
            "key": "webhook_url",
            "value": "{{base_url}}/api/webhooks/master-data"
        }
    ],
    "item": [
        {
            "name": "Mahasiswa Created",
            "event": [
                {
                    "listen": "prerequest",
                    "script": {
                        "type": "text/javascript",
                        "exec": [
                            "// Generate timestamp dan signature",
                            "var timestamp = Math.floor(Date.now() / 1000).toString();",
                            "var payload = JSON.stringify(pm.request.body.raw);",
                            "",
                            "// Generate signature: sha256=timestamp.payload",
                            "var crypto = require('crypto-js');",
                            "var signedPayload = timestamp + '.' + payload;",
                            "var signature = 'sha256=' + crypto.HmacSHA256(signedPayload, pm.variables.get('webhook_secret')).toString(crypto.enc.Hex);",
                            "",
                            "// Set headers",
                            "pm.request.headers.add({",
                            "    key: 'X-Hub-Signature',",
                            "    value: signature",
                            "    disabled: false",
                            "});",
                            "",
                            "pm.request.headers.add({",
                            "    key: 'X-Webhook-Timestamp',",
                            "    value: timestamp,",
                            "    disabled: false",
                            "});",
                            "",
                            "console.log('Timestamp:', timestamp);",
                            "console.log('Signature:', signature);"
                        ]
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"event\": \"mahasiswa.created\",\n    \"webhook_id\": \"mhs-123456789-1700000000\",\n    \"data\": {\n        \"payload\": {\n            \"nim\": \"123456789\",\n            \"nama\": \"Ahmad Budi Santoso\",\n            \"email\": \"ahmad@uinsaizu.ac.id\",\n            \"fakultas_id\": \"01\",\n            \"prodi_id\": \"0123\",\n            \"jenis_kelamin\": \"L\",\n            \"tanggal_lahir\": \"2000-05-15\",\n            \"phone\": \"081234567890\",\n            \"alamat\": \"Jl. Raya No. 123\",\n            \"status_aktif\": \"AKTIF\",\n            \"id\": \"mhs-123456789\"\n        }\n    }\n}"
                },
                "options": {
                    "raw": {
                        "language": "json"
                    }
                }
            },
            "url": {
                "raw": "{{webhook_url}}",
                "host": ["{{webhook_url}}"]
            }
        },
        {
            "name": "Dosen Created",
            "event": [
                {
                    "listen": "prerequest",
                    "script": {
                        "type": "text/javascript",
                        "exec": [
                            "var timestamp = Math.floor(Date.now() / 1000).toString();",
                            "var payload = JSON.stringify(pm.request.body.raw);",
                            "",
                            "var crypto = require('crypto-js');",
                            "var signedPayload = timestamp + '.' + payload;",
                            "var signature = 'sha256=' + crypto.HmacSHA256(signedPayload, pm.variables.get('webhook_secret')).toString(crypto.enc.Hex);",
                            "",
                            "pm.request.headers.add({",
                            "    key: 'X-Hub-Signature',",
                            "    value: signature",
                            "});",
                            "",
                            "pm.request.headers.add({",
                            "    key: 'X-Webhook-Timestamp',",
                            "    value: timestamp,",
                            "});"
                        ]
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"event\": \"dosen.created\",\n    \"webhook_id\": \"dsn-198501012010011001-1700000000\",\n    \"data\": {\n        \"payload\": {\n            \"nip\": \"198501012010011001\",\n            \"nama\": \"Dr. H. Ahmad Fauzi, M.Pd\",\n            \"email\": \"fauzi@uinsaizu.ac.id\",\n            \"fakultas_id\": \"01\",\n            \"jenis_kelamin\": \"L\",\n            \"tanggal_lahir\": \"1985-01-01\",\n            \"phone\": \"081234567890\",\n            \"status_pegawai\": \"PNS\",\n            \"status_aktif\": \"AKTIF\",\n            \"id\": \"dsn-198501012010011001\"\n        }\n    }\n}"
                }
            },
            "url": {
                "raw": "{{webhook_url}}",
                "host": ["{{webhook_url}}"]
            }
        },
        {
            "name": "Mahasiswa Deleted",
            "event": [
                {
                    "listen": "prerequest",
                    "script": {
                        "type": "text/javascript",
                        "exec": [
                            "var timestamp = Math.floor(Date.now() / 1000).toString();",
                            "var payload = JSON.stringify(pm.request.body.raw);",
                            "",
                            "var crypto = require('crypto-js');",
                            "var signedPayload = timestamp + '.' + payload;",
                            "var signature = 'sha256=' + crypto.HmacSHA256(signedPayload, pm.variables.get('webhook_secret')).toString(crypto.enc.Hex);",
                            "",
                            "pm.request.headers.add({ key: 'X-Hub-Signature', value: signature });",
                            "pm.request.headers.add({ key: 'X-Webhook-Timestamp', value: timestamp });"
                        ]
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"event\": \"mahasiswa.deleted\",\n    \"webhook_id\": \"mhs-del-1700000000\",\n    \"data\": {\n        \"payload\": {\n            \"nim\": \"123456789\"\n        }\n    }\n}"
                }
            },
            "url": {
                "raw": "{{webhook_url}}",
                "host": ["{{webhook_url}}"]
            }
        }
    ]
}
```

### Cara Menggunakan Postman Collection

1. **Download/Create file** `KKN_Webhook.postman_collection.json`
2. **Import ke Postman**:
   - Buka Postman → Import → Upload file JSON
3. **Set Environment Variables**:
   - `base_url`: URL sistem KKN (default: `https://kkn.uinsaizu.ac.id`)
   - `webhook_secret`: Secret dari `.env` KKN
4. **Test Request**:
   - Pilih request (Mahasiswa Created / Dosen Created / etc)
   - Klik **Send**
   - Signature akan digenerate otomatis di `Pre-request Script`

### Fitur Postman Collection

- ✅ **3 Contoh Request** (Mahasiswa/Dosen Created/Deleted)
- ✅ **Auto-generate HMAC-SHA256** di Pre-request Script
- ✅ **Environment Variables** untuk konfigurasi mudah
- ✅ **Ready to use** - tinggal import dan test

---

## 🎯 Kesimpulan

Tim kampus sekarang memiliki **3 opsi** untuk mengirim webhook:

| Opsi | Bahasa | File | Kelebihan |
|-----|-------|------|------------|
| **PHP** | PHP | `send_webhook.php` | Mudah diintegrasi dengan sistem PHP kampus |
| **Python** | Python | `send_webhook.py` | Modern, mudah untuk bulk send & database integration |
| **Postman** | JSON Collection | `KKN_Webhook.postman_collection.json` | Testing cepat tanpa coding |

Semua file sudah terdokumentasi lengkap di **`docs/KAMPUS_INTEGRATION.md`**! 🎉
