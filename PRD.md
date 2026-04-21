KKN Portal Architecture Hardening
Security, Database Integrity, and Human-Error Mitigation

Sistem: Portal KKN UIN SAIZU
Stack: Laravel 11 + Inertia + React
Dokumen: Technical Architecture Addendum
Tujuan: Memastikan isolasi periode benar-benar aman pada level UI, Backend, API, dan Database

1. Prinsip Utama Arsitektur

Sistem KKN menggunakan pola:

Multi-Tenancy berbasis Periode

Setiap periode KKN diperlakukan sebagai tenant terisolasi yang memiliki:

peserta
kelompok
DPL
rubrik nilai
konfigurasi sertifikat
aktivitas pelaksanaan

Tidak ada entitas yang boleh menyeberang antar periode.

2. Layer Isolasi Sistem

Agar isolasi benar-benar aman, sistem harus memiliki 4 lapisan proteksi.

UI Layer
   ↓
API Middleware Layer
   ↓
Application Service Layer
   ↓
Database Constraint Layer

Jika salah satu layer gagal, layer lain tetap menjaga integritas data.

3. Period Context System (Core Isolation Mechanism)

Semua request sistem harus memiliki Periode Context.

Header Context
X-Periode-ID: 80

Atau melalui session:

session('active_periode')
Middleware Laravel
app/Http/Middleware/EnsurePeriodeContext.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsurePeriodeContext
{
    public function handle(Request $request, Closure $next)
    {
        $periode = $request->header('X-Periode-ID') 
                    ?? session('active_periode');

        if (!$periode) {
            return response()->json([
                'error' => 'Periode context required'
            ], 400);
        }

        app()->instance('current_periode', $periode);

        return $next($request);
    }
}
4. Global Query Scope (Laravel)

Semua model yang memiliki periode_id wajib menggunakan Global Scope.

Scope Class
app/Scopes/PeriodeScope.php
<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class PeriodeScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $periode = app('current_periode');

        $builder->where(
            $model->getTable().'.periode_id',
            $periode
        );
    }
}
Trait Reusable
app/Traits/BelongsToPeriode.php
<?php

namespace App\Traits;

use App\Scopes\PeriodeScope;

trait BelongsToPeriode
{
    protected static function bootBelongsToPeriode()
    {
        static::addGlobalScope(new PeriodeScope);
    }
}
Contoh Implementasi Model
use App\Traits\BelongsToPeriode;

class PesertaKKN extends Model
{
    use BelongsToPeriode;
}
5. Database Design (Production Grade)
Tabel Inti
Periode
periode
------
id
nama_periode
jenis_kkn
tahun
tanggal_mulai
tanggal_selesai
status
created_at
Peserta KKN
peserta_kkn
-----------
id
mahasiswa_id
periode_id
status
kelompok_id
created_at

Index:

INDEX (periode_id)
UNIQUE (mahasiswa_id, periode_id)
Kelompok KKN
kelompok_kkn
------------
id
periode_id
lokasi_id
dpl_id
kapasitas
created_at

Index:

INDEX (periode_id)
UNIQUE (periode_id, lokasi_id)

Ini memastikan:

1 desa = 1 kelompok per periode
Sertifikat KKN
sertifikat_kkn
--------------
id
peserta_id
periode_id
nomor_sertifikat
certificate_hash
file_path
created_at

Index:

UNIQUE (peserta_id, periode_id)
UNIQUE (nomor_sertifikat)
6. Sertifikat Template (Periode Based)

Mengganti tabel lama konfigurasi_sertifikat.

Struktur Baru
sertifikat_templates
--------------------
id
periode_id
background_image
ttd_rektor
nomor_sk
qr_prefix
created_at

Relasi:

periode
  └── sertifikat_template

Index:

UNIQUE (periode_id)
7. Validasi Cross-Period Protection

Semua assignment harus divalidasi.

Contoh Service Plotting
public function assignPesertaToKelompok($peserta, $kelompok)
{
    if ($peserta->periode_id !== $kelompok->periode_id) {

        throw new Exception(
            'Cross period assignment detected'
        );
    }

    $peserta->kelompok_id = $kelompok->id;
    $peserta->save();
}
8. Import Excel Security

Saat melakukan import:

PesertaID
KelompokID

Backend harus mengecek:

peserta.periode_id == kelompok.periode_id

Jika tidak:

reject row
log error
9. Certificate Verification System

Endpoint publik:

/verify/{hash}

Jangan gunakan ID incremental.

Certificate Hash
sha256(
    nim +
    periode_id +
    secret_key
)
Contoh Route
Route::get('/verify/{hash}', function ($hash) {

    $certificate = Sertifikat::where(
        'certificate_hash',
        $hash
    )->firstOrFail();

    return view('verify', compact('certificate'));
});
10. Human Error Protection System
1 Color Coded Period UI

Setiap periode memiliki warna:

Periode 80 → Biru
Periode 81 → Hijau
Internasional → Ungu

Header UI berubah otomatis.

2 Context Lock

Jika fase sudah berubah:

Plotting → Pelaksanaan

Maka:

Pendaftaran = readonly
3 Dangerous Action Confirmation

Contoh finalisasi nilai.

UI meminta admin mengetik:

FINALISASI PERIODE 80
4 Audit Log System
Struktur
audit_logs
----------
id
user_id
action
table_name
record_id
periode_id
old_value
new_value
ip_address
created_at
Contoh Log
Admin A
mengubah nilai peserta
Periode 80
timestamp
11. Race Condition Protection

Saat finalisasi nilai.

Gunakan database transaction.

DB::transaction(function () {

    $nilai = NilaiKKN::lockForUpdate()
        ->where('periode_id', $periode)
        ->get();

    foreach ($nilai as $item) {
        $item->is_finalized = true;
        $item->save();
    }

});
12. Security Threat Model

Ancaman utama sistem KKN biasanya berasal dari:

Threat	Contoh
Human Error	Admin salah periode
Data Leakage	Query tanpa periode
Excel Import	Cross period plotting
Scraping	Certificate verification
Race Condition	Finalisasi nilai
13. Recommended Architecture Diagram
           Browser
              │
              ▼
        React / Inertia
              │
              ▼
     Period Context Middleware
              │
              ▼
        Laravel Controllers
              │
              ▼
        Service Layer
              │
              ▼
     Global Query Scope (Periode)
              │
              ▼
         Database Layer
14. Kesimpulan

Dengan implementasi:

Period Context Middleware
Global Query Scope
Database Constraint
Audit Log
Certificate Hash Verification
Cross-Period Validation

Sistem KKN akan memiliki:

Strong Data Isolation
High Admin Safety
Secure Certificate Verification
Human Error Mitigation

-------

Berikut adalah cetak biru arsitektur lengkap yang telah disesuaikan dengan PRD Portal KKN UIN SAIZU dan standar keamanan Senior Architect. Anda dapat langsung mengadaptasi kode ini ke dalam proyek Laravel & React/Inertia Anda.

1. Schema Database: Struktur "Template-Instance"
Sesuai rekomendasi untuk tabel konfigurasi_sertifikat agar tidak hardcoded dan mendukung isolasi.

PHP
// Database: Migrations

// 1. Tabel Template (Desain Master)
Schema::create('sertifikat_templates', function (Blueprint $table) {
    $table->id();
    $table->string('name'); // Contoh: "Template Reguler 2026"
    $table->string('background_path'); 
    $table->json('coordinates'); // Menyimpan posisi X,Y untuk Nama, NIM, QR, dll.
    $table->timestamps();
});

// 2. Tabel Konfigurasi per Periode (Instance)
Schema::create('konfigurasi_sertifikat', function (Blueprint $table) {
    $table->id();
    $table->foreignId('periode_id')->constrained('periode_kkn')->onDelete('cascade');
    $table->foreignId('template_id')->constrained('sertifikat_templates');
    $table->string('nomor_sk_rektor');
    $table->string('nama_penandatangan');
    $table->string('nip_penandatangan');
    $table->date('tanggal_terbit');
    $table->unique('periode_id'); // Satu periode hanya punya satu config sertifikat aktif
    $table->timestamps();
});

// 3. Tambahan Unique Constraint pada tabel eksisting
Schema::table('peserta_kkn', function (Blueprint $table) {
    $table->unique(['mahasiswa_id', 'periode_id'], 'prevent_double_kkn');
});

Schema::table('kelompok_kkn', function (Blueprint $table) {
    $table->unique(['lokasi_id', 'periode_id'], 'one_village_one_group');
});
2. Backend: Global Scope untuk Isolasi Otomatis
Untuk mencegah celah IDOR, gunakan Global Scope agar setiap query Eloquent otomatis terfilter berdasarkan periode_id yang sedang aktif di session.

PHP
namespace App\Models\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Session;

trait HasPeriodeIsolation
{
    protected static function bootHasPeriodeIsolation()
    {
        static::addGlobalScope('periode_isolation', function (Builder $builder) {
            if (Session::has('active_periode_id')) {
                $builder->where('periode_id', Session::get('active_periode_id'));
            }
        });

        static::creating(function ($model) {
            if (Session::has('active_periode_id') && !isset($model->periode_id)) {
                $model->periode_id = Session::get('active_periode_id');
            }
        });
    }
}

// Cara Pakai di Model:
// class PesertaKkn extends Model { use HasPeriodeIsolation; }
3. Logic: Data Snapping (Fase ④ - Plotting)
Mencegah perubahan data di masa depan (misal nama Desa berubah) merusak histori data yang sudah berjalan.

PHP
public function plotMahasiswa(Request $request)
{
    $peserta = PesertaKkn::findOrFail($request->peserta_id);
    $kelompok = KelompokKkn::with('lokasi')->findOrFail($request->kelompok_id);

    // Snapping: Mengunci data master ke dalam record transaksi
    $peserta->update([
        'kelompok_id' => $kelompok->id,
        'snap_nama_desa' => $kelompok->lokasi->nama_desa,
        'snap_kecamatan' => $kelompok->lokasi->kecamatan,
        'plotted_at' => now(),
    ]);
    
    return back()->with('success', 'Mahasiswa berhasil di-plot ke ' . $kelompok->lokasi->nama_desa);
}
4. Frontend (React/Inertia): Visual Differentiation
Gunakan warna tema yang berbeda untuk tiap jenis KKN guna meminimalisir human error oleh Admin/DPL.

JavaScript
// Layout/AuthenticatedLayout.jsx
import { usePage } from '@inertiajs/react';

const AuthenticatedLayout = ({ children }) => {
    const { active_periode } = usePage().props;

    // Mapping warna berdasarkan jenis KKN
    const themeColors = {
        'Reguler': 'bg-indigo-700',
        'Internasional': 'bg-purple-800',
        'Nusantara': 'bg-emerald-700',
        'Default': 'bg-slate-800'
    };

    const currentTheme = themeColors[active_periode?.jenis] || themeColors.Default;

    return (
        <div className="min-h-screen flex">
            {/* Sidebar dengan warna dinamis */}
            <aside className={`w-64 text-white transition-colors duration-500 ${currentTheme}`}>
                <div className="p-4 font-bold border-b border-white/10">
                    Portal KKN UIN SAIZU
                </div>
                {/* Context Switcher Wajib */}
                <div className="p-4">
                    <label className="text-xs opacity-70">Periode Aktif:</label>
                    <select 
                        value={active_periode?.id} 
                        className="w-full bg-white/10 border-none rounded text-sm mt-1"
                        onChange={(e) => switchPeriode(e.target.value)}
                    >
                        {/* Options... */}
                    </select>
                </div>
                <nav>...</nav>
            </aside>

            <main className="flex-1 bg-gray-50">
                {children}
            </main>
        </div>
    );
};
5. Mitigasi Human Error: State-Based Locking
Tambahkan Middleware untuk memastikan Admin tidak bisa melakukan input pada periode yang sudah berstatus "Selesai" atau "Sertifikasi".

PHP
// App/Http/Middleware/CheckPeriodePhase.php
public function handle($request, Closure $next, $allowedPhases)
{
    $periode = PeriodeKkn::find(Session::get('active_periode_id'));
    
    // Contoh: Jika halaman Pendaftaran diakses tapi periode sudah masuk Fase Plotting
    if (!in_array($periode->current_phase, explode('|', $allowedPhases))) {
        return redirect()->route('dashboard')
            ->with('error', 'Aksi tidak diizinkan pada fase ' . $periode->current_phase);
    }

    return $next($request);
}

