  
  **SISTEM INFORMASI MANAJEMEN KKN**  

Kuliah Kerja Nyata — Universitas

**ARSITEKTUR & PANDUAN TEKNIS**

Laravel 12  ·  Inertia.js (React)  ·  Tailwind CSS v4

Versi  1.0  •  2025

# **1\. Arsitektur Aktor — Roles & Permissions**

Sistem menggunakan library spatie/laravel-permission dengan 4 role utama yang memiliki hirearki akses berbeda. Setiap aktor hanya dapat mengakses fitur sesuai scope-nya kecuali Superadmin yang memiliki **God Mode**.

## **1.1  Diagram Hirarki Role**

|  |  |  |  |
| :---- | :---- | :---- | :---- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## **1.2  Struktur Database — Migrations**

### **Tabel: roles & permissions (via Spatie)**

// database/migrations/2025\_01\_01\_create\_kkn\_users\_table.php  
Schema::create('users', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>string('name');  
    $table-\>string('email')-\>unique();  
    $table-\>string('nim')-\>nullable()-\>unique(); // khusus mahasiswa  
    $table-\>string('nidn')-\>nullable()-\>unique(); // khusus dosen/DPL  
    $table-\>foreignId('faculty\_id')-\>nullable()-\>constrained('faculties');  
    $table-\>foreignId('prodi\_id')-\>nullable()-\>constrained('prodis');  
    $table-\>enum('status', \['active','inactive','pending'\])-\>default('pending');  
    $table-\>timestamp('email\_verified\_at')-\>nullable();  
    $table-\>string('password');  
    $table-\>timestamps();  
    $table-\>softDeletes();  
});

### **Tabel: Master Data Lokasi**

Schema::create('lokasis', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>string('provinsi');  
    $table-\>string('kabupaten');  
    $table-\>string('kecamatan');  
    $table-\>string('desa');  
    $table-\>string('kode\_pos', 10)-\>nullable();  
    $table-\>text('koordinat\_gps')-\>nullable(); // JSON lat,lng  
    $table-\>foreignId('mitra\_id')-\>nullable()-\>constrained('users'); // Kepala Desa  
    $table-\>timestamps();  
});

### **Tabel: Periode KKN**

Schema::create('periode\_kkns', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>string('nama'); // e.g. 'KKN Reguler 2025/1'  
    $table-\>date('tanggal\_buka\_pendaftaran');  
    $table-\>date('tanggal\_tutup\_pendaftaran');  
    $table-\>date('tanggal\_mulai\_kkn');  
    $table-\>date('tanggal\_selesai\_kkn');  
    $table-\>enum('status',\['draft','open','running','closed','finalized'\])  
           \-\>default('draft');  
    $table-\>integer('kuota\_per\_kelompok')-\>default(10);  
    $table-\>timestamps();  
});

### **Tabel: Kelompok KKN**

Schema::create('kelompoks', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>foreignId('periode\_id')-\>constrained('periode\_kkns')-\>cascadeOnDelete();  
    $table-\>foreignId('lokasi\_id')-\>constrained('lokasis');  
    $table-\>foreignId('dpl\_id')-\>constrained('users'); // role DPL  
    $table-\>string('kode\_kelompok')-\>unique(); // e.g. 'KKN-2025-001'  
    $table-\>string('nama\_kelompok')-\>nullable();  
    $table-\>timestamps();  
});

Schema::create('kelompok\_mahasiswas', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>foreignId('kelompok\_id')-\>constrained('kelompoks')-\>cascadeOnDelete();  
    $table-\>foreignId('mahasiswa\_id')-\>constrained('users');  
    $table-\>enum('jabatan',\['koordinator','sekretaris','bendahara','anggota'\])  
           \-\>default('anggota');  
    $table-\>timestamps();  
    $table-\>unique(\['kelompok\_id','mahasiswa\_id'\]);  
});

# **2\. Multi-Tier Grading Logic — Penilaian Berjenjang**

## **2.1  Skema Bobot Penilaian**

|  |  |  |  |  |
| :---- | :---- | :---- | :---- | :---- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

## **2.2  Migrations — Tabel Penilaian**

