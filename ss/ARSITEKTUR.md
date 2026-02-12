# ARSITEKTUR SISTEM INFIATIN

## OVERVIEW
Sistem terintegrasi dengan 1 database master PostgreSQL, 1 Python service untuk import Excel, dan 3 aplikasi Laravel terpisah.

## TECH STACK
- **Framework Web:** Laravel 11.x
- **Import Service:** Python 3.11+ (Flask/FastAPI)
- **Database:** PostgreSQL 16
- **Server:** Ubuntu (master.infiatin.cloud)
- **PHP Version:** 8.2+
- **Python Libraries:** pandas, openpyxl, psycopg2, flask/fastapi

## ARSITEKTUR DIAGRAM
```
┌─────────────────────────────────────────────────────────────┐
│          SERVER: master.infiatin.cloud (Ubuntu)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  PostgreSQL Server (:5432)                       │      │
│  ├──────────────────────────────────────────────────┤      │
│  │  📊 master_db   (Data lengkap dosen & mahasiswa) │      │
│  │  📊 kkn_db      (Subset + data KKN)              │      │
│  │  📊 esppd_db    (Subset + data ESPPD)            │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Master DB System (:3000)                        │      │
│  ├──────────────────────────────────────────────────┤      │
│  │  🌐 Laravel App (UI/UX + API)                    │      │
│  │     ├── Superadmin Dashboard                     │      │
│  │     ├── CRUD Dosen & Mahasiswa                   │      │
│  │     ├── Upload Excel → Python Service            │      │
│  │     └── API Endpoints for KKN/ESPPD              │      │
│  │                                                   │      │
│  │  🐍 Python Import Service (:5000)                │      │
│  │     ├── Excel Reader (pandas)                    │      │
│  │     ├── Data Validator                           │      │
│  │     ├── Data Cleaner                             │      │
│  │     └── DB Inserter (PostgreSQL)                 │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  KKN System (:3001)                              │      │
│  │  🌐 Laravel App - kkn.infiatin.cloud             │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │  ESPPD System (:3002)                            │      │
│  │  🌐 Laravel App - esppd.infiatin.cloud           │      │
│  │                   laporan-esppd.infiatin.cloud   │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## DATABASE STRUCTURE

### 📊 master_db (Source of Truth)
**Owner:** admin_master  
**Purpose:** Data lengkap dosen & mahasiswa (single source of truth)

**Tables:**
```sql
-- Dosen (Data Lengkap)
CREATE TABLE dosen (
    id SERIAL PRIMARY KEY,
    nip VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telepon VARCHAR(20),
    alamat TEXT,
    no_rekening VARCHAR(50),
    nama_bank VARCHAR(100),
    jabatan VARCHAR(100),
    prodi VARCHAR(100),
    status VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Mahasiswa (Data Lengkap)
CREATE TABLE mahasiswa (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telepon VARCHAR(20),
    alamat TEXT,
    prodi VARCHAR(100),
    angkatan VARCHAR(10),
    status VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Import Logs
CREATE TABLE import_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    type VARCHAR(50), -- 'dosen' atau 'mahasiswa'
    total_rows INT,
    success_rows INT,
    failed_rows INT,
    error_details JSONB,
    imported_by VARCHAR(100),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📊 kkn_db
**Owner:** kkn_user  
**Purpose:** Data KKN dengan subset data dosen & mahasiswa

**Tables:**
```sql
-- Dosen (Subset - Synced from master_db)
CREATE TABLE dosen (
    id INT PRIMARY KEY, -- sama dengan id di master_db
    nip VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    synced_at TIMESTAMP
);

-- Mahasiswa (Subset - Synced from master_db)
CREATE TABLE mahasiswa (
    id INT PRIMARY KEY,
    nim VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    prodi VARCHAR(100),
    synced_at TIMESTAMP
);

-- Kelompok KKN
CREATE TABLE kelompok_kkn (
    id SERIAL PRIMARY KEY,
    nama_kelompok VARCHAR(255) NOT NULL,
    dpl_id INT REFERENCES dosen(id),
    lokasi VARCHAR(255),
    periode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Peserta KKN
CREATE TABLE peserta_kkn (
    id SERIAL PRIMARY KEY,
    kelompok_id INT REFERENCES kelompok_kkn(id),
    mahasiswa_id INT REFERENCES mahasiswa(id),
    status VARCHAR(50) DEFAULT 'terdaftar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kegiatan KKN
CREATE TABLE kegiatan_kkn (
    id SERIAL PRIMARY KEY,
    kelompok_id INT REFERENCES kelompok_kkn(id),
    tanggal DATE,
    kegiatan TEXT,
    dokumentasi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📊 esppd_db
**Owner:** esppd_user  
**Purpose:** Data ESPPD & Laporan dengan subset data dosen

**Tables:**
```sql
-- Dosen (Subset - Synced from master_db)
CREATE TABLE dosen (
    id INT PRIMARY KEY,
    nip VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    no_rekening VARCHAR(50),
    nama_bank VARCHAR(100),
    synced_at TIMESTAMP
);

-- SPPD
CREATE TABLE sppd (
    id SERIAL PRIMARY KEY,
    nomor_sppd VARCHAR(100) UNIQUE NOT NULL,
    dosen_id INT REFERENCES dosen(id),
    tujuan VARCHAR(255),
    keperluan TEXT,
    tanggal_berangkat DATE,
    tanggal_kembali DATE,
    transport VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Laporan SPPD
CREATE TABLE laporan_sppd (
    id SERIAL PRIMARY KEY,
    sppd_id INT REFERENCES sppd(id),
    file_laporan VARCHAR(255),
    ringkasan TEXT,
    status_verifikasi VARCHAR(50) DEFAULT 'pending',
    verified_by INT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dokumen SPPD
CREATE TABLE dokumen_sppd (
    id SERIAL PRIMARY KEY,
    sppd_id INT REFERENCES sppd(id),
    jenis_dokumen VARCHAR(100), -- 'surat_tugas', 'kwitansi', dll
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## DATABASE USERS & PERMISSIONS
```sql
-- 1. Master Admin (full access ke master_db)
CREATE USER admin_master WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE master_db TO admin_master;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_master;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_master;

-- 2. KKN User
CREATE USER kkn_user WITH PASSWORD 'strong_password_here';
-- Read only ke master_db
GRANT CONNECT ON DATABASE master_db TO kkn_user;
GRANT SELECT ON master_db.dosen, master_db.mahasiswa TO kkn_user;
-- Full access ke kkn_db
GRANT ALL PRIVILEGES ON DATABASE kkn_db TO kkn_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kkn_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kkn_user;

-- 3. ESPPD User
CREATE USER esppd_user WITH PASSWORD 'strong_password_here';
-- Read only ke master_db
GRANT CONNECT ON DATABASE master_db TO esppd_user;
GRANT SELECT ON master_db.dosen, master_db.mahasiswa TO esppd_user;
-- Full access ke esppd_db
GRANT ALL PRIVILEGES ON DATABASE esppd_db TO esppd_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO esppd_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO esppd_user;
```

## PROJECTS DETAIL

### 1️⃣ Master DB System
**Folder:** `master-db-api/`  
**URL:** master.infiatin.cloud  
**Port:** 3000 (Laravel), 5000 (Python)

**Struktur:**
```
master-db-api/
├── laravel-app/              ← Laravel UI/UX & API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── SuperadminController.php
│   │   │   ├── DosenController.php
│   │   │   ├── MahasiswaController.php
│   │   │   └── Api/SyncController.php
│   │   ├── Models/
│   │   │   ├── Dosen.php
│   │   │   ├── Mahasiswa.php
│   │   │   └── ImportLog.php
│   │   └── Services/
│   │       └── PythonImportService.php
│   ├── resources/views/
│   │   ├── dashboard.blade.php
│   │   ├── dosen/
│   │   └── mahasiswa/
│   ├── routes/
│   │   ├── web.php
│   │   └── api.php
│   └── .env
│
└── python-import-service/    ← Python Excel Processor
    ├── app.py                ← Flask/FastAPI main
    ├── services/
    │   ├── excel_reader.py   ← Pandas Excel reader
    │   ├── validator.py      ← Data validation
    │   ├── cleaner.py        ← Data cleaning
    │   └── db_inserter.py    ← PostgreSQL inserter
    ├── templates/
    │   ├── template_dosen.xlsx
    │   └── template_mahasiswa.xlsx
    ├── requirements.txt
    ├── config.py
    └── .env
```

**Database Connection:**
```php
// Laravel: config/database.php
'master' => [
    'driver' => 'pgsql',
    'host' => 'master.infiatin.cloud',
    'database' => 'master_db',
    'username' => 'admin_master',
    'password' => env('DB_MASTER_PASSWORD'),
]
```
```python
# Python: config.py
DATABASE = {
    'host': 'master.infiatin.cloud',
    'database': 'master_db',
    'user': 'admin_master',
    'password': os.getenv('DB_PASSWORD')
}
```

**Responsibilities:**
- ✅ Superadmin dashboard (login, CRUD)
- ✅ Import Excel via Python service
- ✅ Data validation & cleaning
- ✅ API endpoints untuk sync data ke KKN/ESPPD
- ✅ Logging semua import activities

### 2️⃣ KKN System
**Folder:** `kkn/`  
**URL:** kkn.infiatin.cloud  
**Port:** 3001

**Database Connections:**
```php
// config/database.php
'connections' => [
    'master' => [  // READ ONLY
        'driver' => 'pgsql',
        'host' => 'master.infiatin.cloud',
        'database' => 'master_db',
        'username' => 'kkn_user',
    ],
    'kkn' => [     // FULL ACCESS (default)
        'driver' => 'pgsql',
        'host' => 'master.infiatin.cloud',
        'database' => 'kkn_db',
        'username' => 'kkn_user',
    ],
]
```

**Main Models:**
```php
// Read dari master_db
namespace App\Models\Master;
class Dosen extends Model {
    protected $connection = 'master';
    protected $table = 'dosen';
}

// CRUD di kkn_db
namespace App\Models\KKN;
class Dosen extends Model {
    protected $connection = 'kkn';
}
class KelompokKkn extends Model {}
class PesertaKkn extends Model {}
```

**Responsibilities:**
- ✅ Manage kelompok KKN
- ✅ Assign DPL ke kelompok
- ✅ Manage peserta KKN
- ✅ Input kegiatan harian
- ✅ Generate laporan KKN
- ✅ Sync data dosen & mahasiswa dari master_db

### 3️⃣ ESPPD System
**Folder:** `esppd/`  
**URL:** esppd.infiatin.cloud, laporan-esppd.infiatin.cloud  
**Port:** 3002

**Database Connections:**
```php
// config/database.php
'connections' => [
    'master' => [  // READ ONLY
        'driver' => 'pgsql',
        'host' => 'master.infiatin.cloud',
        'database' => 'master_db',
        'username' => 'esppd_user',
    ],
    'esppd' => [   // FULL ACCESS (default)
        'driver' => 'pgsql',
        'host' => 'master.infiatin.cloud',
        'database' => 'esppd_db',
        'username' => 'esppd_user',
    ],
]
```

**Responsibilities:**
- ✅ Pengajuan SPPD
- ✅ Generate surat tugas
- ✅ Manage laporan perjalanan dinas
- ✅ Upload dokumen pendukung
- ✅ Generate laporan keuangan
- ✅ Sync data dosen dari master_db

## DATA SYNC STRATEGY

### Flow Sync Data Master → KKN/ESPPD
```
┌─────────────────┐
│   master_db     │
│  (Data Lengkap) │
└────────┬────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐          ┌─────────────────┐
│     kkn_db      │          │    esppd_db     │
│   (Subset Data) │          │  (Subset Data)  │
└─────────────────┘          └─────────────────┘
```

**Method:** Laravel Scheduled Command (Cron Job)
```php
// app/Console/Commands/SyncMasterData.php
// Run: php artisan sync:master-data

// KKN Project
SELECT id, nip, nama FROM master.dosen
→ UPSERT ke kkn.dosen

// ESPPD Project
SELECT id, nip, nama, no_rekening, nama_bank FROM master.dosen
→ UPSERT ke esppd.dosen
```

**Schedule:**
- **Frequency:** Setiap 1 jam (atau on-demand)
- **Direction:** One-way (master → kkn/esppd)
- **Conflict Resolution:** Master data always wins (UPSERT)

**Cron Setup:**
```bash
# crontab -e
0 * * * * cd /path/to/kkn && php artisan sync:master-data >> /dev/null 2>&1
0 * * * * cd /path/to/esppd && php artisan sync:master-data >> /dev/null 2>&1
```

## EXCEL IMPORT FLOW (Python Service)
```
┌──────────────────────────────────────────────────────────────┐
│ 1. Superadmin Upload Excel via Laravel UI                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Laravel save file → POST ke Python Service (port 5000)   │
│    Endpoint: http://localhost:5000/import/dosen              │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Python Service Process:                                   │
│    ├── Read Excel dengan Pandas                              │
│    ├── Validate:                                             │
│    │   ├── Check required columns                            │
│    │   ├── NIP/NIM unique?                                   │
│    │   ├── Email format valid?                               │
│    │   ├── Telepon format valid?                             │
│    │   ├── Detect duplicates in file                         │
│    │   └── Check existing in database                        │
│    ├── Clean data:                                           │
│    │   ├── Trim whitespaces                                  │
│    │   ├── Uppercase NIP/NIM                                 │
│    │   ├── Format phone numbers                              │
│    │   └── Handle null values                                │
│    └── Insert to master_db (PostgreSQL)                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Python return JSON response:                              │
│    {                                                          │
│      "status": "success",                                     │
│      "total_rows": 150,                                       │
│      "success": 145,                                          │
│      "failed": 5,                                             │
│      "errors": [                                              │
│        {"row": 12, "error": "NIP already exists"},            │
│        {"row": 45, "error": "Invalid email format"}           │
│      ]                                                        │
│    }                                                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Laravel show result di dashboard                          │
│    - Success: 145 dosen imported                             │
│    - Failed: 5 rows (show details)                           │
│    - Save to import_logs table                               │
└──────────────────────────────────────────────────────────────┘
```

### Template Excel Format

**Dosen Template (template_dosen.xlsx):**
| NIP* | Nama* | Email | Telepon | Alamat | No Rekening | Nama Bank | Jabatan | Prodi |
|------|-------|-------|---------|--------|-------------|-----------|---------|-------|
| 199001012020121001 | Dr. Ahmad Zaki | ahmad@univ.ac.id | 081234567890 | Jl. Raya No. 1 | 1234567890 | BRI | Lektor | Teknik Informatika |

*Required fields

**Mahasiswa Template (template_mahasiswa.xlsx):**
| NIM* | Nama* | Email | Telepon | Alamat | Prodi* | Angkatan* |
|------|-------|-------|---------|--------|--------|-----------|
| 2020001 | Budi Santoso | budi@student.ac.id | 081234567890 | Jl. Student 1 | Teknik Informatika | 2020 |

## API ENDPOINTS

### Master DB API (untuk KKN & ESPPD)
```
Base URL: https://master.infiatin.cloud/api

Authentication: Bearer Token

GET    /api/dosen              → List all dosen
GET    /api/dosen/{id}         → Get dosen by ID
GET    /api/dosen/nip/{nip}    → Get dosen by NIP

GET    /api/mahasiswa          → List all mahasiswa
GET    /api/mahasiswa/{id}     → Get mahasiswa by ID
GET    /api/mahasiswa/nim/{nim} → Get mahasiswa by NIM

GET    /api/sync/dosen         → Get dosen for sync (subset columns)
GET    /api/sync/mahasiswa     → Get mahasiswa for sync (subset columns)
```

**Example Response:**
```json
GET /api/sync/dosen
{
  "data": [
    {
      "id": 1,
      "nip": "199001012020121001",
      "nama": "Dr. Ahmad Zaki",
      "no_rekening": "1234567890",
      "nama_bank": "BRI"
    }
  ]
}
```

## CONVENTIONS & BEST PRACTICES

### Naming Conventions
- **Migration:** `YYYY_MM_DD_HHMMSS_create_xxx_table.php`
- **Model:** Singular, PascalCase (`Dosen`, `Mahasiswa`, `KelompokKkn`)
- **Controller:** PascalCase + Controller (`DosenController`, `SyncController`)
- **Route name:** snake_case (`dosen.index`, `sppd.create`)
- **Database tables:** snake_case, lowercase (`kelompok_kkn`, `peserta_kkn`)

### Code Standards
- Gunakan **Soft Deletes** untuk semua table utama
- Semua timestamp dalam format: `Y-m-d H:i:s`
- Validasi input di **FormRequest** Laravel
- Error handling dengan **try-catch**
- Logging semua CRUD operations

### Security
- **Passwords:** Bcrypt/Hash
- **API Token:** Laravel Sanctum
- **SQL Injection:** Eloquent ORM (prepared statements)
- **XSS:** Blade `{{ }}` auto-escape
- **CSRF:** Laravel CSRF token

### Backup Strategy
```bash
# Daily backup master_db (cron)
0 2 * * * pg_dump -h master.infiatin.cloud -U admin_master master_db > /backup/master_db_$(date +\%Y\%m\%d).sql

# Weekly backup kkn_db & esppd_db
0 3 * * 0 pg_dump -h master.infiatin.cloud -U kkn_user kkn_db > /backup/kkn_db_$(date +\%Y\%m\%d).sql
0 3 * * 0 pg_dump -h master.infiatin.cloud -U esppd_user esppd_db > /backup/esppd_db_$(date +\%Y\%m\%d).sql
```

## DEPLOYMENT CHECKLIST

### Initial Setup
- [ ] Install PostgreSQL 16
- [ ] Create databases (master_db, kkn_db, esppd_db)
- [ ] Create users & set permissions
- [ ] Run migrations (master, kkn, esppd)
- [ ] Seed initial data (roles, superadmin)

### Laravel Apps
- [ ] Install dependencies (`composer install`)
- [ ] Configure `.env` (database, app key, dll)
- [ ] Generate app key (`php artisan key:generate`)
- [ ] Run migrations
- [ ] Configure web server (Nginx/Apache)
- [ ] Setup cron jobs for sync

### Python Service
- [ ] Install Python 3.11+
- [ ] Create virtual environment
- [ ] Install requirements (`pip install -r requirements.txt`)
- [ ] Configure `.env`
- [ ] Test import dengan sample Excel
- [ ] Setup as systemd service (auto-start)

### Security
- [ ] Firewall rules (allow only necessary ports)
- [ ] SSL certificates (Let's Encrypt)
- [ ] Database password rotation
- [ ] Regular backups tested

---

**Last Updated:** 2026-02-12  
**Version:** 1.0  
**Maintained by:** [Nama Anda]  
**Contact:** [Email Anda]