// Route Definition
Route::post('/pendaftaran/approve', [PendaftaranController::class, 'bulkApprove'])
    ->middleware('checkPhase:Pendaftaran|Verifikasi');
Rekomendasi Tambahan:
Audit Trail: Pasang paket seperti spatie/laravel-activitylog untuk mencatat siapa yang melakukan "Context Switch" dan "Bulk Action", terutama pada Fase ③ (Verifikasi) dan Fase ⑥ (Penilaian).

UUID: Pertimbangkan mengubah Primary Key periode_id menjadi UUID untuk mencegah manipulasi URL oleh user iseng.

-------

# Architectural Review — Portal KKN UIN SAIZU
## Isolasi Konteks per Periode (Multi-Tenancy Based on Period)
**Reviewer:** Senior Software Architect  
**Versi PRD yang Direview:** 3.0 — Final Komprehensif  
**Tanggal Review:** April 2026  
**Stack:** Laravel + React/Inertia.js

---

## Kesimpulan Eksekutif

Konsep **"Kamar per Periode"** yang diterapkan dalam PRD ini adalah pendekatan arsitektur yang solid dan tepat untuk skala sistem ini. Isolasi berbasis `periode_id` sudah menjawab kebutuhan utama: mencegah kebocoran data antar angkatan KKN. Namun, *defense in depth* masih perlu diperkuat — saat ini isolasi terlalu mengandalkan satu layer (UI/service), padahal database dan middleware juga harus berpartisipasi aktif sebagai penjaga.

---

## 1. Celah Keamanan (Security Loopholes)

### 🔴 P1 — Race Condition pada Overlap Protection

**Lokasi di PRD:** Fase ② — Pendaftaran Mahasiswa (Overlap Protection)

**Problem:**  
PRD menyebut *"Mahasiswa aktif di Kamar A tidak bisa mendaftar di Kamar B."* Pengecekan ini kemungkinan dilakukan di level service/controller. Jika dua request registrasi dikirim hampir bersamaan (misal double-submit dari koneksi lambat), keduanya bisa lolos pengecekan sebelum salah satu di-commit ke database, menghasilkan 2 record aktif untuk mahasiswa yang sama.

**Solusi — Partial Unique Index di Database:**

```sql
-- PostgreSQL / MySQL 8+
-- Hanya boleh ada 1 record aktif per mahasiswa di seluruh sistem
CREATE UNIQUE INDEX idx_mahasiswa_aktif_unik
  ON peserta_kkn (mahasiswa_id)
  WHERE status IN ('pending', 'document_submitted', 'approved');
```

```php
// Laravel Migration equivalent
Schema::table('peserta_kkn', function (Blueprint $table) {
    // Tambahkan partial index via raw statement
});

DB::statement("
    CREATE UNIQUE INDEX idx_mahasiswa_aktif_unik
    ON peserta_kkn (mahasiswa_id)
    WHERE status IN ('pending', 'document_submitted', 'approved')
");
```

Database akan otomatis menolak insert ke-2 di level storage engine, tanpa perlu cek di aplikasi.

---

### 🔴 P1 — Isolasi Hanya di Layer Aplikasi, Tidak di Database

**Lokasi di PRD:** Fase ④ — Cross-Plotting Protection

**Problem:**  
PRD menyatakan backend "menolak proses assign jika `peserta_kkn.periode_id ≠ kelompok_kkn.periode_id`." Namun jika validasi ini hanya ada di service layer PHP, exploit tetap mungkin terjadi melalui:
- Manipulasi payload API secara langsung (bypass UI)
- Bug di fitur import Excel yang tidak memvalidasi setiap baris secara ketat
- Query yang salah ditulis oleh developer di masa mendatang

**Solusi — CHECK Constraint di Database:**

```sql
-- Tabel pivot antara peserta dan kelompok
-- Pastikan periode_id selalu konsisten
ALTER TABLE peserta_kelompok_kkn
  ADD CONSTRAINT chk_periode_konsisten
  CHECK (
    (SELECT periode_id FROM peserta_kkn WHERE id = peserta_id)
    =
    (SELECT periode_id FROM kelompok_kkn WHERE id = kelompok_id)
  );
```

> **Catatan:** MySQL tidak mendukung subquery dalam CHECK constraint. Sebagai alternatif di MySQL, gunakan TRIGGER:

```sql
DELIMITER $$

CREATE TRIGGER trg_cross_plotting_protection
BEFORE INSERT ON peserta_kelompok_kkn
FOR EACH ROW
BEGIN
  DECLARE peserta_periode BIGINT;
  DECLARE kelompok_periode BIGINT;

  SELECT periode_id INTO peserta_periode
    FROM peserta_kkn WHERE id = NEW.peserta_id;
  SELECT periode_id INTO kelompok_periode
    FROM kelompok_kkn WHERE id = NEW.kelompok_id;

  IF peserta_periode != kelompok_periode THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cross-plotting dilarang: periode_id tidak cocok';
  END IF;
END$$

DELIMITER ;
```

---

### 🔴 P1 — Isolasi Lemah di Tabel `nilai_kkn`

**Lokasi di PRD:** Tabel Audit, Kolom "Nilai/Grading" — Status 🔗

**Problem:**  
PRD mengakui `nilai_kkn` diisolasi *"via hierarki `kelompok_id`"* — artinya setiap query ke tabel ini **harus** selalu di-JOIN ke `kelompok_kkn` untuk mendapatkan `periode_id`. Jika ada satu query yang lupa JOIN, data bisa terbaca lintas periode tanpa peringatan apapun.

**Solusi — Tambah Kolom `periode_id` Redundan dengan Global Scope:**

```sql
ALTER TABLE nilai_kkn
  ADD COLUMN periode_id BIGINT UNSIGNED NOT NULL
  AFTER kelompok_id;

ALTER TABLE nilai_kkn
  ADD CONSTRAINT fk_nilai_periode
  FOREIGN KEY (periode_id) REFERENCES periode_kkn(id);

-- Index untuk performa
CREATE INDEX idx_nilai_periode ON nilai_kkn (periode_id);
```

```php
// app/Models/NilaiKkn.php
// Global Scope agar semua query otomatis terisolasi per periode aktif

protected static function booted(): void
{
    static::addGlobalScope('isolasi_periode', function (Builder $builder) {
        $periodeId = session('active_periode_id')
            ?? request()->route('periode_id');

        if ($periodeId) {
            $builder->where('nilai_kkn.periode_id', $periodeId);
        }
    });

    // Pastikan periode_id selalu diisi otomatis saat create
    static::creating(function (NilaiKkn $model) {
        if (empty($model->periode_id)) {
            $model->periode_id = session('active_periode_id');
        }
    });
}
```

---

### 🟡 P2 — Tidak Ada Mekanisme Phase Locking

**Lokasi di PRD:** Siklus Hidup KKN (7 Fase)

**Problem:**  
PRD mendefinisikan 7 fase secara linear, tetapi tidak ada guard yang mencegah Admin mundur ke fase sebelumnya secara tidak sengaja, misalnya mengubah data plotting (Fase ④) setelah logbook pelaksanaan (Fase ⑤) sudah berjalan.

**Solusi — Kolom `current_phase` di Tabel `periode_kkn`:**

```sql
ALTER TABLE periode_kkn
  ADD COLUMN current_phase TINYINT UNSIGNED NOT NULL DEFAULT 1
  COMMENT '1=Pemetaan 2=Pendaftaran 3=Verifikasi 4=Plotting 5=Pelaksanaan 6=Penilaian 7=Sertifikasi';

ALTER TABLE periode_kkn
  ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE
  COMMENT 'TRUE setelah sertifikat selesai digenerate';
```

```php
// app/Enums/PeriodePhase.php
enum PeriodePhase: int
{
    case PEMETAAN     = 1;
    case PENDAFTARAN  = 2;
    case VERIFIKASI   = 3;
    case PLOTTING     = 4;
    case PELAKSANAAN  = 5;
    case PENILAIAN    = 6;
    case SERTIFIKASI  = 7;
}

// app/Http/Middleware/ValidatePeriodePhase.php
public function handle(Request $request, Closure $next, int $maxPhase): Response
{
    $periode = Periode::findOrFail(session('active_periode_id'));

    if ($periode->current_phase > $maxPhase) {
        abort(403, "Fase ini sudah ditutup. Periode berada di fase {$periode->current_phase}.");
    }

    if ($periode->is_locked) {
        abort(403, 'Periode ini sudah dikunci. Tidak ada perubahan yang diizinkan.');
    }

    return $next($request);
}

// routes/web.php — contoh penggunaan
Route::post('/admin/plotting/assign', [PlottingController::class, 'assign'])
    ->middleware('validate.phase:4');

Route::post('/admin/nilai/finalisasi', [NilaiController::class, 'finalisasi'])
    ->middleware('validate.phase:6');
```

---

### 🟡 P2 — QR Code Verifikasi Publik Berpotensi Expose PII

**Lokasi di PRD:** Fase ⑦ — Verifikasi Publik

**Problem:**  
PRD menyebut "Scan QR Code menampilkan metadata mahasiswa lengkap." Tanpa pembatasan, endpoint publik ini bisa mengekspos data sensitif (NIM lengkap, nilai akhir, nomor HP) kepada siapa saja yang memiliki akses ke QR Code tersebut.

**Solusi — Batasi Data di Endpoint Publik:**

```php
// app/Http/Controllers/Public/SertifikatVerifikasiController.php
public function show(string $kode): JsonResponse
{
    $sertifikat = SertifikatKkn::where('kode_verifikasi', $kode)
        ->with(['peserta.mahasiswa', 'periode'])
        ->firstOrFail();

    // Hanya expose data minimal yang diperlukan untuk verifikasi
    return response()->json([
        'valid'           => true,
        'nama_mahasiswa'  => $sertifikat->peserta->mahasiswa->nama,
        'program_studi'   => $sertifikat->peserta->mahasiswa->program_studi,
        'nama_periode'    => $sertifikat->periode->nama,
        'jenis_kkn'       => $sertifikat->periode->jenis,
        'nomor_sertifikat'=> $sertifikat->nomor_sertifikat,
        'tanggal_terbit'  => $sertifikat->created_at->format('d F Y'),
        'status'          => 'LULUS',
        // ❌ Jangan expose: nim lengkap, nilai akhir, nomor hp, email
    ]);
}
```

---

## 2. Database Design: Partisi `konfigurasi_sertifikat`

### Perbandingan Opsi

| Opsi | Pendekatan | Rekomendasi |
|------|-----------|:-----------:|
| A — Inheritance Pattern (NULL = Global) | Tambah `periode_id NULLABLE` ke tabel existing | ✅ **Terbaik** |
| B — Kolom JSON di `periode_kkn` | `sertifikat_config JSON` di tabel periode | ⚠️ Tidak disarankan |
| C — Tabel Terpisah | `konfigurasi_sertifikat_periode` baru | ⚠️ Overkill |

---

### ✅ Opsi A — Configuration Inheritance Pattern (Direkomendasikan)

**Konsep:** Baris dengan `periode_id = NULL` adalah konfigurasi global (default). Baris dengan `periode_id = 80` adalah override khusus Periode 80. Admin hanya perlu mengisi konfigurasi yang *berbeda* dari default — tidak perlu mengulang semua konfigurasi setiap periode baru.

```sql
-- Migrasi
ALTER TABLE konfigurasi_sertifikat
  ADD COLUMN periode_id BIGINT UNSIGNED NULL DEFAULT NULL
  AFTER id;

ALTER TABLE konfigurasi_sertifikat
  ADD UNIQUE KEY uq_config_key_periode (config_key, periode_id),
  ADD CONSTRAINT fk_config_periode
    FOREIGN KEY (periode_id) REFERENCES periode_kkn(id) ON DELETE CASCADE;

-- Data contoh setelah migrasi
-- Konfigurasi global (default untuk semua periode)
INSERT INTO konfigurasi_sertifikat (config_key, config_value, periode_id) VALUES
  ('ttd_nama',          'Dr. H. Ahmad Muttaqin, M.Ag.',  NULL),
  ('ttd_jabatan',       'Kepala LPPM',                   NULL),
  ('background_image',  'sertifikat_default.png',        NULL);

-- Override khusus untuk Periode Internasional (id=82)
INSERT INTO konfigurasi_sertifikat (config_key, config_value, periode_id) VALUES
  ('background_image',  'sertifikat_internasional.png',  82),
  ('nomor_sk_rektor',   'SK-2026-INT-001',               82);
```