Schema::create('penilaians', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>foreignId('mahasiswa\_id')-\>constrained('users');  
    $table-\>foreignId('periode\_id')-\>constrained('periode\_kkns');

    // Komponen A — DPL (50%)  
    $table-\>decimal('nilai\_laporan\_final', 5, 2)-\>nullable();  // maks 100  
    $table-\>decimal('nilai\_proker', 5, 2)-\>nullable();  
    $table-\>decimal('nilai\_artikel', 5, 2)-\>nullable();  
    $table-\>foreignId('dinilai\_dpl\_id')-\>nullable()-\>constrained('users');  
    $table-\>timestamp('dpl\_submitted\_at')-\>nullable();

    // Komponen B — Mitra (30%)  
    $table-\>decimal('nilai\_sikap', 5, 2)-\>nullable();  
    $table-\>decimal('nilai\_kedisiplinan', 5, 2)-\>nullable();  
    $table-\>foreignId('dinilai\_mitra\_id')-\>nullable()-\>constrained('users');  
    $table-\>timestamp('mitra\_submitted\_at')-\>nullable();

    // Komponen C — LPPM (20%)  
    $table-\>decimal('nilai\_workshop', 5, 2)-\>nullable();  
    $table-\>decimal('nilai\_administrasi', 5, 2)-\>nullable();  
    $table-\>foreignId('dinilai\_admin\_id')-\>nullable()-\>constrained('users');  
    $table-\>timestamp('admin\_submitted\_at')-\>nullable();

    // Output kalkulasi (di-cache, di-recalculate tiap update)  
    $table-\>decimal('nilai\_akhir', 5, 2)-\>nullable()-\>storedAs(  
        // MySQL generated column — otomatis kalkulasi  
        '(COALESCE(nilai\_laporan\_final,0)\*0.30 \+ COALESCE(nilai\_proker,0)\*0.40 \+ COALESCE(nilai\_artikel,0)\*0.30) \* 0.50 \+  
         (COALESCE(nilai\_sikap,0)\*0.50 \+ COALESCE(nilai\_kedisiplinan,0)\*0.50) \* 0.30 \+  
         (COALESCE(nilai\_workshop,0)\*0.50 \+ COALESCE(nilai\_administrasi,0)\*0.50) \* 0.20'  
    );  
    $table-\>string('huruf', 3)-\>virtualAs(  
        "CASE  
          WHEN nilai\_akhir \>= 85 THEN 'A'  
          WHEN nilai\_akhir \>= 80 THEN 'A-'  
          WHEN nilai\_akhir \>= 75 THEN 'B+'  
          WHEN nilai\_akhir \>= 70 THEN 'B'  
          WHEN nilai\_akhir \>= 65 THEN 'B-'  
          WHEN nilai\_akhir \>= 60 THEN 'C+'  
          WHEN nilai\_akhir \>= 55 THEN 'C'  
          ELSE 'D' END"  
    );  
    $table-\>boolean('is\_finalized')-\>default(false);  
    $table-\>timestamps();  
    $table-\>unique(\['mahasiswa\_id','periode\_id'\]);  
});

## **2.3  Service Class — GradingService.php**

\<?php  
// app/Services/GradingService.php  
namespace App\\Services;

use App\\Models\\Penilaian;  
use App\\Events\\NilaiFinalized;  
use Illuminate\\Support\\Facades\\DB;

class GradingService  
{  
    private const WEIGHTS \= \[  
        'komponen\_a' \=\> 0.50,  
        'komponen\_b' \=\> 0.30,  
        'komponen\_c' \=\> 0.20,  
    \];

    private const SUB\_WEIGHTS\_A \= \['laporan' \=\> 0.30, 'proker' \=\> 0.40, 'artikel' \=\> 0.30\];  
    private const SUB\_WEIGHTS\_B \= \['sikap' \=\> 0.50, 'kedisiplinan' \=\> 0.50\];  
    private const SUB\_WEIGHTS\_C \= \['workshop' \=\> 0.50, 'administrasi' \=\> 0.50\];

