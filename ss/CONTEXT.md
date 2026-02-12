# CONTEXT: KKN System

## PROJECT INFO
- **Nama:** Sistem KKN
- **Folder:** kkn/
- **URL:** kkn.infiatin.cloud
- **Port:** 3001
- **Database:** 
  - master_db (READ ONLY)
  - kkn_db (FULL ACCESS)
- **Role:** Manage kegiatan KKN

## DATABASE CONNECTIONS
```php
// config/database.php
'connections' => [
    'master' => [  // READ ONLY - data dosen & mahasiswa
        'driver' => 'pgsql',
        'host' => 'master.infiatin.cloud',
        'database' => 'master_db',
        'username' => 'kkn_user',
        'password' => env('DB_MASTER_PASSWORD'),
    ],
    'kkn' => [     // FULL ACCESS (default connection)
        'driver' => 'pgsql',
        'host' => 'master.infiatin.cloud',
        'database' => 'kkn_db',
        'username' => 'kkn_user',
        'password' => env('DB_KKN_PASSWORD'),
    ],
]
```

## MAIN MODELS

### From Master DB (READ ONLY)
```php
// app/Models/Master/Dosen.php
namespace App\Models\Master;

use Illuminate\Database\Eloquent\Model;

class Dosen extends Model {
    protected $connection = 'master';
    protected $table = 'dosen';
    
    // READ ONLY - jangan insert/update dari sini
}

// app/Models/Master/Mahasiswa.php
namespace App\Models\Master;

class Mahasiswa extends Model {
    protected $connection = 'master';
    protected $table = 'mahasiswa';
}
```

### KKN Specific (FULL ACCESS)
```php
// app/Models/KKN/Dosen.php
namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

class Dosen extends Model {
    protected $connection = 'kkn';  // default
    protected $table = 'dosen';
    protected $fillable = ['id', 'nip', 'nama', 'synced_at'];
    
    // Ini data yang di-sync dari master_db
}

// app/Models/KKN/KelompokKkn.php
namespace App\Models\KKN;

class KelompokKkn extends Model {
    protected $table = 'kelompok_kkn';
    protected $fillable = [
        'nama_kelompok', 'dpl_id', 'lokasi', 'periode'
    ];
    
    public function dpl() {
        return $this->belongsTo(Dosen::class, 'dpl_id');
    }
    
    public function peserta() {
        return $this->hasMany(PesertaKkn::class, 'kelompok_id');
    }
}

// app/Models/KKN/PesertaKkn.php
class PesertaKkn extends Model {
    protected $table = 'peserta_kkn';
    
    public function mahasiswa() {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }
    
    public function kelompok() {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }
}
```

## DATA SYNC COMMAND
```php
// app/Console/Commands/SyncMasterData.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Master\Dosen as MasterDosen;
use App\Models\KKN\Dosen as KknDosen;
use App\Models\Master\Mahasiswa as MasterMahasiswa;
use App\Models\KKN\Mahasiswa as KknMahasiswa;

class SyncMasterData extends Command {
    protected $signature = 'sync:master-data';
    protected $description = 'Sync data dosen & mahasiswa dari master_db';
    
    public function handle() {
        $this->info('Starting sync...');
        
        // Sync Dosen
        $masterDosen = MasterDosen::select('id', 'nip', 'nama')->get();
        foreach ($masterDosen as $dosen) {
            KknDosen::updateOrCreate(
                ['id' => $dosen->id],
                [
                    'nip' => $dosen->nip,
                    'nama' => $dosen->nama,
                    'synced_at' => now()
                ]
            );
        }
        $this->info("Synced {$masterDosen->count()} dosen");
        
        // Sync Mahasiswa
        $masterMahasiswa = MasterMahasiswa::select('id', 'nim', 'nama', 'prodi')->get();
        foreach ($masterMahasiswa as $mhs) {
            KknMahasiswa::updateOrCreate(
                ['id' => $mhs->id],
                [
                    'nim' => $mhs->nim,
                    'nama' => $mhs->nama,
                    'prodi' => $mhs->prodi,
                    'synced_at' => now()
                ]
            );
        }
        $this->info("Synced {$masterMahasiswa->count()} mahasiswa");
        
        $this->info('Sync completed!');
    }
}
```

**Jalankan:**
```bash
php artisan sync:master-data

# Atau jadwalkan di app/Console/Kernel.php
protected function schedule(Schedule $schedule) {
    $schedule->command('sync:master-data')->hourly();
}
```

## MAIN FEATURES

### 1. Kelola Kelompok KKN
- Create kelompok
- Assign DPL (Dosen Pembimbing Lapangan)
- Set lokasi & periode

### 2. Kelola Peserta
- Daftarkan mahasiswa ke kelompok
- Update status peserta
- View peserta per kelompok

### 3. Kegiatan Harian
- Input kegiatan per kelompok
- Upload dokumentasi (foto)
- Generate laporan

## LIHAT JUGA
- Root: ARSITEKTUR.md
- Master DB: ../master-db-api/laravel-app/CONTEXT.md