**Service Layer — Resolusi dengan Prioritas:**

```php
// app/Services/KonfigurasiSertifikatService.php

class KonfigurasiSertifikatService
{
    /**
     * Ambil nilai konfigurasi dengan fallback:
     * Prioritas 1: konfigurasi spesifik periode
     * Prioritas 2: konfigurasi global (periode_id = NULL)
     */
    public function get(string $key, int $periodeId): ?string
    {
        $configs = KonfigurasiSertifikat::where('config_key', $key)
            ->where(function (Builder $query) use ($periodeId) {
                $query->where('periode_id', $periodeId)
                      ->orWhereNull('periode_id');
            })
            ->orderByRaw('CASE WHEN periode_id IS NULL THEN 1 ELSE 0 END ASC')
            // Periode-spesifik (0) lebih prioritas dari global (1)
            ->first();

        return $configs?->config_value;
    }

    /**
     * Set konfigurasi untuk periode tertentu (upsert)
     */
    public function setForPeriode(string $key, string $value, int $periodeId): void
    {
        KonfigurasiSertifikat::updateOrCreate(
            ['config_key' => $key, 'periode_id' => $periodeId],
            ['config_value' => $value]
        );
    }

    /**
     * Set konfigurasi global
     */
    public function setGlobal(string $key, string $value): void
    {
        KonfigurasiSertifikat::updateOrCreate(
            ['config_key' => $key, 'periode_id' => null],
            ['config_value' => $value]
        );
    }

    /**
     * Ambil semua konfigurasi untuk satu periode (merged dengan global)
     */
    public function getAllForPeriode(int $periodeId): array
    {
        $globals = KonfigurasiSertifikat::whereNull('periode_id')
            ->pluck('config_value', 'config_key')
            ->toArray();

        $periodeSpecific = KonfigurasiSertifikat::where('periode_id', $periodeId)
            ->pluck('config_value', 'config_key')
            ->toArray();

        // Override global dengan yang spesifik periode
        return array_merge($globals, $periodeSpecific);
    }
}
```

**Contoh penggunaan:**

```php
// Dalam SertifikatController
$config = app(KonfigurasiSertifikatService::class)
    ->getAllForPeriode($periode->id);

$pdf = PDF::loadView('sertifikat.template', [
    'ttd_nama'         => $config['ttd_nama'],
    'ttd_jabatan'      => $config['ttd_jabatan'],
    'background_image' => $config['background_image'],
    'nomor_sk_rektor'  => $config['nomor_sk_rektor'],
]);
```

---

### ⚠️ Mengapa Opsi B (JSON) Tidak Disarankan

```php
// ❌ Hindari ini
$periode->sertifikat_config = [
    'ttd_nama'    => 'Dr. Ahmad',
    'background'  => 'image.png',
];

// Masalah:
// 1. Tidak bisa di-query per key: WHERE sertifikat_config->ttd_nama = ?  (lambat tanpa index khusus)
// 2. Tidak ada foreign key validation
// 3. Typo di key tidak terdeteksi sampai runtime
// 4. Sulit di-inherit dari konfigurasi global
```

---

## 3. Mitigasi Human-Error Selain Context Switcher

### 🛡️ A — Audit Trail Wajib dengan `spatie/laravel-activitylog`

Setiap aksi sensitif harus meninggalkan jejak yang dapat diinvestigasi.

```bash
composer require spatie/laravel-activitylog
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider"
php artisan migrate
```

```php
// app/Traits/LogsKknActivity.php
trait LogsKknActivity
{
    protected function logKknAction(
        string $event,
        Model $subject,
        array $properties = []
    ): void {
        activity($event)
            ->causedBy(auth()->user())
            ->performedOn($subject)
            ->withProperties(array_merge([
                'periode_id'   => session('active_periode_id'),
                'periode_nama' => session('active_periode_nama'),
                'ip_address'   => request()->ip(),
                'user_agent'   => request()->userAgent(),
            ], $properties))
            ->log($event);
    }
}

// Contoh penggunaan di Controller
class PlottingController extends Controller
{
    use LogsKknActivity;

    public function assign(AssignPlottingRequest $request): RedirectResponse
    {
        $peserta  = PesertaKkn::findOrFail($request->peserta_id);
        $kelompok = KelompokKkn::findOrFail($request->kelompok_id);

        // ... logika assign ...

        $this->logKknAction('plotting.assign', $peserta, [
            'kelompok_id'   => $kelompok->id,
            'kelompok_nama' => $kelompok->nama,
        ]);

        return redirect()->back()->with('success', 'Berhasil di-plot.');
    }
}
```

**Event yang Wajib Dilog:**

| Event Key | Trigger |
|-----------|---------|
| `pendaftaran.approve` | Admin menyetujui pendaftar |
| `pendaftaran.reject` | Admin menolak pendaftar |
| `plotting.assign` | Mahasiswa di-assign ke kelompok |
| `plotting.assign_dpl` | DPL di-tugaskan ke kelompok |
| `nilai.finalisasi` | Admin LPPM memfinalisasi nilai |
| `sertifikat.generate` | Sertifikat di-generate |
| `periode.phase_advance` | Admin memajukan fase periode |
| `periode.lock` | Periode dikunci |

---

### 🛡️ B — Konfirmasi Dua Langkah untuk Aksi Destruktif (React Component)

```tsx
// resources/js/Components/ConfirmPeriodeAction.tsx

interface Props {
    periodeNama: string;
    actionLabel: string;
    affectedCount: number;
    onConfirm: () => void;
    irreversible?: boolean;
}

export default function ConfirmPeriodeAction({
    periodeNama,
    actionLabel,
    affectedCount,
    onConfirm,
    irreversible = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [typed, setTyped]   = useState('');
    const CONFIRMATION_WORD   = 'KONFIRMASI';

    return (
        <>
            <Button variant="destructive" onClick={() => setOpen(true)}>
                {actionLabel}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">
                            ⚠️ Konfirmasi {actionLabel}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Tampilkan konteks periode secara eksplisit */}
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                            <p className="text-sm font-medium text-amber-800">
                                Periode Aktif:
                            </p>
                            <p className="text-lg font-bold text-amber-900">
                                {periodeNama}
                            </p>
                        </div>

                        <p className="text-sm text-gray-700">
                            Anda akan melakukan{' '}
                            <strong>{actionLabel}</strong> untuk{' '}
                            <strong>{affectedCount} mahasiswa</strong>.
                            {irreversible && (
                                <span className="text-red-600">
                                    {' '}Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                                </span>
                            )}
                        </p>

                        {irreversible && (
                            <div>
                                <label className="text-sm text-gray-600">
                                    Ketik <strong>{CONFIRMATION_WORD}</strong> untuk melanjutkan:
                                </label>
                                <Input
                                    value={typed}
                                    onChange={(e) => setTyped(e.target.value)}
                                    placeholder={CONFIRMATION_WORD}
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={irreversible && typed !== CONFIRMATION_WORD}
                        >
                            Ya, {actionLabel}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Contoh penggunaan
<ConfirmPeriodeAction
    periodeNama="KKN Reguler — Periode 80 (2026)"
    actionLabel="Finalisasi Nilai"
    affectedCount={127}
    irreversible={true}
    onConfirm={handleFinalisasi}
/>
```

---

### 🛡️ C — Persistent Period Banner di Semua Halaman Admin

Context Switcher saja tidak cukup karena bisa diabaikan. Banner permanen memaksa admin selalu sadar konteks kamar mana yang sedang aktif.

```php
// app/Http/Middleware/ShareActivePeriode.php
// Inject shared prop ke semua halaman Inertia

public function handle(Request $request, Closure $next): Response
{
    $periodeId = session('active_periode_id');

    if ($periodeId) {
        $periode = Periode::find($periodeId);
        Inertia::share('activePeriode', $periode ? [
            'id'     => $periode->id,
            'nama'   => $periode->nama,
            'jenis'  => $periode->jenis,
            'phase'  => $periode->current_phase,
            'locked' => $periode->is_locked,
        ] : null);
    } else {
        Inertia::share('activePeriode', null);
    }

    return $next($request);
}
```

```tsx
// resources/js/Layouts/AdminLayout.tsx
// Banner warna berbeda per jenis KKN

const PERIODE_COLORS: Record<string, string> = {
    'Reguler'       : 'bg-blue-600',
    'Internasional' : 'bg-purple-600',
    'Nusantara'     : 'bg-emerald-600',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { activePeriode } = usePage<SharedProps>().props;

    return (
        <div className="min-h-screen">
            {/* Persistent Banner */}
            {activePeriode ? (
                <div className={`${PERIODE_COLORS[activePeriode.jenis] ?? 'bg-gray-600'} text-white px-4 py-2`}>
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium opacity-75 uppercase tracking-wider">
                                Konteks Aktif
                            </span>
                            <span className="font-bold text-sm">
                                {activePeriode.jenis} — {activePeriode.nama}
                            </span>
                            {activePeriode.locked && (
                                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                                    🔒 Terkunci
                                </span>
                            )}
                        </div>
                        <span className="text-xs opacity-75">
                            Fase {activePeriode.phase}/7
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium">
                    ⚠️ Belum ada periode aktif yang dipilih. Pilih periode terlebih dahulu.
                </div>
            )}

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
```

---

### 🛡️ D — Middleware Blokir Akses Tanpa Periode (Server-Side Guard)

Jangan hanya andalkan tampilan UI — middleware wajib memblokir request ke endpoint sensitif jika periode belum dipilih.

```php
// app/Http/Middleware/RequireActivePeriode.php

class RequireActivePeriode
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!session()->has('active_periode_id')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Periode aktif belum dipilih.',
                    'code'    => 'PERIODE_NOT_SELECTED',
                ], 422);
            }

            return redirect()
                ->route('admin.periode.pilih')
                ->with('warning', 'Pilih periode aktif terlebih dahulu sebelum melanjutkan.');
        }

        return $next($request);
    }
}

// bootstrap/app.php — Registrasi alias middleware
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'require.periode' => RequireActivePeriode::class,
        'validate.phase'  => ValidatePeriodePhase::class,
    ]);
})

// routes/web.php — Terapkan ke semua route sensitif admin
Route::middleware(['auth', 'require.periode'])->prefix('admin')->group(function () {
    Route::resource('pendaftaran', PendaftaranController::class);
    Route::resource('kelompok',    KelompokController::class);
    Route::resource('plotting',    PlottingController::class);
    Route::resource('nilai',       NilaiController::class);
    Route::resource('sertifikat',  SertifikatController::class);
});
```

---

### 🛡️ E — Read-Only Lock untuk Periode yang Sudah Selesai

Setelah sertifikat di-generate (Fase ⑦ selesai), seluruh data periode harus dibekukan. Mencegah perubahan data historis secara tidak sengaja.

```php
// app/Http/Middleware/RejectWriteOnLockedPeriode.php

class RejectWriteOnLockedPeriode
{
    private const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->method(), self::WRITE_METHODS)) {
            return $next($request);
        }

        $periodeId = session('active_periode_id');
        $periode   = Periode::find($periodeId);

        if ($periode?->is_locked) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => "Periode '{$periode->nama}' sudah dikunci dan bersifat read-only.",
                    'code'    => 'PERIODE_LOCKED',
                ], 403);
            }

            return back()->with('error',
                "Periode '{$periode->nama}' sudah selesai dan tidak dapat diubah."
            );
        }

        return $next($request);
    }
}
```

```php
// app/Services/PeriodeService.php — Fungsi untuk lock periode

public function lockPeriode(int $periodeId): void
{
    $periode = Periode::findOrFail($periodeId);

    // Validasi semua sertifikat sudah digenerate
    $belumSertifikat = PesertaKkn::where('periode_id', $periodeId)
        ->where('status', 'approved')
        ->whereDoesntHave('sertifikat')
        ->count();

    if ($belumSertifikat > 0) {
        throw new \RuntimeException(
            "{$belumSertifikat} mahasiswa belum memiliki sertifikat. Tidak bisa dikunci."
        );
    }

    $periode->update([
        'is_locked'     => true,
        'locked_at'     => now(),
        'locked_by'     => auth()->id(),
        'current_phase' => 7,
    ]);

    activity('periode.lock')
        ->causedBy(auth()->user())
        ->performedOn($periode)
        ->log('Periode dikunci');
}
```