    public function recalculate(Penilaian $p): array  
    {  
        $a \= ($p-\>nilai\_laporan\_final \* self::SUB\_WEIGHTS\_A\['laporan'\]  
            \+ $p-\>nilai\_proker        \* self::SUB\_WEIGHTS\_A\['proker'\]  
            \+ $p-\>nilai\_artikel       \* self::SUB\_WEIGHTS\_A\['artikel'\]  
        ) \* self::WEIGHTS\['komponen\_a'\];

        $b \= ($p-\>nilai\_sikap        \* self::SUB\_WEIGHTS\_B\['sikap'\]  
            \+ $p-\>nilai\_kedisiplinan  \* self::SUB\_WEIGHTS\_B\['kedisiplinan'\]  
        ) \* self::WEIGHTS\['komponen\_b'\];

        $c \= ($p-\>nilai\_workshop     \* self::SUB\_WEIGHTS\_C\['workshop'\]  
            \+ $p-\>nilai\_administrasi  \* self::SUB\_WEIGHTS\_C\['administrasi'\]  
        ) \* self::WEIGHTS\['komponen\_c'\];

        return \[  
            'nilai\_akhir' \=\> round($a \+ $b \+ $c, 2),  
            'huruf'       \=\> $this-\>toGrade($a \+ $b \+ $c),  
            'breakdown'   \=\> compact('a', 'b', 'c'),  
        \];  
    }

    public function finalizeAll(int $periodeId): int  
    {  
        return DB::transaction(function () use ($periodeId) {  
            $count \= 0;  
            Penilaian::where('periode\_id', $periodeId)  
                \-\>where('is\_finalized', false)  
                \-\>chunk(100, function ($penilaians) use (&$count) {  
                    foreach ($penilaians as $p) {  
                        $p-\>update(\['is\_finalized' \=\> true\]);  
                        event(new NilaiFinalized($p));  
                        $count++;  
                    }  
                });  
            return $count;  
        });  
    }

    private function toGrade(float $nilai): string  
    {  
        return match(true) {  
            $nilai \>= 85 \=\> 'A',  
            $nilai \>= 80 \=\> 'A-',  
            $nilai \>= 75 \=\> 'B+',  
            $nilai \>= 70 \=\> 'B',  
            $nilai \>= 65 \=\> 'B-',  
            $nilai \>= 60 \=\> 'C+',  
            $nilai \>= 55 \=\> 'C',  
            default      \=\> 'D',  
        };  
    }  
}

# **3\. Workflow Dokumentasi & Logbook**

## **3.1  Logbook — Migration & Status Flow**

Schema::create('logbooks', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>foreignId('mahasiswa\_id')-\>constrained('users')-\>cascadeOnDelete();  
    $table-\>foreignId('kelompok\_id')-\>constrained('kelompoks');  
    $table-\>date('tanggal');  
    $table-\>time('jam\_mulai');  
    $table-\>time('jam\_selesai');  
    $table-\>text('deskripsi\_kegiatan');  
    $table-\>json('foto\_kegiatan')-\>nullable(); // array of storage paths  
    $table-\>integer('jumlah\_jam')-\>storedAs('TIMESTAMPDIFF(HOUR, jam\_mulai, jam\_selesai)');  
    $table-\>enum('status',\['pending','approved','revision'\])-\>default('pending');  
    $table-\>text('catatan\_dpl')-\>nullable(); // feedback jika revision  
    $table-\>foreignId('verified\_by')-\>nullable()-\>constrained('users'); // DPL  
    $table-\>timestamp('verified\_at')-\>nullable();  
    $table-\>timestamps();  
});

## **3.2  State Machine — LogbookService.php**

class LogbookService  
{  
    private const TRANSITIONS \= \[  
        'pending'  \=\> \['approved', 'revision'\],  
        'revision' \=\> \['pending'\],   // mahasiswa resubmit \-\> pending lagi  
        'approved' \=\> \[\],            // terminal state  
    \];

    public function transition(Logbook $lb, string $to, User $actor, ?string $note=null): bool  
    {  
        if (\!in\_array($to, self::TRANSITIONS\[$lb-\>status\] ?? \[\])) {  
            throw new InvalidTransitionException("Cannot go {$lb-\>status} \-\> {$to}");  
        }

        $lb-\>update(\[  
            'status'      \=\> $to,  
            'catatan\_dpl' \=\> $note,  
            'verified\_by' \=\> $actor-\>id,  
            'verified\_at' \=\> now(),  
        \]);

        // Kirim notifikasi ke mahasiswa  
        $lb-\>mahasiswa-\>notify(new LogbookStatusChanged($lb, $to));

        return true;  
    }  
}

## **3.3  Report Management — 7 Jenis Dokumen**

|  |  |  |  |  |
| :---- | :---- | :---- | :---- | :---- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

## **3.4  Migration — Tabel Dokumen**

Schema::create('dokumen\_kkns', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>foreignId('mahasiswa\_id')-\>constrained('users');  
    $table-\>foreignId('kelompok\_id')-\>constrained('kelompoks');  
    $table-\>foreignId('periode\_id')-\>constrained('periode\_kkns');  
    $table-\>enum('jenis\_dokumen', \[  
        'laporan\_aset','video\_dokumentasi','jurnal\_artikel',  
        'laporan\_akhir','foto\_dokumentasi','proker\_final','surat\_mitra'  
    \]);  
    $table-\>string('judul')-\>nullable();  
    $table-\>string('file\_path')-\>nullable();   // storage path  
    $table-\>string('url\_eksternal')-\>nullable(); // for YouTube links  
    $table-\>bigInteger('file\_size')-\>nullable(); // bytes  
    $table-\>string('mime\_type', 100)-\>nullable();  
    $table-\>enum('status',\['draft','submitted','approved','rejected'\])-\>default('draft');  
    $table-\>text('catatan\_reviewer')-\>nullable();  
    $table-\>foreignId('reviewed\_by')-\>nullable()-\>constrained('users');  
    $table-\>timestamp('submitted\_at')-\>nullable();  
    $table-\>timestamp('reviewed\_at')-\>nullable();  
    $table-\>timestamps();  
    $table-\>unique(\['mahasiswa\_id','periode\_id','jenis\_dokumen'\]);  
});

# **4\. Fitur "God Mode" — Gate::before & Audit Log**

## **4.1  Implementasi Gate::before**

Gunakan Gate::before() di AuthServiceProvider untuk memberi Superadmin bypass pada semua permission check. Setiap bypass akan tercatat di tabel audit\_logs.

// app/Providers/AuthServiceProvider.php  
use Illuminate\\Support\\Facades\\Gate;  
use App\\Models\\AuditLog;

class AuthServiceProvider extends ServiceProvider  
{  
    public function boot(): void  
    {  
        Gate::before(function ($user, $ability, $arguments) {  
            if (\!$user-\>hasRole('superadmin')) return null;

            // Catat setiap aksi bypass ke audit\_logs  
            AuditLog::create(\[  
                'user\_id'    \=\> $user-\>id,  
                'action'     \=\> 'GATE\_BYPASS',  
                'ability'    \=\> $ability,  
                'model\_type' \=\> optional($arguments\[0\] ?? null, fn($m) \=\> get\_class($m)),  
                'model\_id'   \=\> optional($arguments\[0\] ?? null, fn($m) \=\> $m-\>id),  
                'ip\_address' \=\> request()-\>ip(),  
                'user\_agent' \=\> request()-\>userAgent(),  
            \]);

            return true; // bypass semua gate  
        });  
    }  
}

## **4.2  Migration — Tabel Audit Log**

Schema::create('audit\_logs', function (Blueprint $table) {  
    $table-\>id();  
    $table-\>foreignId('user\_id')-\>constrained('users');  
    $table-\>string('action', 100);  // CREATE, UPDATE, DELETE, GATE\_BYPASS  
    $table-\>string('ability')-\>nullable();    // gate ability yang di-bypass  
    $table-\>string('model\_type', 100)-\>nullable();  
    $table-\>unsignedBigInteger('model\_id')-\>nullable();  
    $table-\>json('old\_values')-\>nullable();   // before state  
    $table-\>json('new\_values')-\>nullable();   // after state  
    $table-\>string('ip\_address', 45)-\>nullable();  
    $table-\>text('user\_agent')-\>nullable();  
    $table-\>timestamps();  
    $table-\>index(\['user\_id','action','created\_at'\]); // untuk query cepat  
    $table-\>index(\['model\_type','model\_id'\]);          // polymorphic query  
});

## **4.3  Observer — Auto-Audit CRUD Models**

// app/Observers/AuditObserver.php  
class AuditObserver  
{  
    public function created(Model $model): void  { $this-\>log('CREATE', $model); }  
    public function updated(Model $model): void  { $this-\>log('UPDATE', $model); }  
    public function deleted(Model $model): void  { $this-\>log('DELETE', $model); }

    private function log(string $action, Model $model): void  
    {  
        $user \= auth()-\>user();  
        if (\!$user) return;

        AuditLog::create(\[  
            'user\_id'    \=\> $user-\>id,  
            'action'     \=\> $action,  
            'model\_type' \=\> get\_class($model),  
            'model\_id'   \=\> $model-\>getKey(),  
            'old\_values' \=\> $action \=== 'UPDATE' ? $model-\>getOriginal() : null,  
            'new\_values' \=\> $action \!== 'DELETE' ? $model-\>getAttributes() : null,  
            'ip\_address' \=\> request()-\>ip(),  
        \]);  
    }  
}