---

## 4. Global Scope Template untuk Semua Model

Terapkan pola ini secara konsisten ke semua model yang memiliki `periode_id` langsung:

```php
// app/Traits/ScopedByPeriode.php

trait ScopedByPeriode
{
    protected static function bootScopedByPeriode(): void
    {
        static::addGlobalScope('isolasi_periode', function (Builder $builder) {
            $periodeId = session('active_periode_id')
                ?? request()->route('periode_id');

            if ($periodeId) {
                $table = (new static)->getTable();
                $builder->where("{$table}.periode_id", $periodeId);
            }
        });

        static::creating(function (Model $model) {
            if (empty($model->periode_id)) {
                $model->periode_id = session('active_periode_id');
            }
        });
    }
}

// Terapkan ke semua model yang relevan:
// app/Models/PesertaKkn.php
class PesertaKkn extends Model
{
    use ScopedByPeriode;
    // ...
}

// app/Models/KelompokKkn.php
class KelompokKkn extends Model
{
    use ScopedByPeriode;
    // ...
}

// app/Models/NilaiKkn.php
class NilaiKkn extends Model
{
    use ScopedByPeriode;
    // ...
}

// app/Models/SertifikatKkn.php
class SertifikatKkn extends Model
{
    use ScopedByPeriode;
    // ...
}
```

> **Penting:** Saat perlu mengakses data lintas periode (misal untuk laporan rekap), gunakan `withoutGlobalScope('isolasi_periode')`:
>
> ```php
> $semuaNilai = NilaiKkn::withoutGlobalScope('isolasi_periode')
>     ->whereIn('periode_id', [80, 81, 82])
>     ->get();
> ```

---

## 5. Ringkasan Prioritas Tindakan

| Prioritas | Kategori | Item | Dampak Risiko |
|:---------:|----------|------|:-------------:|
| 🔴 P1 | Database | Partial unique index untuk Overlap Protection | Data Corruption |
| 🔴 P1 | Database | TRIGGER cross-plotting validation | Data Bocor |
| 🔴 P1 | Database + Model | Tambah `periode_id` ke `nilai_kkn` + Global Scope | Isolasi Lemah |
| 🔴 P1 | Model | Trait `ScopedByPeriode` di semua model | Isolasi Lemah |
| 🟡 P2 | Database | Migrasi `konfigurasi_sertifikat` → Opsi A | Inkonsistensi Template |
| 🟡 P2 | Backend | Phase Locking (`current_phase` + `is_locked`) | Data Integrity |
| 🟡 P2 | Backend | Middleware `RequireActivePeriode` | Human Error |
| 🟡 P2 | Backend | Middleware `RejectWriteOnLockedPeriode` | Data Historis Rusak |
| 🟡 P2 | Backend | QR Code publik — batasi field yang diekspos | Privacy / PII |
| 🟢 P3 | Backend | Audit Trail dengan `spatie/laravel-activitylog` | Observability |
| 🟢 P3 | Frontend | Persistent period banner di `AdminLayout` | Human Error |
| 🟢 P3 | Frontend | Dialog konfirmasi dua langkah untuk aksi destruktif | Human Error |

---

## 6. Checklist Implementasi

### Database Layer
- [ ] Tambah partial unique index `idx_mahasiswa_aktif_unik` di `peserta_kkn`
- [ ] Tambah TRIGGER `trg_cross_plotting_protection` di `peserta_kelompok_kkn`
- [ ] Migrasi `nilai_kkn`: tambah kolom `periode_id`
- [ ] Migrasi `konfigurasi_sertifikat`: tambah kolom `periode_id NULLABLE`
- [ ] Migrasi `periode_kkn`: tambah kolom `current_phase`, `is_locked`, `locked_at`, `locked_by`

### Backend Layer (Laravel)
- [ ] Buat trait `ScopedByPeriode` dan terapkan ke semua model relevan
- [ ] Buat `KonfigurasiSertifikatService` dengan inheritance pattern
- [ ] Buat middleware `RequireActivePeriode`
- [ ] Buat middleware `ValidatePeriodePhase`
- [ ] Buat middleware `RejectWriteOnLockedPeriode`
- [ ] Buat middleware `ShareActivePeriode` untuk Inertia shared props
- [ ] Install dan konfigurasi `spatie/laravel-activitylog`
- [ ] Batasi field di endpoint publik QR Code verifikasi

### Frontend Layer (React/Inertia)
- [ ] Tambah persistent period banner di `AdminLayout`
- [ ] Buat komponen `ConfirmPeriodeAction` untuk aksi destruktif
- [ ] Terapkan `ConfirmPeriodeAction` di: Finalisasi Nilai, Sahkan Pendaftaran Masal, Generate Sertifikat, Lock Periode
- [ ] Tampilkan badge warning kelompok tanpa Kordes di `/admin/kelompok`
- [ ] Context Switcher untuk DPL multi-periode di Dashboard DPL

---

*Review ini disusun berdasarkan PRD v3.0 Final Komprehensif Portal KKN UIN SAIZU.*  
*Semua kode bersifat referensi arsitektur dan perlu disesuaikan dengan struktur proyek aktual.*

-----

erikut adalah dokumen PRD lengkap yang telah diperbarui dengan hasil review arsitektur, celah keamanan, rekomendasi database, serta mitigasi human-error. Dokumen ini siap disalin (copy-paste) langsung ke file PRD.md atau alat dokumentasi lainnya.

markdown
# Product Requirements Document (PRD)
## Siklus Hidup KKN End-to-End: Isolasi Data per Periode ("Kamar Masing-Masing")

**Sistem:** Portal KKN UIN SAIZU  
**Versi:** 3.1 — Final Komprehensif + Arsitektur Review  
**Status:** Perencanaan & Implementasi

---

## 1. Filosofi Inti

Sistem KKN UIN SAIZU melayani berbagai jenis program KKN (Reguler, Internasional, Nusantara) yang berjalan pada periode (waktu) yang berbeda-beda. Untuk mencegah kebocoran data, salah plotting, dan kesalahan *grading*, diterapkan konsep **Isolasi Konteks (Multi-Tenancy per Periode)**.

> Setiap operasi KKN — mulai dari **Pendaftaran** hingga **Sertifikat** — terikat dan terisolasi pada satu **"Kamar" (Periode)**. Tidak ada entitas data yang boleh melintasi batas kamar.

**Ilustrasi Kamar:**
- Kamar A = KKN Reguler Periode 80
- Kamar B = KKN Reguler Periode 81
- Kamar C = KKN Internasional Periode 82

Masing-masing kamar ini beroperasi secara independen dengan **pendaftar sendiri**, **kelompok sendiri**, **DPL sendiri**, **rubrik nilai sendiri**, dan **sertifikat sendiri**.

---

## 2. Siklus Hidup KKN (7 Fase)

Seluruh aktivitas operasional dipetakan dalam 7 fase yang berjalan linear secara *isolated* per kamar:

```text
┌───────────────────────────────────────────────────────────┐
│                    KAMAR: PERIODE X                       │
│                                                           │
│  ① Pemetaan    → Admin input desa, auto-generate kelompok │
│  ② Pendaftaran → Mahasiswa daftar & upload berkas         │
│  ③ Verifikasi  → Admin approve / reject pendaftar         │
│  ④ Plotting    → Admin tugaskan mhs ke kelompok + DPL     │
│  ⑤ Pelaksanaan → Logbook harian, proker, absensi          │
│  ⑥ Penilaian   → DPL & Desa beri nilai, Admin finalisasi  │
│  ⑦ Sertifikasi → Sertifikat di-generate per kamar         │
│                                                           │
│  Semua data di atas EKSKLUSIF milik Periode X.            │
│  Tidak bisa diakses/dicampur oleh Periode Y.              │
└───────────────────────────────────────────────────────────┘
3. Spesifikasi Fungsional per Fase
Fase ① — Pemetaan Wilayah & Pembentukan Kelompok
Aturan/Kondisi	Keterangan Operasional
1 Desa = 1 Kelompok	Saat Admin memasukkan desa ke dalam kamar tertentu melalui fitur "Sinkronisasi Wilayah", sistem otomatis men-generate tepat 1 kelompok untuk 1 desa. Pendekatan bottom-up ini mencegah admin membuat grup ganda secara manual.
Lokasi = Master Data	Daftar desa bersifat katalog umum (bisa di-reuse antar periode), namun kelompok yang lahir dari desa tersebut eksklusif milik 1 kamar (kelompok_kkn.periode_id).
Pencegahan Duplikasi	Di dalam 1 kamar, sistem menolak pembuatan 2 kelompok yang ditugaskan ke desa yang sama.
Fase ② — Pendaftaran Mahasiswa
Aturan/Kondisi	Keterangan Operasional
Registrasi Spesifik	Mahasiswa tidak mendaftar "KKN" secara umum, melainkan mendaftar ke 1 Kamar spesifik. Record peserta_kkn di-generate mengikat periode_id.
Overlap Protection	Mahasiswa yang sudah berstatus aktif (pending/approved) di Kamar A, tidak bisa mendaftar di Kamar B pada kurun waktu yang sama.
Status Flow	Draft → document_submitted → approved/rejected.
Fase ③ — Verifikasi & Approval (Admin)
Aturan/Kondisi	Keterangan Operasional
Filter Kamar Wajib	Halaman /admin/pendaftaran menampilkan data yang disaring berdasarkan periode_id. Admin diwajibkan menggunakan Context Switcher di UI agar tidak tercampur.
Decoupling Approval	Admin menyetujui (approve) pendaftar murni berdasarkan kelayakan akademik. Penempatan kelompok (auto-placement) dibuat non-blocking dan ditunda ke fase Plotting.
Bulk Action Aman	Tombol "Sahkan Pendaftaran Masal" hanya mengeksekusi mahasiswa yang ada di dalam scope kamar yang sedang terbuka.
Fase ④ — Plotting Peserta & Penugasan DPL
Aturan/Kondisi	Keterangan Operasional
Cross-Plotting Protection	Sistem backend menolak proses assign jika peserta_kkn.periode_id ≠ kelompok_kkn.periode_id. Mahasiswa Kamar A tidak akan pernah bisa ditugaskan ke kelompok Kamar B, baik manual maupun import Excel.
1 Kelompok = 1 Ketua	Dari kapasitas penuh suatu kelompok (misal 10 mhs), wajib ditunjuk tepat 1 mahasiswa sebagai Ketua Kelompok (Kordes). Record role diubah menjadi 'Ketua'. Sistem UI akan memberi alert visual jika kelompok penuh tanpa Ketua.
Isolasi Otoritas DPL	Admin menetapkan DPL untuk kelompok di "Kamar" tersebut. Jika dosen yang sama mengajar di 2 kamar berbeda, sistem membuat 2 instance penugasan (pivot) yang terpisah.
Fase ⑤ — Pelaksanaan & Bimbingan
Aturan/Kondisi	Keterangan Operasional
Laporan & Proker	Laporan harian, absensi, dan program kerja otomatis terkunci dalam hierarki kelompok_id, yang secara pewarisan terikat pada kamar.
Dashboard DPL Terisolasi	Jika DPL membimbing di 2 kamar berbeda (misal Periode 80 dan Internasional), DPL diwajibkan menggunakan Context Switcher (Dropdown Pemilih Kamar). Data bimbingan, notifikasi, dan daftar absensi harus eksklusif milik kamar yang aktif.
Fase ⑥ — Penilaian (Grading)
Aturan/Kondisi	Keterangan Operasional
Rubrik Terikat Kamar	Bobot komponen penilaian (DPL, Desa, LPPM) beradaptasi sesuai setting periode/jenis KKN.
Finalisasi oleh LPPM	Admin LPPM memfinalisasi (is_finalized = true) nilai hanya untuk mahasiswa di dalam kamar yang aktif. Finalisasi ini memicu validitas sertifikat kelulusan.
Fase ⑦ — Sertifikasi Kelulusan
Aturan/Kondisi	Keterangan Operasional
Sertifikat Milik 1 Kamar	Tabel sertifikat_kkn mengikat periode_id. Tidak ada sertifikat lintas periode.
Isolasi Template Desain	Setiap kamar memiliki konfigurasi desain sertifikatnya sendiri (Background Image, Nama Penandatangan, Nomor SK Rektor). Sertifikat KKN Reguler Periode 80 tidak terpengaruh oleh update desain sertifikat KKN Internasional.
Nomor Sertifikat Unik	Format nomor sertifikat (contoh: CERT/KKN-80/2026/001) memuat identitas unik kamar untuk validasi.
Verifikasi Publik	Scan QR Code mengarah ke portal publik yang mendisplay metadata mahasiswa lengkap dengan Nama Periode-nya.
4. Audit Kesesuaian Database (Setelah Review Arsitektur)
Entitas Logis	Tabel Aktual	Mendukung Isolasi?	Rekomendasi Final
Pendaftaran Mahasiswa	peserta_kkn	✅	Gunakan Global Scope ByActivePeriod
Kelompok	kelompok_kkn	✅	Gunakan Global Scope ByActivePeriod
Penugasan DPL	dpl_periode & pivot	✅	Otoritas terisolasi by pivot groups
Monitoring & Evaluasi	monitoring_dpl, evaluasi_dpl_peserta	✅	Gunakan Global Scope
Absensi	attendance	✅	Gunakan Global Scope
Sertifikat	sertifikat_kkn	✅	Gunakan Global Scope
Nilai/Grading	nilai_kkn	🔗	Terisolasi hierarki via kelompok_id
Konfigurasi Sertifikat	konfigurasi_sertifikat	❌	Perlu migrasi ke pola Template + Overrides
5. Analisis Celah Keamanan & Loophole (Backend Review)
Berdasarkan review arsitektur, ditemukan tiga celah potensial yang perlu mitigasi teknis di level kode:

A. Race Condition pada Queue & Event Listener
Skenario: Admin LPPM membuka Kamar A, klik "Generate Sertifikat Masal". Proses masuk ke Queue. Bersamaan, Admin lain di Kamar B mengubah konfigurasi sertifikat global.

Risiko: Sertifikat Kamar A dapat menggunakan gambar latar atau SK Rektor milik Kamar B karena Queue Job tidak membawa konteks periode_id secara eksplisit.

Mitigasi Teknis (Laravel):

Setiap Job Class (misal GenerateCertificateJob) wajib menerima parameter Periode $periode melalui constructor.

Jangan pernah membaca config('sertifikat.default') secara global di dalam Job. Selalu resolve data konfigurasi dari database berdasarkan periode_id yang disimpan di properti Job.

B. Mass Assignment pada Import Excel
Skenario: Admin mengunduh template dari Kamar A, menambahkan data mahasiswa Kamar B, lalu mengunggahnya kembali.

Risiko: Mahasiswa Kamar B dapat ter-plotting ke kelompok Kamar A jika validasi hanya mengecek NIM, tanpa membandingkan periode_id resource.

Mitigasi Teknis:

Dalam Importer Class (Maatwebsite/Laravel-Excel), lakukan force override: $row['periode_id'] = session('active_period_id');.

Tambahkan validasi ketat: KelompokKkn::where('id', $row['kelompok_id'])->where('periode_id', session('active_period_id'))->exists() sebelum melakukan insert.

C. Global Scope yang Tidak Konsisten di Relasi Eloquent
Skenario: Query $dpl->peserta() pada Dashboard DPL tanpa Global Scope.

Risiko: DPL dapat melihat daftar mahasiswa bimbingan dari periode sebelumnya yang tidak relevan.

Mitigasi Teknis:

Semua Model inti (PesertaKkn, KelompokKkn, Absensi, Nilai, Sertifikat) wajib menggunakan Global Scope ByActivePeriodScope.

Global Scope membaca session('active_period_id') (untuk Admin) atau auth()->user()->active_period (untuk DPL).

6. Rekomendasi Desain Database untuk Konfigurasi Sertifikat
Pendekatan: Pola Inheritance Konfigurasi (Template + Overrides) menggantikan penambahan kolom periode_id secara langsung.

Struktur Tabel yang Diusulkan
sql
-- Tabel Induk: Template Global (Fallback)
CREATE TABLE `sertifikat_templates` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL COMMENT 'Default, Internasional, Merdeka',
    `default_data` JSON NOT NULL COMMENT '{ "bg": "bg.jpg", "ttd": "Rektor", "sk": "xxx" }',
    `is_active` tinyint(1) DEFAULT 1,
    PRIMARY KEY (`id`)
);

-- Tabel Override: Spesifik per Periode (Prioritas Lebih Tinggi)
CREATE TABLE `sertifikat_template_overrides` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `periode_id` bigint unsigned NOT NULL,
    `template_id` bigint unsigned NOT NULL,
    `override_data` JSON NOT NULL COMMENT 'Hanya field yang berubah',
    PRIMARY KEY (`id`),
    UNIQUE KEY `periode_template_unique` (`periode_id`, `template_id`),
    FOREIGN KEY (`periode_id`) REFERENCES `periode` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`template_id`) REFERENCES `sertifikat_templates` (`id`) ON DELETE CASCADE
);
Alur Logika di Backend (Laravel)
Saat generate sertifikat untuk Periode X.

Cari template default aktif (misal name = 'KKN Reguler').

Cek apakah ada record di sertifikat_template_overrides dengan periode_id = X dan template_id yang sama.

Jika Ada: Ambil default_data dari template, lalu array_merge_recursive dengan override_data. Hasilnya adalah konfigurasi final.

Jika Tidak Ada: Gunakan default_data mentah.

Keuntungan:

Efisiensi Admin: Tidak perlu mengisi ulang semua field untuk setiap periode baru.

Isolasi Ketat: Perubahan di satu kamar tidak bocor ke kamar lain.

Audit Trail: Perubahan override dapat dilacak secara terpisah.

7. Strategi Mitigasi Human-Error (Di Luar Context Switcher)
Context Switcher saja tidak cukup. Lapisan pertahanan tambahan berikut bersifat wajib:

A. Visual Watermarking (Warna Tema Kamar)
Implementasi: Tambahkan kolom color_hex (misal #1E3A8A) pada tabel periode.

Efek UI: Header, Sidebar, dan tombol aksi primer berubah warna sesuai tema kamar aktif.

Tujuan: Memberikan sinyal visual bawah sadar bahwa admin sedang berada di kamar yang spesifik.

B. Konfirmasi Mengetik Nama Periode pada Bulk Action
Implementasi: Saat Admin mengklik "Setujui Semua Pendaftar" atau "Finalisasi Nilai", muncul modal yang memaksa Admin mengetik nama periode (contoh: PERIODE 81).

Teks Tombol: Ubah dari "Setujui (20) Pendaftar" menjadi "Setujui 20 Pendaftar untuk KKN Reguler Periode 81".

Gating: Tombol "Ya, Lanjutkan" hanya aktif jika teks yang diketik persis cocok.

C. Audit Trail dengan Snapshot Periode
Tabel: activity_log

Kolom Wajib: user_id, action, periode_id (kamar saat aksi dilakukan), ip_address, data (JSON).

Kegunaan: Saat terjadi insiden plotting salah kamar, log akan menunjukkan di kamar mana aksi tersebut benar-benar dijalankan.

D. Middleware Policy untuk Pengecekan Izin Resource
Implementasi Laravel Policy:

php
public function update(User $user, KelompokKkn $kelompok) {
    return $kelompok->periode_id === session('active_period_id');
}
Efek: Jika Admin mengakses URL /admin/kelompok/123/edit (milik Kamar A) padahal Context Switcher di Kamar B, sistem akan melempar 403 Forbidden atau Redirect otomatis dengan pesan error.

8. Item Tindak Lanjut (Action Plan) — Diperbarui
ID	Area Prioritas	Tindakan Teknis	PIC
A1	Backend (Global Scope)	Implement ByActivePeriodScope pada Model: PesertaKkn, KelompokKkn, Absensi, Nilai, Sertifikat.	Backend Dev
A2	Database (Konfig Sertifikat)	Migrasi skema dari konfigurasi_sertifikat flat ke Template + Overrides.	Database Eng
A3	Queue & Job	Refactor semua Job (GenerateSertifikat, ImportExcel) agar menerima parameter periode_id dan tidak membaca config global.	Backend Dev
B1	UI/UX (Watermark)	Implementasi kolom color_hex di tabel periode dan binding ke CSS Variable di layout utama.	Frontend Dev
B2	UI/UX (Bulk Confirm)	Tambahkan modal konfirmasi "Ketik Nama Periode" pada semua halaman aksi massal.	Frontend Dev
B3	UI/UX (Warning Kordes)	Tampilkan badge peringatan di halaman /admin/kelompok jika kelompok belum memiliki Ketua.	Frontend Dev
B4	Security (Policy)	Buat Policy untuk semua model kunci yang membandingkan periode_id dengan session aktif.	Backend Dev
C1	Edukasi Admin	Buat panduan penggunaan tombol "Sinkron Wilayah" untuk pembentukan kelompok otomatis.	LPPM


------

Berikut adalah versi lengkap dan terstruktur dari hasil review arsitektur yang dapat Anda salin langsung (copy-paste) ke dalam dokumen teknis, Notion, atau file Wiki tim pengembangan Anda.

Review Arsitektur: Portal KKN UIN SAIZU v3.0
Status: Direkomendasikan untuk Implementasi dengan Revisi
Reviewer: Senior Software Architect
Fokus: Keamanan Isolasi Data, Desain Database, & Mitigasi Human Error

1. Audit Keamanan: Potensi Celah (Loopholes)
Meskipun konsep "Isolasi Konteks" sudah sangat tepat, implementasi teknis seringkali memiliki celah di luar logika bisnis utama. Berikut risiko yang harus diatasi:

A. Risiko Insecure Direct Object Reference (IDOR)
Deskripsi: User (Admin/DPL) memanipulasi ID objek secara manual di request (misal: mengubah parameter URL ?student_id=55 menjadi ?student_id=12 dari periode lain).
Dampak: Admin tidak sengaja mengedit/menilai data mahasiswa dari periode berbeda karena controller hanya mengecek permission akses, bukan kepemilikan periode.
Solusi Teknis:
Jangan hanya mengandalkan validasi di Form Request.
Wajib menerapkan Global Scopes di Eloquent Laravel agar setiap query ke model yang sensitif (PesertaKkn, KelompokKkn, NilaiKkn) otomatis menyaring WHERE period_id = {session_active_period}.
Gunakan Policy Authorization yang mengecek kesesuaian periode_id sebelum aksi update atau view dilakukan.
B. Masalah Integritas Historis pada Master Data (Lokasi/Desa)
Deskripsi: PRD menyatakan "Lokasi = Master Data (di-reuse)". Jika admin memperbarui nama desa di Master Data (misal: "Desa A" menjadi "Desa Baru"), perubahan ini bersifat retroaktif ke data periode yang sudah lama/selesai.
Dampak: Sertifikat atau laporan historis Periode 80 akan menampilkan nama desa yang salah (sesuai update baru), merusak keabsahan dokumen masa lalu.
Solusi Teknis (Snapshotting):
Saat desa dipilih untuk suatu Periode (saat Sync Wilayah), sistem harus menyalin (copy) atribut penting (nama_desa, kode_wilayah, kecamatan) ke dalam tabel kelompok_kkn atau tabel pivot lokasi_periode.
Jangan hanya menyimpan lokasi_id sebagai Foreign Key saja tanpa menyimpan snapshot namanya.
C. Bypass Logika Overlap Protection
Deskripsi: Mahasiswa daftar Periode A -> Approved -> Mengundur diri (Dropped) -> Mendaftar Periode B (Approved). Jika Admin secara manual mengubah status mahasiswa di Periode A kembali menjadi "Active".
Dampak: Mahasiswa memiliki 2 status aktif di 2 periode berbeda, berpotensi merusak statistik dan sertifikat.
Solusi Teknis:
Tambahkan validasi hard check di event updating pada model PesertaKkn: Tolak perubahan status menjadi active/approved jika mahasiswa tersebut sudah memiliki status active/approved di periode lain, terlepas dari rentang waktunya.
2. Database Design Review: Solusi konfigurasi_sertifikat
Pertanyaan: Apakah best practice mempartisi tabel konfigurasi menggunakan periode_id?

Analisis:
Terdapat dua pendekatan umum untuk relasi 1:1 (Periode ke Konfigurasi Sertifikat).

Pendekatan A: Tabel Terpisah (konfigurasi_sertifikat + periode_id)
Pro: Skema eksplisit, mudah ditambah relasi (misal: relasi ke tabel penandatangan), validasi tipe data ketat.
Kontra: Perlu join table.
Verdict: Disarankan. Mengingat fitur sertifikat kemungkinan akan berkembang (penambahan tanda tangan, logo kiri/kanan, QR code config), pendekatan ini lebih skalabel dan rapi secara maintenance.
Pendekatan B: Kolom JSON di Tabel periode
Pro: Tidak perlu join, data langsung tersedia saat load model periode.
Kontra: Validasi sulit jika struktur config kompleks.
Rekomendasi Implementasi:
Gunakan Pendekatan A (Tabel Terpisah) sesuai rencana awal PRD, namun pastikan relasi database dibenarkan.

Migrasi:
sql

ALTER TABLE konfigurasi_sertifikat
ADD COLUMN periode_id BIGINT UNSIGNED UNIQUE,
ADD FOREIGN KEY (periode_id) REFERENCES periode(id) ON DELETE CASCADE;
Catatan: Gunakan UNIQUE untuk memastikan 1 periode hanya punya 1 config sertifikat.
Relasi Eloquent (Laravel):
Di Model Periode:
php

public function konfigurasiSertifikat()
{
    return $this->hasOne(KonfigurasiSertifikat::class);
}
3. Mitigasi Human Error (Selain Context Switcher)
Agar Admin/DPL tidak salah "Kamar", berikut lapisan keamanan UX tambahan:

A. Visual Theming (Mode Warna Periode)
Konsep: Ubah skema warna UI (Sidebar/Navbar) berdasarkan Periode yang sedang aktif.
Implementasi:
Simpan kolom theme_color (misal: #3b82f6 untuk biru, #ef4444 untuk merah) di tabel periode.
Inject CSS variable di layout Inertia/React berdasarkan nilai ini.
Efek: Admin akan langsung sadar berada di periode yang salah karena nuansa warna aplikasi berubah drastis.
B. Middleware "Period Lock" (Wajib Pilih)
Konsep: Jangan biarkan Admin mengakses halaman dashboard jika session('active_period_id') kosong.
Implementasi:
Buat Middleware EnsurePeriodSelected.
Jika session null, redirect ke halaman khusus "Pilih Periode" yang memblokir navigasi lain.
C. Mode Arsip (Archive Mode)
Konsep: Tandai periode yang sudah selesai dengan flag is_closed = true.
Implementasi:
Jika periode aktif adalah periode yang sudah closed, matikan (disable) semua tombol aksi: Edit, Hapus, Approve, Generate.
Ubah tampilan UI menjadi Grayscale (hitam putih) atau beri watermark besar "DATA ARSIP - READ ONLY" di latar belakang halaman.
D. Konfirmasi "Destructive Action" (Type-to-Confirm)
Konsep: Saat melakukan aksi kritis (Finalisasi Nilai, Generate Sertifikat Massal).
Implementasi:
Bukan sekali tombol "OK", tapi tampilkan Modal Input yang memaksa Admin mengetik Nama Periode atau Kode Periode (contoh: ketik "PERIODE-81") untuk mengeksekusi.
4. Snippet Implementasi Teknis (Laravel)
Berikut contoh kode implementasi untuk menjawab poin-poin di atas agar siap pakai.

A. Global Scope untuk Isolasi Data
Buat Trait HasPeriodScope dan terapkan pada model PesertaKkn, KelompokKkn, dll.

php

// app/Traits/HasPeriodScope.php
namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class HasPeriodScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        // Ambil period_id dari session (di-set oleh Context Switcher)
        $activePeriodId = session('active_period_id');

        if ($activePeriodId) {
            $builder->where($model->getTable() . '.period_id', $activePeriodId);
        }
    }
}

// Pada Model (contoh: PesertaKkn.php)
protected static function booted()
{
    static::addGlobalScope(new \App\Traits\HasPeriodScope());
}
B. Middleware Pemaksa Pilih Periode
php

// app/Http/Middleware/EnsurePeriodSelected.php
public function handle($request, Closure $next)
{
    if (is_null(session('active_period_id'))) {
        // Redirect ke halaman pemilihan periode jika belum ada
        return redirect()->route('period.select');
    }

    return $next($request);
}
Daftarkan middleware ini ke route group admin dan dpl.

C. Snapshotting Data (Pada Event Membuat Kelompok)
php

// Di Service atau Controller saat Sinkronisasi Wilayah
 $desa = MasterDesa::find($desaId);

 $kelompok = KelompokKkn::create([
    'period_id'   => $activePeriodId,
    'desa_id'     => $desa->id, // Untuk relasi
    'nama_desa'   => $desa->nama, // SNAPSHOT DATA (PENTING)
    'kode_desa'   => $desa->kode, // SNAPSHOT DATA
    'kecamatan'   => $desa->kecamatan, // SNAPSHOT DATA
]);
Catatan Akhir:
Arsitektur yang Anda rancang sudah sangat matang. Kunci sukses utama adalah konsistensi dalam menerapkan period_id di setiap layer aplikasi (Database, Backend Logic, hingga Frontend State). Selamat berkoding

----

Review Arsitektur: PRD Siklus Hidup KKN End-to-End
Isolasi Data per Periode ("Kamar Masing-Masing")
Table
Informasi	
Sistem	Portal KKN UIN SAIZU
Versi PRD	3.0 — Final Komprehensif
Reviewer	Senior Software Architect
Tanggal Review	21 April 2026
Status	Review Selesai — Rekomendasi Tindak Lanjut Disertakan
Executive Summary
PRD v3.0 menyajikan fondasi arsitektural yang kuat untuk isolasi multi-tenancy berbasis periode. Konsep "Kamar" sebagai unit isolasi end-to-end dari pendaftaran hingga sertifikasi adalah pendekatan yang tepat secara domain-driven design. Namun, terdapat celah keamanan pada lapisan implementasi enforcement, suboptimal design pada partisi konfigurasi sertifikat, serta perlunya lapisan pertahanan tambahan terhadap human error di luar UI context switcher.
1. Analisis Celah Keamanan (Security Loopholes)
1.1 Race Condition pada Overlap Protection (🔴 Critical)
Deskripsi Risiko:
Validasi "mahasiswa tidak boleh aktif di dua kamar sekaligus" pada Fase ② bersifat logical check di application layer. Tanpa database-level constraint, dua proses konkuren dapat melewati validasi bersamaan sebelum salah satu commit.
Skenario Serangan/Kegagalan:
plain
Copy
T0: Mahasiswa X submit ke Kamar A (status: pending)
T1: Mahasiswa X submit ke Kamar B (status: pending) — check Kamar A belum "approved"
T2: Admin approve Kamar A
T3: Admin approve Kamar B
T4: Mahasiswa X aktif di dua kamar secara bersamaan
Rekomendasi Mitigasi:
sql
Copy
-- Composite Unique Index dengan kondisi status aktif
CREATE UNIQUE INDEX idx_unique_peserta_aktif 
ON peserta_kkn (mahasiswa_id) 
WHERE status IN ('approved', 'document_submitted');

-- Atau dengan partial index untuk periode yang overlap waktu
CREATE UNIQUE INDEX idx_unique_peserta_periode_overlap
ON peserta_kkn (mahasiswa_id, periode_id);
php
Copy
// Laravel: Global Scope yang immutable
// File: app/Models/PesertaKkn.php

protected static function booted()
{
    static::addGlobalScope('isolasi_periode', function (Builder $builder) {
        // Scope ini TIDAK boleh di-remove oleh developer
        // Gunakan final class atau coding standard enforcement
    });
    
    static::creating(function ($model) {
        // Pessimistic locking untuk cek overlap
        DB::transaction(function () use ($model) {
            $exists = DB::table('peserta_kkn')
                ->where('mahasiswa_id', $model->mahasiswa_id)
                ->whereIn('status', ['approved', 'document_submitted'])
                ->lockForUpdate()
                ->exists();
                
            if ($exists) {
                throw new OverlapPeriodException(
                    'Mahasiswa masih aktif di periode lain'
                );
            }
        }, 5); // retry 5x untuk deadlock
    });
}
1.2 Soft Delete & Data Residu (🔴 Critical)
Deskripsi Risiko:
Jika model PesertaKkn, KelompokKkn, atau NilaiKkn menggunakan SoftDeletes, data yang "terhapus" dari Kamar A dapat direstore ke Kamar B atau direferensi oleh query yang tidak memperhatikan deleted_at dalam konteks isolasi periode.
Rekomendasi Mitigasi:
php
Copy
// File: app/Traits/PeriodIsolatedSoftDelete.php

trait PeriodIsolatedSoftDelete
{
    public static function bootPeriodIsolatedSoftDelete()
    {
        static::restoring(function ($model) {
            // Validasi: data yang direstore harus tetap dalam periode yang sama
            $activePeriod = session('active_period_id');
            
            if ($model->periode_id !== $activePeriod) {
                throw new InvalidPeriodContextException(
                    "Data dari periode {$model->periode_id} " .
                    "tidak dapat direstore di periode {$activePeriod}"
                );
            }
        });
        
        // Override forceDelete untuk menghapus juga relasi terkait
        public function forceDeleteWithRelations()
        {
            return DB::transaction(function () {
                // Hapus relasi terisolasi terlebih dahulu
                $this->laporanHarian()->forceDelete();
                $this->absensi()->forceDelete();
                $this->nilai()->forceDelete();
                
                return parent::forceDelete();
            });
        }
    }
}
1.3 Privilege Escalation via Header Manipulation (🟡 High)
Deskripsi Risiko:
Context switcher berbasis session atau header request (X-Periode-ID) dapat dimanipulasi oleh user yang memiliki akses ke multiple periode. DPL yang mengajar di Kamar A dan Kamar B dapat mengubah header untuk mengakses data kamar lain.
Rekomendasi Mitigasi — Cryptographic Context Binding:
php
Copy
// File: app/Services/PeriodContextService.php

class PeriodContextService
{
    private string $encryptionKey;
    
    public function __construct()
    {
        $this->encryptionKey = config('app.period_context_key');
    }
    
    /**
     * Generate signed token untuk periode aktif
     * Token ini di-bind ke user session dan tidak bisa dipindahkan
     */
    public function generateContextToken(int $periodeId, int $userId): string
    {
        $payload = json_encode([
            'periode_id' => $periodeId,
            'user_id'    => $userId,
            'issued_at'  => now()->timestamp,
            'nonce'      => bin2hex(random_bytes(16)),
        ]);
        
        $signature = hash_hmac('sha256', $payload, $this->encryptionKey);
        
        return base64_encode($payload) . '.' . $signature;
    }
    
    /**
     * Verifikasi token — reject jika signature tidak valid
     * atau user_id tidak cocok
     */
    public function verifyContextToken(string $token, int $currentUserId): ?int
    {
        [$payloadBase64, $signature] = explode('.', $token);
        
        $expectedSignature = hash_hmac(
            'sha256', 
            base64_decode($payloadBase64), 
            $this->encryptionKey
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new InvalidContextTokenException('Token signature invalid');
        }
        
        $payload = json_decode(base64_decode($payloadBase64), true);
        
        if ($payload['user_id'] !== $currentUserId) {
            throw new ContextUserMismatchException('Token tidak valid untuk user ini');
        }
        
        // Token expire setelah 8 jam (sesi kerja)
        if (now()->timestamp - $payload['issued_at'] > 28800) {
            throw new ExpiredContextTokenException('Context token expired');
        }
        
        return $payload['periode_id'];
    }
}
php
Copy
// File: app/Http/Middleware/EnforcePeriodContext.php

class EnforcePeriodContext
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->cookie('period_context_token') 
              ?? $request->header('X-Period-Context');
              
        if (!$token) {
            return redirect()->route('context.switcher')
                ->with('error', 'Pilih periode aktif terlebih dahulu');
        }
        
        $periodService = app(PeriodContextService::class);
        $activePeriodId = $periodService->verifyContextToken(
            $token, 
            auth()->id()
        );
        
        // Bind ke request untuk digunakan oleh controller
        $request->attributes->set('validated_period_id', $activePeriodId);
        
        // Inject ke setiap query model secara otomatis
        DB::statement('SET @active_period_id = ?', [$activePeriodId]);
        
        return $next($request);
    }
}
1.4 Temporal Overlap pada Periode Beririsan (🟡 High)
Deskripsi Risiko:
Dua periode dapat memiliki rentang waktu yang tumpang tindih (e.g., KKN Reguler 80: Jan-Jun, KKN Nusantara 81: Mar-Ago). Status "aktif" per periode tidak cukup — perlu validasi rentang tanggal pelaksanaan.
Rekomendasi Mitigasi:
sql
Copy
-- Tabel periode_kkn dengan rentang waktu
ALTER TABLE periode_kkn ADD COLUMN IF NOT EXISTS 
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL;

-- Fungsi cek overlap
CREATE OR REPLACE FUNCTION check_period_overlap(
    p_mahasiswa_id BIGINT,
    p_periode_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_new_start DATE;
    v_new_end DATE;
    v_overlap_count INT;
BEGIN
    SELECT tanggal_mulai, tanggal_selesai 
    INTO v_new_start, v_new_end
    FROM periode_kkn WHERE id = p_periode_id;
    
    SELECT COUNT(*) INTO v_overlap_count
    FROM peserta_kkn pk
    JOIN periode_kkn pkp ON pk.periode_id = pkp.id
    WHERE pk.mahasiswa_id = p_mahasiswa_id
      AND pk.status IN ('approved', 'document_submitted')
      AND pkp.tanggal_mulai <= v_new_end
      AND pkp.tanggal_selesai >= v_new_start;
      
    RETURN v_overlap_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk mencegah insert jika overlap
CREATE TRIGGER trg_prevent_period_overlap
BEFORE INSERT OR UPDATE ON peserta_kkn
FOR EACH ROW EXECUTE FUNCTION prevent_overlap_insert();
1.5 Excel Import — Cross-Period Injection (🔴 Critical)
Deskripsi Risiko:
Admin mengunggah file Excel untuk plotting massal. File dimodifikasi untuk berisi kelompok_id dari periode berbeda. Backend hanya memvalidasi format, bukan kepemilikan periode dari setiap foreign key.
Rekomendasi Mitigasi:
php
Copy
// File: app/Services/Plotting/ExcelPlottingValidator.php

class ExcelPlottingValidator
{
    /**
     * Secondary validation: setiap row harus cross-check periode
     */
    public function validateCrossPeriodIntegrity(
        array $rows, 
        int $targetPeriodId
    ): ValidationResult {
        $errors = [];
        
        foreach ($rows as $index => $row) {
            // Cek 1: Peserta harus milik periode target
            $pesertaPeriod = PesertaKkn::find($row['peserta_id'])?->periode_id;
            if ($pesertaPeriod !== $targetPeriodId) {
                $errors[] = "Baris " . ($index + 2) . ": " .
                    "Peserta ID {$row['peserta_id']} milik periode " .
                    "lain ({$pesertaPeriod} ≠ {$targetPeriodId})";
            }
            
            // Cek 2: Kelompok harus milik periode target
            $kelompokPeriod = KelompokKkn::find($row['kelompok_id'])?->periode_id;
            if ($kelompokPeriod !== $targetPeriodId) {
                $errors[] = "Baris " . ($index + 2) . ": " .
                    "Kelompok ID {$row['kelompok_id']} milik periode " .
                    "lain ({$kelompokPeriod} ≠ {$targetPeriodId})";
            }
            
            // Cek 3: DPL yang ditugaskan harus terdaftar di periode target
            if (isset($row['dpl_id'])) {
                $dplRegistered = DplPeriode::where([
                    'dpl_id'     => $row['dpl_id'],
                    'periode_id' => $targetPeriodId,
                ])->exists();
                
                if (!$dplRegistered) {
                    $errors[] = "Baris " . ($index + 2) . ": " .
                        "DPL ID {$row['dpl_id']} tidak terdaftar di periode ini";
                }
            }
        }
        
        return empty($errors) 
            ? ValidationResult::success() 
            : ValidationResult::failure($errors);
    }
}
2. Database Design: Konfigurasi Sertifikat
2.1 Problem Statement
Partisi konfigurasi_sertifikat menggunakan periode_id secara langsung adalah anti-pattern untuk kasus ini karena:
Table
Masalah	Dampak
Duplikasi data template untuk setiap periode	Storage redundancy, inconsistency risk
Tidak ada reusability desain global	Setiap periode harus dikonfigurasi dari nol
Tidak ada versioning template	Perubahan desain global sulit dipropagasikan
Asset (background, logo) diduplikasi	Waste storage, cache inefficiency
2.2 Rekomendasi: Template Inheritance Pattern
Skema Database
sql
Copy
-- ============================================================
-- TABEL 1: Master Template Sertifikat (Global)
-- ============================================================
CREATE TABLE sertifikat_templates (
    id                  BIGSERIAL PRIMARY KEY,
    kode_template       VARCHAR(50) UNIQUE NOT NULL,
    -- e.g., "KKN-REGULER-2026", "KKN-INTERNASIONAL-V2"
    
    nama_template       VARCHAR(100) NOT NULL,
    deskripsi           TEXT,
    
    -- Asset global (shared)
    background_default  VARCHAR(255),
    logo_institusi      VARCHAR(255),
    
    -- Layout configuration (posisi elemen dinamis)
    layout_config       JSONB NOT NULL DEFAULT '{
        "nama_mahasiswa": {"x": 400, "y": 300, "font": "Times-Bold", "size": 24},
        "nim":            {"x": 400, "y": 340, "font": "Times-Roman", "size": 14},
        "periode":        {"x": 400, "y": 380, "font": "Times-Roman", "size": 14},
        "penandatangan":  {"x": 400, "y": 500, "font": "Times-Bold", "size": 16},
        "qr_code":        {"x": 650, "y": 650, "size": 80}
    }',
    
    is_active           BOOLEAN DEFAULT true,
    created_by          BIGINT REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABEL 2: Konfigurasi Spesifik Periode (Override Layer)
-- ============================================================
CREATE TABLE periode_sertifikat_config (
    id                      BIGSERIAL PRIMARY KEY,
    periode_id              BIGINT NOT NULL REFERENCES periode_kkn(id),
    template_id             BIGINT NOT NULL REFERENCES sertifikat_templates(id),
    
    -- Override fields: NULL = inherit dari template
    -- Ini adalah "sparse column" pattern
    
    penandatangan_nama      VARCHAR(100),
    penandatangan_jabatan   VARCHAR(100),
    penandatangan_nip       VARCHAR(50),
    
    nomor_sk_rektor         VARCHAR(100),
    tanggal_sk_rektor       DATE,
    
    -- Override asset jika periode punya khusus
    background_override     VARCHAR(255),
    
    -- Konfigurasi nomor sertifikat
    format_nomor            VARCHAR(100) DEFAULT 'CERT/KKN-{periode}/{tahun}/{sequence}',
    sequence_terakhir       INT DEFAULT 0,
    
    -- Metadata
    is_finalized            BOOLEAN DEFAULT false,
    -- Setelah true, konfigurasi tidak bisa diubah (prevent mid-period changes)
    
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(periode_id, template_id)
);

-- ============================================================
-- TABEL 3: Sertifikat Terbit (Instance)
-- ============================================================
CREATE TABLE sertifikat_kkn (
    id                  BIGSERIAL PRIMARY KEY,
    periode_id          BIGINT NOT NULL REFERENCES periode_kkn(id),
    peserta_id          BIGINT NOT NULL REFERENCES peserta_kkn(id),
    
    -- Referensi ke konfigurasi yang digunakan saat generate
    config_id           BIGINT NOT NULL REFERENCES periode_sertifikat_config(id),
    
    nomor_sertifikat    VARCHAR(100) UNIQUE NOT NULL,
    -- e.g., "CERT/KKN-80/2026/001"
    
    file_path           VARCHAR(255),
    qr_code_data        VARCHAR(255),
    -- URL verifikasi publik: https://kkn.uinsaizu.ac.id/verify/{hash}
    
    is_valid            BOOLEAN DEFAULT true,
    -- Jika ada pembatalan, sertifikat bisa di-invalidkan
    
    generated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by        BIGINT REFERENCES users(id)
);

-- Index untuk performa
CREATE INDEX idx_sertifikat_periode ON sertifikat_kkn(periode_id);
CREATE INDEX idx_sertifikat_nomor ON sertifikat_kkn(nomor_sertifikat);
CREATE INDEX idx_sertifikat_peserta ON sertifikat_kkn(peserta_id);
Model Laravel: Resolution Logic
php
Copy
// File: app/Models/PeriodeSertifikatConfig.php

class PeriodeSertifikatConfig extends Model
{
    protected $fillable = [
        'periode_id', 'template_id', 'penandatangan_nama',
        'penandatangan_jabatan', 'nomor_sk_rektor', 'format_nomor'
    ];
    
    protected $casts = [
        'is_finalized' => 'boolean',
    ];
    
    /**
     * Resolve konfigurasi efektif dengan inheritance
     * NULL fields di override layer akan fallback ke template
     */
    public function resolveEffectiveConfig(): array
    {
        $template = $this->template;
        
        return [
            'background' => $this->background_override 
                ?? $template->background_default,
            'layout'     => $template->layout_config,
            'penandatangan' => [
                'nama'    => $this->penandatangan_nama 
                    ?? $template->penandatangan_default_nama,
                'jabatan' => $this->penandatangan_jabatan 
                    ?? $template->penandatangan_default_jabatan,
            ],
            'nomor_sk' => $this->nomor_sk_rektor,
            'format_nomor' => $this->format_nomor,
        ];
    }
    
    /**
     * Generate nomor sertifikat berikutnya dengan atomic increment
     */
    public function generateNextNumber(): string
    {
        return DB::transaction(function () {
            // Lock row untuk mencegah race condition pada nomor urut
            $config = self::lockForUpdate()->find($this->id);
            
            $nextSequence = $config->sequence_terakhir + 1;
            $config->update(['sequence_terakhir' => $nextSequence]);
            
            return str_replace(
                ['{periode}', '{tahun}', '{sequence}'],
                [
                    $this->periode->nomor_periode,
                    now()->year,
                    str_pad($nextSequence, 3, '0', STR_PAD_LEFT)
                ],
                $config->format_nomor
            );
        });
    }
    
    public function template()
    {
        return $this->belongsTo(SertifikatTemplate::class, 'template_id');
    }
}
ERD Visual
plain
Copy
┌─────────────────────┐         ┌──────────────────────────┐
│ sertifikat_templates│         │ periode_sertifikat_config│
├─────────────────────┤         ├──────────────────────────┤
│ id (PK)             │◄────────│ id (PK)                  │
│ kode_template       │   1:M   │ periode_id (FK)          │
│ background_default  │         │ template_id (FK)         │
│ layout_config (JSON)│         │ penandatangan_nama       │
│ logo_institusi      │         │ penandatangan_jabatan    │
│ ...                 │         │ nomor_sk_rektor          │
└─────────────────────┘         │ background_override      │
                                │ format_nomor             │
                                │ sequence_terakhir        │
                                │ is_finalized             │
                                └──────────────────────────┘
                                          │
                                          │ 1:M
                                          ▼
                                ┌──────────────────────────┐
                                │ sertifikat_kkn           │
                                ├──────────────────────────┤
                                │ id (PK)                  │
                                │ periode_id (FK)          │
                                │ peserta_id (FK)          │
                                │ config_id (FK)           │
                                │ nomor_sertifikat (UQ)    │
                                │ file_path                │
                                │ qr_code_data             │
                                └──────────────────────────┘
3. Mitigasi Human-Error: Defense in Depth
3.1 Layer 1 — Visual & Cognitive Safety (UI/UX)
TypeScript
Copy
// React/Inertia Component: PeriodContextBanner.tsx

interface PeriodContextBannerProps {
  activePeriod: {
    id: number;
    nama: string;
    jenis: 'Reguler' | 'Internasional' | 'Nusantara';
    tanggalMulai: string;
    tanggalSelesai: string;
  };
}

const PERIOD_COLORS = {
  Reguler:      { bg: 'bg-blue-600',    border: 'border-blue-800',    light: 'bg-blue-50' },
  Internasional:{ bg: 'bg-emerald-600', border: 'border-emerald-800', light: 'bg-emerald-50' },
  Nusantara:    { bg: 'bg-amber-600',   border: 'border-amber-800',   light: 'bg-amber-50' },
};

export default function PeriodContextBanner({ activePeriod }: PeriodContextBannerProps) {
  const colors = PERIOD_COLORS[activePeriod.jenis];
  
  return (
    <div className={`${colors.bg} text-white px-4 py-3 shadow-lg sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon periode */}
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors.light} ${colors.border} text-gray-800 border`}>
            {activePeriod.jenis}
          </span>
          
          <div>
            <p className="font-semibold text-sm">
              KAMAR AKTIF: {activePeriod.nama}
            </p>
            <p className="text-xs opacity-90">
              {activePeriod.tanggalMulai} s/d {activePeriod.tanggalSelesai}
            </p>
          </div>
        </div>
        
        {/* Warning jika periode sudah berakhir */}
        {new Date(activePeriod.tanggalSelesai) < new Date() && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            ⚠️ PERIODE TELAH BERAKHIR — HANYA VIEW MODE
          </span>
        )}
      </div>
    </div>
  );
}
TypeScript
Copy
// React/Inertia: DestructiveActionConfirmModal.tsx

interface ConfirmModalProps {
  isOpen: boolean;
  actionName: string;
  targetPeriod: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DestructiveActionConfirmModal({
  isOpen, actionName, targetPeriod, onConfirm, onCancel
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');
  const requiredText = `SETUJU-${targetPeriod}`;
  
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-red-600 mb-2">
          ⚠️ Konfirmasi Aksi Destruktif
        </h3>
        <p className="text-gray-600 mb-4">
          Anda akan melakukan <strong>{actionName}</strong> pada periode{' '}
          <strong>{targetPeriod}</strong>. Aksi ini tidak dapat dibatalkan.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Ketik <code className="bg-gray-200 px-1 rounded">{requiredText}</code> untuk konfirmasi:
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Ketik teks konfirmasi..."
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={inputValue !== requiredText}
            className={`px-4 py-2 rounded text-white ${
              inputValue === requiredText
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </Modal>
  );
}
3.2 Layer 2 — Immutable Backend Constraints
php
Copy
// File: app/Http/Middleware/EnforcePeriodIsolation.php