// Daftarkan di AppServiceProvider:  
// Penilaian::observe(AuditObserver::class);  
// Logbook::observe(AuditObserver::class);

# **5\. Struktur Folder React (Inertia.js) — Modular & Skalabel**

## **5.1  Direktori Lengkap**

resources/js/  
├── app.jsx                         \# Bootstrap Inertia  
├── bootstrap.js  
│  
├── Pages/                          \# Route-level components (Inertia pages)  
│   ├── Auth/  
│   │   ├── Login.jsx  
│   │   └── Register.jsx  
│   ├── Dashboard/  
│   │   ├── SuperadminDashboard.jsx  
│   │   ├── DplDashboard.jsx  
│   │   ├── MahasiswaDashboard.jsx  
│   │   └── MitraDashboard.jsx  
│   ├── Mahasiswa/  
│   │   ├── Registrasi.jsx  
│   │   ├── Kelompok.jsx  
│   │   ├── Logbook/  
│   │   │   ├── Index.jsx  
│   │   │   ├── Create.jsx  
│   │   │   └── Edit.jsx  
│   │   └── Dokumen/  
│   │       ├── Index.jsx  
│   │       └── Upload.jsx  
│   ├── Dpl/  
│   │   ├── Kelompok/  
│   │   │   └── Index.jsx  
│   │   ├── Logbook/  
│   │   │   ├── Verifikasi.jsx  
│   │   │   └── Detail.jsx  
│   │   ├── Proker/  
│   │   │   └── Validasi.jsx  
│   │   └── Penilaian/  
│   │       └── Input.jsx  
│   ├── Mitra/  
│   │   └── Penilaian.jsx  
│   └── Admin/  
│       ├── Periode/  
│       ├── Kelompok/  
│       ├── MasterData/  
│       │   ├── Fakultas.jsx  
│       │   ├── Prodi.jsx  
│       │   └── Lokasi.jsx  
│       ├── Penilaian/  
│       │   └── Finalisasi.jsx  
│       └── AuditLog/  
│           └── Index.jsx  
│  
├── Components/                     \# Reusable UI components  
│   ├── ui/                         \# Base design system  
│   │   ├── Button.jsx  
│   │   ├── Card.jsx  
│   │   ├── GlassCard.jsx           \# Glassmorphism card  
│   │   ├── Badge.jsx  
│   │   ├── Modal.jsx  
│   │   ├── DataTable.jsx  
│   │   ├── StatusBadge.jsx         \# pending/approved/revision  
│   │   └── GradeDisplay.jsx        \# 0-100 \+ huruf  
│   ├── forms/  
│   │   ├── FileUpload.jsx          \# Drag & drop upload  
│   │   ├── InputField.jsx  
│   │   └── RichTextEditor.jsx  
│   ├── charts/  
│   │   ├── GradeDistribution.jsx   \# Recharts bar chart  
│   │   └── ProgressRing.jsx        \# SVG progress ring  
│   └── layout/  
│       ├── AppLayout.jsx           \# Role-aware layout  
│       ├── Sidebar.jsx  
│       ├── Topbar.jsx  
│       └── BreadcrumbNav.jsx  
│  
├── hooks/                          \# Custom React hooks  
│   ├── useAuth.js  
│   ├── useGrade.js                 \# Real-time grade calculator  
│   ├── useLogbook.js  
│   └── usePermission.js  
│  
└── utils/  
    ├── gradeCalculator.js          \# Mirror of GradingService  
    ├── formatters.js               \# date, currency, etc.  
    └── constants.js

## **5.2  GlassCard Component — Glassmorphism**