class EnforcePeriodIsolation
{
    public function handle(Request $request, Closure $next)
    {
        $validatedPeriodId = $request->attributes->get('validated_period_id');
        
        // Override semua input yang mengandung periode_id
        // Ini mencegah parameter tampering
        if ($request->has('periode_id')) {
            $request->merge(['periode_id' => $validatedPeriodId]);
        }
        
        // Untuk route parameter
        if ($request->route('periode')) {
            // Jika route parameter berbeda dengan context, reject
            if ((int)$request->route('periode') !== $validatedPeriodId) {
                abort(403, 'Periode request tidak cocok dengan context aktif');
            }
        }
        
        return $next($request);
    }
}
php
Copy
// File: app/Providers/AppServiceProvider.php

public function boot()
{
    // Global constraint: setiap query ke tabel KKN 
    // otomatis difilter periode jika dalam web context
    
    Event::listen(QueryExecuted::class, function ($query) {
        if (!app()->runningInConsole() && !request()->is('api/*')) {
            // Inject periode context ke query yang relevan
            // Ini adalah safety net terakhir
        }
    });
}
3.3 Layer 3 — Dual Authorization untuk Finalisasi
php
Copy
// File: app/Services/Grading/FinalizationService.php

class FinalizationService
{
    /**
     * Finalisasi nilai memerlukan dua approver
     */
    public function requestFinalization(
        int $periodeId,
        int $requesterId
    ): FinalizationRequest {
        // Cek apakah sudah ada pending request
        $existing = FinalizationRequest::where([
            'periode_id' => $periodeId,
            'status'     => 'pending',
        ])->first();
        
        if ($existing) {
            // Jika requester berbeda, ini adalah approver kedua
            if ($existing->requester_id !== $requesterId) {
                return $this->executeFinalization($existing, $requesterId);
            }
            
            throw new DuplicateRequestException(
                'Anda sudah mengajukan finalisasi, menunggu approver kedua'
            );
        }
        
        // Buat request baru
        return FinalizationRequest::create([
            'periode_id'   => $periodeId,
            'requester_id' => $requesterId,
            'status'       => 'pending',
            'expires_at'   => now()->addHours(24),
        ]);
    }
    
    private function executeFinalization(
        FinalizationRequest $request,
        int $approverId
    ): FinalizationResult {
        return DB::transaction(function () use ($request, $approverId) {
            // Lock semua nilai di periode ini
            NilaiKkn::where('periode_id', $request->periode_id)
                ->lockForUpdate()
                ->update(['is_finalized' => true]);
            
            $request->update([
                'status'     => 'completed',
                'approver_id' => $approverId,
                'completed_at' => now(),
            ]);
            
            // Trigger generate sertifikat queue
            GenerateSertifikatJob::dispatch($request->periode_id);
            
            return new FinalizationResult(success: true);
        });
    }
}
3.4 Layer 4 — Undo Window & Recovery
php
Copy
// File: app/Services/Undo/UndoWindowService.php

class UndoWindowService
{
    const UNDO_WINDOW_MINUTES = 5;
    
    /**
     * Eksekusi bulk action dengan jendela undo
     */
    public function executeWithUndoWindow(
        string $operationType,
        int $periodeId,
        callable $operation,
        callable $rollback
    ): OperationResult {
        $operationId = Str::uuid();
        
        // Simpan snapshot sebelum operasi
        $snapshot = $this->createSnapshot($operationType, $periodeId);
        
        // Jalankan operasi
        $result = $operation();
        
        // Catat ke undo log
        UndoLog::create([
            'operation_id'   => $operationId,
            'operation_type' => $operationType,
            'periode_id'     => $periodeId,
            'snapshot'       => $snapshot,
            'rollback_callable' => serialize($rollback),
            'expires_at'     => now()->addMinutes(self::UNDO_WINDOW_MINUTES),
            'is_executed'    => false,
        ]);
        
        // Schedule auto-execute setelah window berakhir
        ExecuteDeferredOperation::dispatch($operationId)
            ->delay(now()->addMinutes(self::UNDO_WINDOW_MINUTES));
        
        return new OperationResult(
            success: true,
            operationId: $operationId,
            undoAvailableUntil: now()->addMinutes(self::UNDO_WINDOW_MINUTES)
        );
    }
    