// resources/js/Components/ui/GlassCard.jsx  
export default function GlassCard({ children, className \= '', gradient \= 'from-blue-500/10' }) {  
  return (  
    \<div className={\`  
      relative overflow-hidden rounded-2xl  
      bg-white/10 backdrop-blur-xl backdrop-saturate-150  
      border border-white/20 shadow-\[0\_8px\_32px\_rgba(0,0,0,0.12)\]  
      bg-gradient-to-br ${gradient} to-transparent  
      hover:shadow-\[0\_12px\_40px\_rgba(0,0,0,0.18)\]  
      transition-all duration-300 ${className}  
    \`}\>  
      {children}  
    \</div\>  
  );  
}

## **5.3  useGrade Hook — Real-time Calculator**

// resources/js/hooks/useGrade.js  
export function useGrade(penilaian) {  
  return useMemo(() \=\> {  
    const a \= ((penilaian.nilai\_laporan\_final ?? 0\) \* 0.30  
             \+ (penilaian.nilai\_proker ?? 0\)        \* 0.40  
             \+ (penilaian.nilai\_artikel ?? 0\)       \* 0.30) \* 0.50;  
    const b \= ((penilaian.nilai\_sikap ?? 0\)         \* 0.50  
             \+ (penilaian.nilai\_kedisiplinan ?? 0\)  \* 0.50) \* 0.30;  
    const c \= ((penilaian.nilai\_workshop ?? 0\)      \* 0.50  
             \+ (penilaian.nilai\_administrasi ?? 0\)  \* 0.50) \* 0.20;  
    const total \= parseFloat((a \+ b \+ c).toFixed(2));  
    return { total, huruf: toGrade(total), breakdown: { a, b, c } };  
  }, \[penilaian\]);  
}

# **6\. UI/UX — Dashboard Glassmorphism (Premium)**

## **6.1  Komponen Stats Card**

// StatsCard.jsx — Dashboard stat widget  
import { TrendingUp } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, color='blue' }) {  
  const gradients \= {  
    blue:   'from-blue-600 to-blue-400',  
    teal:   'from-teal-600 to-emerald-400',  
    violet: 'from-violet-600 to-purple-400',  
    amber:  'from-amber-500 to-yellow-400',  
  };

  return (  
    \<div className='relative overflow-hidden rounded-2xl p-6 text-white  
      bg-gradient-to-br shadow-xl'\>  
      \<div className={\`absolute inset-0 bg-gradient-to-br ${gradients\[color\]}\`} /\>  
      \<div className='relative z-10 flex justify-between items-start'\>  
        \<div\>  
          \<p className='text-white/70 text-sm font-medium'\>{title}\</p\>  
          \<p className='text-4xl font-bold mt-1'\>{value}\</p\>  
          {trend && (  
            \<p className='text-white/80 text-xs mt-2 flex items-center gap-1'\>  
              \<TrendingUp size={12} /\> {trend}  
            \</p\>  
          )}  
        \</div\>  
        \<div className='bg-white/20 p-3 rounded-xl backdrop-blur-sm'\>  
          \<Icon size={24} className='text-white' /\>  
        \</div\>  
      \</div\>  
      \<div className='absolute \-bottom-4 \-right-4 w-24 h-24 rounded-full  
        bg-white/10 blur-2xl' /\>  
    \</div\>  
  );  
}

## **6.2  Lucide Icons — Mapping per Fitur**

|  |  |  |  |
| :---- | :---- | :---- | :---- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## **6.3  Tailwind Config — Custom Design Tokens**

// tailwind.config.js  
module.exports \= {  
  theme: {  
    extend: {  
      colors: {  
        kkn: {  
          primary:  '\#1E40AF',  
          secondary:'\#0F766E',  
          accent:   '\#7C3AED',  
          surface:  'rgba(255,255,255,0.08)',  
        }  
      },  
      backdropBlur: { xl: '20px', '2xl': '40px' },  
      boxShadow: {  
        glass: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)',  
        'glass-lg': '0 16px 48px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',  
      },  
    }  
  }  
}

# **7\. Checklist Migration & Deployment**

## **7.1  Urutan Migration (Dependency Order)**

|  |  |  |  |
| :---- | :---- | :---- | :---- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## **7.2  Composer & NPM Dependencies**

\# Backend  
composer require spatie/laravel-permission  
composer require spatie/laravel-medialibrary     \# file storage dengan konversi  
composer require barryvdh/laravel-dompdf         \# export PDF transkrip nilai  
composer require maatwebsite/excel               \# export Excel rekap penilaian

\# Frontend  
npm install @inertiajs/react @inertiajs/react  
npm install lucide-react  
npm install recharts                             \# charts dashboard  
npm install @tanstack/react-table               \# DataTable canggih  
npm install react-hook-form @hookform/resolvers  \# form validation  
npm install zod                                  \# schema validation  
npm install framer-motion                        \# animations  
npm install @headlessui/react                    \# accessible modals/dropdowns

*— Dokumen ini dibuat secara otomatis —*

Sistem Manajemen KKN · Laravel 12 \+ Inertia.js (React) \+ Tailwind CSS