    public function undo(string $operationId): bool
    {
        $log = UndoLog::where('operation_id', $operationId)
            ->where('is_executed', false)
            ->where('expires_at', '>', now())
            ->first();
            
        if (!$log) {
            return false;
        }
        
        $rollback = unserialize($log->rollback_callable);
        $rollback();
        
        $log->update(['is_executed' => true, 'undone_at' => now()]);
        
        return true;
    }
}
3.5 Layer 5 — Anomaly Detection & Alerting
php
Copy
// File: app/Console/Commands/DetectPeriodAnomaly.php

class DetectPeriodAnomaly extends Command
{
    protected $signature = 'anomaly:detect {--notify}';
    
    public function handle()
    {
        $anomalies = [];
        
        // Anomaly 1: Peserta dengan kelompok di periode berbeda
        $crossPeriodPlotting = DB::select("
            SELECT pk.id, pk.periode_id as peserta_period, 
                   kk.periode_id as kelompok_period
            FROM peserta_kkn pk
            JOIN kelompok_kkn kk ON pk.kelompok_id = kk.id
            WHERE pk.periode_id != kk.periode_id
        ");
        
        if (!empty($crossPeriodPlotting)) {
            $anomalies[] = [
                'type' => 'CROSS_PERIOD_PLOTTING',
                'severity' => 'CRITICAL',
                'count' => count($crossPeriodPlotting),
                'samples' => array_slice($crossPeriodPlotting, 0, 5),
            ];
        }
        
        // Anomaly 2: Kelompok tanpa ketua (Kordes)
        $leaderlessGroups = DB::select("
            SELECT kk.id, kk.nama_kelompok, kk.periode_id
            FROM kelompok_kkn kk
            LEFT JOIN peserta_kkn pk ON kk.id = pk.kelompok_id 
                AND pk.role = 'Ketua'
            WHERE pk.id IS NULL
            AND kk.status = 'aktif'
        ");
        
        if (!empty($leaderlessGroups)) {
            $anomalies[] = [
                'type' => 'LEADERLESS_GROUP',
                'severity' => 'WARNING',
                'count' => count($leaderlessGroups),
                'samples' => array_slice($leaderlessGroups, 0, 5),
            ];
        }
        
        // Anomaly 3: DPL ter-assign ke kelompok di periode berbeda
        $crossPeriodDpl = DB::select("
            SELECT dp.id, dp.dpl_id, dp.periode_id as dpl_period,
                   kk.periode_id as kelompok_period
            FROM dpl_periode dp
            JOIN kelompok_kkn kk ON dp.kelompok_id = kk.id
            WHERE dp.periode_id != kk.periode_id
        ");
        
        // Kirim notifikasi jika ada anomaly
        if (!empty($anomalies) && $this->option('notify')) {
            Notification::route('mail', config('kkn.admin_email'))
                ->notify(new AnomalyDetectedNotification($anomalies));
        }
        
        $this->table(['Type', 'Severity', 'Count'], 
            collect($anomalies)->map(fn($a) => [
                $a['type'], $a['severity'], $a['count']
            ])->toArray()
        );
        
        return count($anomalies) > 0 ? 1 : 0;
    }
}
Cron Schedule:
php
Copy
// File: routes/console.php

Schedule::command('anomaly:detect --notify')
    ->dailyAt('06:00')
    ->timezone('Asia/Jakarta')
    ->onOneServer(); // prevent duplicate run pada multi-server
4. Daftar Tindak Lanjut (Action Items)
Table
No	Item	Prioritas	PIC	Estimasi	Status
1	Implementasi database-level unique constraint & locking untuk overlap protection	🔴 Critical	Backend	2 hari	⬜
2	Refactor konfigurasi_sertifikat ke Template Inheritance Pattern	🔴 Critical	Backend/DBA	3 hari	⬜
3	Implementasi PeriodContextService dengan cryptographic binding	🔴 Critical	Backend	2 hari	⬜
4	Secondary validation untuk Excel import plotting	🔴 Critical	Backend	1 hari	⬜
5	Soft delete isolation & restore validation	🟡 High	Backend	1 hari	⬜
6	Temporal overlap check (rentang tanggal periode)	🟡 High	Backend/DBA	1 hari	⬜
7	UI: PeriodContextBanner dengan color coding	🟡 High	Frontend	1 hari	⬜
8	UI: DestructiveActionConfirmModal dengan type-to-confirm	🟡 High	Frontend	1 hari	⬜
9	Dual authorization untuk finalisasi nilai	🟢 Medium	Backend	2 hari	⬜
10	Undo window untuk bulk operations	🟢 Medium	Backend	2 hari	⬜
11	Anomaly detection cron job	🟢 Medium	Backend	1 hari	⬜
12	Middleware EnforcePeriodIsolation immutable	🟢 Medium	Backend	1 hari	⬜
13	Role differentiation (Admin Pendaftaran vs Admin Plotting)	⚪ Low	Product	3 hari	⬜
14	Dokumentasi & coding standard enforcement	⚪ Low	Tech Lead	Ongoing	⬜
5. Kesimpulan Arsitektural
PRD v3.0 telah menetapkan ** fondasi konseptual yang sangat kuat** untuk isolasi data per periode. Konsep "Kamar" adalah abstraksi domain yang tepat dan mudah dikomunikasikan ke stakeholder non-teknis.
Namun, kekuatan isolasi tidak terletak pada konsep, melainkan pada enforcement. Review ini mengidentifikasi bahwa:
Celah utama berada pada race condition, parameter tampering, dan validasi import — semuanya di lapisan implementasi, bukan konsep.
Design database konfigurasi sertifikat perlu beralih dari partisi flat ke inheritance pattern untuk maintainability jangka panjang.
Human error tidak bisa diatasi hanya dengan UI context switcher; diperlukan defense in depth meliputi visual cues, backend constraints, dual authorization, dan anomaly detection.
Rekomendasi strategis: Alokasikan sprint pertama (2 minggu) untuk menyelesaikan seluruh item 🔴 Critical dan 🟡 High. Item 🟢 Medium dapat diimplementasikan secara paralel pada sprint berikutnya.
Review ini disusun berdasarkan PRD v3.0 dan best practice arsitektur software enterprise. Untuk klarifikasi atau diskusi teknis lebih lanjut, silakan ajukan pertanyaan follow-up.
Dokumen di atas siap untuk disalin ke dalam:
Dokumen internal (Google Docs, Notion, Confluence)
Issue tracker (Jira, Linear, GitHub Projects)
Presentasi stakeholder
Jika Anda membutuhkan format spesifik (Markdown untuk GitHub, LaTeX, atau export ke PDF via script), beritahu saya.