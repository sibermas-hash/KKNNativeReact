Berikut adalah arsitektur profesional & skalabel standar universitas Indonesia untuk sistem KKN berbasis Laravel 12 + Inertia + React + Tailwind, dirancang mengikuti praktik terbaik enterprise (bukan sekadar CRUD biasa).

Saya susun seperti dokumentasi arsitektur production.

1. ROLE ARCHITECTURE (RBAC ENTERPRISE DESIGN)

Gunakan kombinasi:

Laravel Policies

Laravel Gates

Role table (jangan hardcode)

Permission table (future-proof)

roles table
Schema::create('roles', function (Blueprint $table) {

    $table->id();

    $table->string('name'); 
    // superadmin
    // dpl
    // student
    // village

});

users table
Schema::table('users', function (Blueprint $table){

    $table->foreignId('role_id')->constrained();

});

Role Matrix (Official KKN Workflow)
Role	Access Scope	Authority
Superadmin	Global	Master data, assign group, finalize grades
DPL	Assigned groups	Verify logbook, input grades
Student	Self	Upload reports, logbook
Village	Assigned village	Input behavior grades
Policy Structure
app/Policies/

GroupPolicy.php
LogbookPolicy.php
GradePolicy.php
ReportPolicy.php

Gate::before for GOD MODE

AuthServiceProvider.php

Gate::before(function ($user, $ability) {

    if ($user->role->name === 'superadmin') {

        return true;

    }

});


Superadmin bypasses everything safely.

Audit logging for GOD MODE

Create audit_logs table

Schema::create('audit_logs', function (Blueprint $table){

    $table->id();

    $table->foreignId('user_id');

    $table->string('action');

    $table->string('model_type');

    $table->unsignedBigInteger('model_id');

    $table->timestamps();

});


AuditService

class AuditService {

    public function log($user,$action,$model){

        AuditLog::create([
            'user_id'=>$user->id,
            'action'=>$action,
            'model_type'=>get_class($model),
            'model_id'=>$model->id
        ]);

    }

}

2. DATABASE STRUCTURE (FULL PROFESSIONAL SCHEMA)

Core hierarchy:

Period
 ├ Groups
 │   ├ Students
 │   ├ DPL
 │   └ Village

kkn_periods
Schema::create('kkn_periods', function(Blueprint $table){

    $table->id();

    $table->string('name');

    $table->date('start_date');

    $table->date('end_date');

    $table->boolean('active');

});

villages
Schema::create('villages', function(Blueprint $table){

    $table->id();

    $table->string('name');

    $table->string('district');

});

groups
Schema::create('groups', function(Blueprint $table){

    $table->id();

    $table->foreignId('period_id');

    $table->foreignId('village_id');

    $table->foreignId('dpl_id');

    $table->string('name');

});

group_members
Schema::create('group_members', function(Blueprint $table){

    $table->id();

    $table->foreignId('group_id');

    $table->foreignId('student_id');

});

3. MULTI-TIER GRADING SYSTEM (PRODUCTION DESIGN)

DO NOT store everything in one table.

Split by authority source.

grades_dpl
grades_village
grades_admin
grades_final

grades_dpl
Schema::create('grades_dpl', function(Blueprint $table){

    $table->id();

    $table->foreignId('student_id');

    $table->decimal('final_report',5,2);

    $table->decimal('execution',5,2);

    $table->decimal('article',5,2);

});

grades_village
Schema::create('grades_village', function(Blueprint $table){

    $table->id();

    $table->foreignId('student_id');

    $table->decimal('attitude',5,2);

    $table->decimal('discipline',5,2);

});

grades_admin
Schema::create('grades_admin', function(Blueprint $table){

    $table->id();

    $table->foreignId('student_id');

    $table->decimal('workshop',5,2);

    $table->decimal('administration',5,2);

});

grades_final
Schema::create('grades_final', function(Blueprint $table){

    $table->id();

    $table->foreignId('student_id');

    $table->decimal('score',5,2);

    $table->string('letter');

});

Grade Calculation Service (CRITICAL)
app/Services/GradeService.php

class GradeService {

    public function calculate($studentId)
    {

        $dpl = GradeDpl::whereStudentId($studentId)->first();

        $village = GradeVillage::whereStudentId($studentId)->first();

        $admin = GradeAdmin::whereStudentId($studentId)->first();


        $componentA =
            ($dpl->final_report * 0.30) +
            ($dpl->execution * 0.40) +
            ($dpl->article * 0.30);

        $componentB =
            ($village->attitude * 0.50) +
            ($village->discipline * 0.50);

        $componentC =
            ($admin->workshop * 0.50) +
            ($admin->administration * 0.50);


        $total =
            ($componentA * 0.50) +
            ($componentB * 0.30) +
            ($componentC * 0.20);


        return FinalGrade::updateOrCreate(
            ['student_id'=>$studentId],
            [
                'score'=>$total,
                'letter'=>$this->letter($total)
            ]
        );

    }


    private function letter($score)
    {

        return match(true){

            $score >= 85 => 'A',
            $score >= 80 => 'A-',
            $score >= 75 => 'B+',
            $score >= 70 => 'B',
            $score >= 65 => 'C+',
            $score >= 60 => 'C',
            default => 'D'

        };

    }

}

4. LOGBOOK SYSTEM (ENTERPRISE DESIGN)
logbooks table
Schema::create('logbooks', function(Blueprint $table){

    $table->id();

    $table->foreignId('student_id');

    $table->date('date');

    $table->text('description');

    $table->string('photo_path');

    $table->enum('status',[
        'PENDING',
        'APPROVED',
        'REVISION'
    ]);

});

Logbook approval flow

Student → create → PENDING
DPL → approve → APPROVED
DPL → reject → REVISION

5. REPORT MANAGEMENT SYSTEM
reports table
Schema::create('reports', function(Blueprint $table){

    $table->id();

    $table->foreignId('student_id');

    $table->enum('type',[

        'FINAL_REPORT',
        'ASSET_MAP',
        'VIDEO',
        'ARTICLE',
        'JOURNAL',
        'OUTCOME',
        'OTHER'

    ]);

    $table->string('file');

    $table->enum('status',[
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'REVISION'
    ]);

});

Missing upload tracking query
Report::whereStudentId($id)
->pluck('type');


Compare with required types.

6. CERTIFICATE SYSTEM
workshops
workshop_participants
certificates


certificate generation service

Pdf::loadView('certificate',data)

7. FOLDER STRUCTURE (PRODUCTION GRADE)

Laravel

app/

Models/
Services/
Actions/
Policies/
Repositories/

Http/
    Controllers/

Domain/
    Grade/
    Logbook/
    Report/
    Workshop/


React Structure

resources/js/

Pages/
    Dashboard/
    Logbook/
    Reports/
    Grades/
    Admin/

Components/
    Cards/
    Tables/
    Charts/

Layouts/

8. PREMIUM DASHBOARD DESIGN

Use:

Tailwind
Framer Motion
Lucide
Glassmorphism

Analytics Cards

Students Count
Groups Count
Completion %
Pending Logbook


Example Card

<div className="bg-white/10 backdrop-blur-xl rounded-xl p-6">

    <Users className="w-8 h-8"/>

    <div className="text-3xl font-bold">
        {count}
    </div>

</div>

9. REAL ENTERPRISE FEATURES (RECOMMENDED)

Use these:

Queue
Redis
Observer
Events

Auto grade calculation:

GradeObserver

FINAL ENTERPRISE ARCHITECTURE SUMMARY

Backend

Laravel
Service Layer
Policy Layer
Observer Layer
Repository Layer


Frontend

React
Inertia
Component System
Layout System


Storage

S3


Queue

Redis

RESULT

Architecture ini:

Production-ready
Scalable 10,000+ students
Standar universitas besar
Lebih baik dari Kampelmas

Jika Anda mau, saya bisa lanjutkan dengan:

• ERD lengkap
• full migration files
• full Laravel code
• full React dashboard UI system

---------

Berikut rekomendasi teknis profesional dan skalabel untuk sistem manajemen KKN berbasis Laravel 12, Inertia.js (React), dan Tailwind CSS. Desain ini mengikuti standar universitas Indonesia (seperti pedoman LPPM di berbagai PTN/PTS: peran LPPM sebagai pengelola periode, DPL untuk pembimbingan dan penilaian akademik, mahasiswa untuk logbook/laporan, serta mitra desa untuk penilaian sikap).
Saya fokus pada skalabilitas (modular, reusable), keamanan (RBAC ketat dengan audit), dan performa (computed attributes, services). Gunakan package standar: Spatie Laravel-Permission untuk roles/permissions, Spatie Activity Log untuk audit, dan Laravel Sanctum untuk auth Inertia.
1. Arsitektur Aktor (Roles & Permissions)
Gunakan Spatie Laravel-Permission (best practice 2025-2026 untuk Laravel). Ini mendukung roles, permissions granular, dan multi-guard jika perlu ekspansi.
Roles Utama:

superadmin (LPPM) → God mode.
dpl → Akses kelompok tertentu.
mahasiswa → Akses pribadi/kelompok.
mitra → Akses terbatas ke desa masing-masing.

Setup:

Install: composer require spatie/laravel-permission
Publish & migrate: php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider" && php artisan migrate
Trait di Model User: use HasRoles;
Seeder untuk roles & permissions (contoh):PHPRole::create(['name' => 'superadmin']);
// Permissions granular, misal: 'manage.periods', 'assign.groups', 'view.logbook.all', 'approve.logbook', 'grade.academic', 'grade.non-academic'

Alur Kerja:

Middleware Inertia: Share $user->roles dan $user->can() ke props.
Policies per model (LogbookPolicy, GradePolicy) untuk ownership (misal DPL hanya akses kelompoknya, Mitra hanya mahasiswa di desanya).
Relasi: User belongsTo Kelompok (untuk mahasiswa/DPL), Mitra hasOne Lokasi.

2. Multi-Tier Grading Logic (Penilaian Berjenjang)
Skema ini skalabel dan real-time. Gunakan tabel terpisah untuk setiap komponen, lalu hitung agregat di service.
Struktur Tabel Utama (Migrations):



































TabelKolom UtamaKeterangankkn_periodsid, name, start_date, end_date, is_activePeriode KKNkelompoksid, period_id, kode, lokasi_id, dpl_idKelompokkelompok_membersid, kelompok_id, mahasiswa_idPivot many-to-manygradesid, mahasiswa_id, period_id, component (enum: 'dpl_laporan', 'dpl_proker', 'dpl_artikel', 'mitra_sikap', 'mitra_disiplin', 'lppm_admin'), score (decimal 0-100), graded_by_id, graded_atSemua nilai di satu tabel (polymorphic-friendly)final_gradesid, mahasiswa_id, period_id, score_total (computed), letter_grade, calculated_atCache hasil akhir
Service Class (app/Services/GradeCalculationService.php):
PHPclass GradeCalculationService
{
    public function calculateFinalGrade(User $mahasiswa, KknPeriod $period): float
    {
        $grades = Grade::where('mahasiswa_id', $mahasiswa->id)
                       ->where('period_id', $period->id)
                       ->get()
                       ->groupBy('component');

        $kompA = ($grades['dpl_laporan']->avg('score') ?? 0) * 0.3 +
                 ($grades['dpl_proker']->avg('score') ?? 0) * 0.4 +
                 ($grades['dpl_artikel']->avg('score') ?? 0) * 0.3; // 50%

        $kompB = ($grades['mitra_sikap']->avg('score') ?? 0) * 0.5 +
                 ($grades['mitra_disiplin']->avg('score') ?? 0) * 0.5; // 30%

        $kompC = $grades['lppm_admin']->avg('score') ?? 0; // 20% (kehadiran workshop dll)

        $total = ($kompA * 0.5) + ($kompB * 0.3) + ($kompC * 0.2);

        // Konversi huruf (standar Indonesia)
        $letter = match(true) {
            $total >= 85 => 'A',
            $total >= 80 => 'A-',
            $total >= 75 => 'B+',
            // ... dst
            default => 'E',
        };

        // Simpan ke final_grades (atau gunakan accessor)
        return $total;
    }
}
Panggil service ini di controller atau observer saat ada update grade → real-time via Inertia props.
3. Workflow Dokumentasi & Logbook
Tabel:




















TabelKolom UtamaStatus/Featurelogbooksid, mahasiswa_id, kelompok_id, date, description, photo (json array), status (enum: 'pending','approved','revision'), approved_by_id, feedbackUpload foto + deskripsi hariandocumentsid, mahasiswa_id or kelompok_id, type (enum: 'laporan_aset','video_youtube','jurnal',dst), file_url, status, uploaded_at7 jenis dokumen
Fitur Tracking:

Query: Document::whereNull('file_url')->where('type', 'video_youtube')->get() untuk list "belum upload".
Notification (Laravel Notification) ke mahasiswa/DPL saat revision.

Alur:

Mahasiswa create → status pending.
DPL approve/revision via form Inertia.

4. Fitur "God Mode" bagi Superadmin
Implementasi di app/Providers/AuthServiceProvider.php:
PHPGate::before(function ($user, $ability) {
    if ($user->hasRole('superadmin')) {
        // Log setiap akses "override"
        activity()
           ->performedOn($user)
           ->causedBy($user)
           ->withProperties(['ability' => $ability, 'override' => true])
           ->log('Superadmin override permission');

        return true;
    }
});
Gunakan package spatie/laravel-activitylog untuk audit lengkap (siapa, kapan, apa yang diubah). Ini tetap mencatat meski superadmin bypass policy normal.
5. UI/UX Aesthetics – Dashboard "Wow" dengan Glassmorphism
Gunakan Tailwind CSS + plugin @tailwindcss/aspect-ratio, @headlessui/react untuk komponen accessible, dan Lucide Icons (lucide-react).
Tips Glassmorphism:

Card: bg-white/10 backdrop-blur-md border border-white/20 shadow-xl
Background: Gradient atau image blur.
Komponen premium: Integrasikan shadcn/ui (port ke React + Tailwind) atau Flowbite React.

Contoh inspirasi dashboard premium dengan glassmorphism:
allshadcn.comtailkits.comonyx8agency.comaribudin.gumroad.com



Dashboard superadmin bisa punya card statistik (jumlah kelompok, progres logbook, dll) dengan efek blur + neon accent.
Struktur Folder React (Modular & Skalabel)
Gunakan feature-based structure (best practice Inertia React 2025-2026):
textresources/js/
├── app.jsx                  // Inertia root
├── Components/              // Reusable global
│   ├── Layout/
│   │   ├── DashboardLayout.jsx
│   │   └── AuthLayout.jsx
│   ├── UI/                  // Card, Table, Modal, FormInput (glassmorphism)
│   └── Icons/               // Wrapper Lucide
├── Pages/                   // Inertia Pages (route-based)
│   ├── Auth/
│   ├── Dashboard/
│   │   ├── SuperadminDashboard.jsx
│   │   ├── DplDashboard.jsx
│   │   └── MahasiswaDashboard.jsx
│   ├── Kkn/
│   │   ├── Period/
│   │   ├── Kelompok/
│   │   ├── Logbook/
│   │   ├── Documents/
│   │   └── Grading/
├── Features/                // Modular feature (opsional untuk skalabilitas besar)
│   ├── Logbook/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/ (Zustand jika perlu state global)
└── utils/                   // Helpers, api (Inertia axios wrapper)
Ini memudahkan maintenance saat fitur bertambah (misal modul MBKM integration nanti).
Jika butuh detail kode lebih lanjut (contoh full migration/controller), beri tahu ya! Semoga membantu membangun sistem yang profesional dan sesuai standar universitas. 🚀

--------------

Saya akan membantu merancang sistem KKN yang profesional dan skalabel. Berikut adalah rekomendasi teknis komprehensif untuk setiap aspek yang Anda butuhkan.
1. Arsitektur Aktor & Permissions
Database Schema (Migrations)
php
Copy
// 1. roles table
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique(); // superadmin, dpl, mahasiswa, mitra
    $table->string('display_name');
    $table->text('description')->nullable();
    $table->json('permissions')->nullable(); // cached permissions
    $table->timestamps();
});

// 2. users table (polymorphic untuk semua role)
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->foreignId('role_id')->constrained();
    $table->string('email')->unique();
    $table->string('password');
    $table->string('nama_lengkap');
    $table->string('nomor_telepon');
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_login_at')->nullable();
    $table->timestamps();
});

// 3. dpl_profiles (extend user untuk DPL)
Schema::create('dpl_profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('nip')->unique();
    $table->foreignId('fakultas_id')->constrained();
    $table->foreignId('prodi_id')->constrained();
    $table->string('gelar_depan')->nullable();
    $table->string('gelar_belakang')->nullable();
    $table->timestamps();
});

// 4. mahasiswa_profiles
Schema::create('mahasiswa_profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('nim')->unique();
    $table->foreignId('prodi_id')->constrained();
    $table->integer('semester');
    $table->decimal('ipk', 3, 2);
    $table->foreignId('kelompok_id')->nullable()->constrained();
    $table->enum('status', ['registrasi', 'berkas_review', 'diterima', 'aktif', 'selesai', 'ditolak'])->default('registrasi');
    $table->timestamps();
});

// 5. mitra_profiles (Kepala Desa)
Schema::create('mitra_profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('lokasi_id')->constrained('lokasi_kkn'); // hanya 1 desa
    $table->string('jabatan'); // Kepala Desa, Sekretaris, dll
    $table->string('nomor_sk');
    $table->date('tanggal_sk');
    $table->timestamps();
});

// 6. lokasi_kkn (Master Data Desa)
Schema::create('lokasi_kkn', function (Blueprint $table) {
    $table->id();
    $table->string('nama_desa');
    $table->string('kecamatan');
    $table->string('kabupaten');
    $table->string('provinsi');
    $table->text('alamat_lengkap');
    $table->decimal('latitude', 10, 8)->nullable();
    $table->decimal('longitude', 11, 8)->nullable();
    $table->integer('kuota_mahasiswa')->default(5);
    $table->timestamps();
});

// 7. periode_kkn
Schema::create('periode_kkn', function (Blueprint $table) {
    $table->id();
    $table->string('nama_periode'); // KKN 2024 Genap
    $table->date('tanggal_mulai_registrasi');
    $table->date('tanggal_selesai_registrasi');
    $table->date('tanggal_mulai_kkn');
    $table->date('tanggal_selesai_kkn');
    $table->enum('status', ['draft', 'registrasi', 'berjalan', 'penilaian', 'selesai'])->default('draft');
    $table->timestamps();
});

// 8. kelompok_kkn
Schema::create('kelompok_kkn', function (Blueprint $table) {
    $table->id();
    $table->foreignId('periode_id')->constrained('periode_kkn');
    $table->string('nomor_kelompok')->unique(); // KKN-2024-001
    $table->foreignId('dpl_id')->constrained('dpl_profiles');
    $table->foreignId('lokasi_id')->constrained('lokasi_kkn');
    $table->integer('jumlah_mahasiswa')->default(0);
    $table->timestamps();
});
Spatie Permission Setup (Service Provider)
php
Copy
// config/permission.php sudah terkonfigurasi
// app/Providers/AuthServiceProvider.php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // ...
    ];

    public function boot(): void
    {
        // Superadmin God Mode - bisa akses semua
        Gate::before(function (User $user, string $ability) {
            if ($user->role->name === 'superadmin') {
                // Log audit untuk god mode access
                if (!str_starts_with($ability, 'admin.')) {
                    \App\Services\AuditService::logGodModeAccess($user, $ability);
                }
                return true;
            }
            return null; // continue normal authorization
        });

        // Define granular permissions
        Gate::define('manage-master-data', fn(User $user) => $user->role->name === 'superadmin');
        Gate::define('manage-periode', fn(User $user) => $user->role->name === 'superadmin');
        Gate::define('assign-kelompok', fn(User $user) => $user->role->name === 'superadmin');
        Gate::define('finalisasi-nilai', fn(User $user) => $user->role->name === 'superadmin');
        
        Gate::define('verifikasi-logbook', fn(User $user) => $user->role->name === 'dpl');
        Gate::define('input-nilai-akademik', fn(User $user) => $user->role->name === 'dpl');
        Gate::define('validasi-proker', fn(User $user) => $user->role->name === 'dpl');
        
        Gate::define('input-nilai-mitra', fn(User $user) => $user->role->name === 'mitra');
        Gate::define('lihat-mahasiswa-desa', fn(User $user, $desaId) => 
            $user->role->name === 'mitra' && $user->mitraProfile->lokasi_id === $desaId
        );
    }
}
2. Multi-Tier Grading Logic
Migration untuk Penilaian
php
Copy
// 9. nilai_komponen (tabel induk penilaian)
Schema::create('nilai_komponen', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained('mahasiswa_profiles');
    $table->foreignId('periode_id')->constrained('periode_kkn');
    
    // Komponen A: DPL (50%)
    $table->decimal('dpl_laporan_final', 5, 2)->nullable(); // 30% of 50% = 15% total
    $table->decimal('dpl_proker', 5, 2)->nullable();        // 40% of 50% = 20% total
    $table->decimal('dpl_artikel', 5, 2)->nullable();       // 30% of 50% = 15% total
    
    // Komponen B: Mitra/Desa (30%)
    $table->decimal('mitra_sikap', 5, 2)->nullable();         // 50% of 30% = 15% total
    $table->decimal('mitra_kedisiplinan', 5, 2)->nullable(); // 50% of 30% = 15% total
    
    // Komponen C: Admin/LPPM (20%)
    $table->decimal('admin_kehadiran', 5, 2)->nullable();     // 100% of 20% = 20% total
    
    // Final
    $table->decimal('nilai_akhir', 5, 2)->nullable();
    $table->string('nilai_huruf', 2)->nullable();
    $table->boolean('is_final')->default(false);
    $table->timestamp('finalized_at')->nullable();
    $table->foreignId('finalized_by')->nullable()->constrained('users');
    $table->timestamps();
    
    $table->unique(['mahasiswa_id', 'periode_id']);
});

// 10. nilai_log (audit trail untuk setiap input nilai)
Schema::create('nilai_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('nilai_komponen_id')->constrained();
    $table->string('field_name'); // dpl_laporan_final, mitra_sikap, dll
    $table->decimal('old_value', 5, 2)->nullable();
    $table->decimal('new_value', 5, 2);
    $table->foreignId('changed_by')->constrained('users');
    $table->string('changed_by_role');
    $table->text('keterangan')->nullable();
    $table->timestamp('created_at');
});
Service Class: GradingService
php
Copy
<?php

namespace App\Services;

use App\Models\NilaiKomponen;
use App\Models\MahasiswaProfile;
use Illuminate\Support\Facades\DB;

class GradingService
{
    // Bobot konfigurasi (bisa di-fetch dari database untuk fleksibilitas)
    private const BOBOT = [
        'dpl' => [
            'weight' => 0.50, // 50% dari total
            'components' => [
                'laporan_final' => 0.30, // 30% dari 50% = 15%
                'proker' => 0.40,        // 40% dari 50% = 20%
                'artikel' => 0.30,       // 30% dari 50% = 15%
            ]
        ],
        'mitra' => [
            'weight' => 0.30, // 30% dari total
            'components' => [
                'sikap' => 0.50,      // 50% dari 30% = 15%
                'kedisiplinan' => 0.50, // 50% dari 30% = 15%
            ]
        ],
        'admin' => [
            'weight' => 0.20, // 20% dari total
            'components' => [
                'kehadiran' => 1.00, // 100% dari 20% = 20%
            ]
        ]
    ];

    private const KONVERSI_HURUF = [
        ['min' => 85, 'max' => 100, 'huruf' => 'A', 'bobot' => 4.00],
        ['min' => 80, 'max' => 84.99, 'huruf' => 'A-', 'bobot' => 3.70],
        ['min' => 75, 'max' => 79.99, 'huruf' => 'B+', 'bobot' => 3.30],
        ['min' => 70, 'max' => 74.99, 'huruf' => 'B', 'bobot' => 3.00],
        ['min' => 65, 'max' => 69.99, 'huruf' => 'B-', 'bobot' => 2.70],
        ['min' => 60, 'max' => 64.99, 'huruf' => 'C+', 'bobot' => 2.30],
        ['min' => 55, 'max' => 59.99, 'huruf' => 'C', 'bobot' => 2.00],
        ['min' => 50, 'max' => 54.99, 'huruf' => 'C-', 'bobot' => 1.70],
        ['min' => 40, 'max' => 49.99, 'huruf' => 'D', 'bobot' => 1.00],
        ['min' => 0, 'max' => 39.99, 'huruf' => 'E', 'bobot' => 0.00],
    ];

    /**
     * Input nilai dengan audit trail otomatis
     */
    public function inputNilai(
        int $mahasiswaId,
        string $komponen, // 'dpl', 'mitra', 'admin'
        array $nilaiData,
        int $userId,
        string $keterangan = null
    ): NilaiKomponen {
        return DB::transaction(function () use ($mahasiswaId, $komponen, $nilaiData, $userId, $keterangan) {
            $periode = $this->getActivePeriode();
            
            $nilaiRecord = NilaiKomponen::firstOrCreate([
                'mahasiswa_id' => $mahasiswaId,
                'periode_id' => $periode->id,
            ]);

            // Cek jika sudah final
            if ($nilaiRecord->is_final) {
                throw new \Exception('Nilai sudah final, tidak dapat diubah.');
            }

            $user = \App\Models\User::find($userId);
            $mappingFields = [
                'dpl' => ['laporan_final' => 'dpl_laporan_final', 'proker' => 'dpl_proker', 'artikel' => 'dpl_artikel'],
                'mitra' => ['sikap' => 'mitra_sikap', 'kedisiplinan' => 'mitra_kedisiplinan'],
                'admin' => ['kehadiran' => 'admin_kehadiran'],
            ];

            foreach ($nilaiData as $field => $value) {
                $dbField = $mappingFields[$komponen][$field] ?? null;
                if (!$dbField) continue;

                // Log perubahan
                \App\Models\NilaiLog::create([
                    'nilai_komponen_id' => $nilaiRecord->id,
                    'field_name' => $dbField,
                    'old_value' => $nilaiRecord->$dbField,
                    'new_value' => $value,
                    'changed_by' => $userId,
                    'changed_by_role' => $user->role->name,
                    'keterangan' => $keterangan,
                    'created_at' => now(),
                ]);

                $nilaiRecord->$dbField = $value;
            }

            // Recalculate total
            $nilaiRecord->nilai_akhir = $this->calculateFinalScore($nilaiRecord);
            $nilaiRecord->nilai_huruf = $this->convertToLetter($nilaiRecord->nilai_akhir);
            
            $nilaiRecord->save();

            return $nilaiRecord->fresh();
        });
    }

    /**
     * Kalkulasi nilai akhir real-time
     */
    public function calculateFinalScore(NilaiKomponen $nilai): float
    {
        $total = 0;

        // Komponen DPL (50%)
        if ($nilai->dpl_laporan_final !== null) {
            $total += $nilai->dpl_laporan_final * self::BOBOT['dpl']['components']['laporan_final'] * self::BOBOT['dpl']['weight'];
        }
        if ($nilai->dpl_proker !== null) {
            $total += $nilai->dpl_proker * self::BOBOT['dpl']['components']['proker'] * self::BOBOT['dpl']['weight'];
        }
        if ($nilai->dpl_artikel !== null) {
            $total += $nilai->dpl_artikel * self::BOBOT['dpl']['components']['artikel'] * self::BOBOT['dpl']['weight'];
        }

        // Komponen Mitra (30%)
        if ($nilai->mitra_sikap !== null) {
            $total += $nilai->mitra_sikap * self::BOBOT['mitra']['components']['sikap'] * self::BOBOT['mitra']['weight'];
        }
        if ($nilai->mitra_kedisiplinan !== null) {
            $total += $nilai->mitra_kedisiplinan * self::BOBOT['mitra']['components']['kedisiplinan'] * self::BOBOT['mitra']['weight'];
        }

        // Komponen Admin (20%)
        if ($nilai->admin_kehadiran !== null) {
            $total += $nilai->admin_kehadiran * self::BOBOT['admin']['components']['kehadiran'] * self::BOBOT['admin']['weight'];
        }

        return round($total, 2);
    }

    public function convertToLetter(float $score): string
    {
        foreach (self::KONVERSI_HURUF as $range) {
            if ($score >= $range['min'] && $score <= $range['max']) {
                return $range['huruf'];
            }
        }
        return 'E';
    }

    public function getBobotInfo(): array
    {
        return self::BOBOT;
    }

    public function finalizeNilai(int $mahasiswaId, int $adminId): NilaiKomponen
    {
        $nilai = NilaiKomponen::where('mahasiswa_id', $mahasiswaId)->firstOrFail();
        
        // Validasi semua komponen terisi
        $required = ['dpl_laporan_final', 'dpl_proker', 'dpl_artikel', 'mitra_sikap', 'mitra_kedisiplinan', 'admin_kehadiran'];
        foreach ($required as $field) {
            if ($nilai->$field === null) {
                throw new \Exception("Komponen {$field} belum diisi.");
            }
        }

        $nilai->update([
            'is_final' => true,
            'finalized_at' => now(),
            'finalized_by' => $adminId,
        ]);

        return $nilai;
    }

    private function getActivePeriode()
    {
        return \App\Models\PeriodeKkn::whereIn('status', ['berjalan', 'penilaian'])->firstOrFail();
    }
}
3. Workflow Dokumentasi & Logbook
Migration Logbook & Dokumen
php
Copy
// 11. logbooks
Schema::create('logbooks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained('mahasiswa_profiles');
    $table->date('tanggal_kegiatan');
    $table->text('deskripsi');
    $table->string('foto_kegiatan'); // path ke storage
    $table->string('lokasi_kegiatan')->nullable();
    $table->enum('status', ['pending', 'approved', 'revision'])->default('pending');
    $table->text('catatan_dpl')->nullable(); // catatan revisi
    $table->foreignId('verified_by')->nullable()->constrained('dpl_profiles');
    $table->timestamp('verified_at')->nullable();
    $table->timestamps();
    
    $table->unique(['mahasiswa_id', 'tanggal_kegiatan']); // 1 logbook per hari
});

// 12. dokumen_kkn (Report Management)
Schema::create('dokumen_kkn', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained('mahasiswa_profiles');
    $table->enum('jenis_dokumen', [
        'laporan_aset',
        'video_youtube',
        'jurnal',
        'artikel_ilmiah',
        'dokumentasi_foto',
        'surat_tugas',
        'surat_keterangan_selesai'
    ]);
    $table->string('judul');
    $table->text('deskripsi')->nullable();
    $table->string('file_path')->nullable(); // untuk file lokal
    $table->string('external_url')->nullable(); // untuk YouTube link, dll
    $table->enum('status', ['draft', 'submitted', 'review', 'approved', 'rejected'])->default('draft');
    $table->timestamp('submitted_at')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->text('catatan_reviewer')->nullable();
    $table->timestamps();
});

// 13. tracking_dokumen (untuk dashboard admin)
Schema::create('tracking_dokumen', function (Blueprint $table) {
    $table->id();
    $table->foreignId('periode_id')->constrained('periode_kkn');
    $table->foreignId('kelompok_id')->constrained('kelompok_kkn');
    $table->foreignId('mahasiswa_id')->constrained('mahasiswa_profiles');
    $table->json('status_dokumen'); // {"laporan_aset": true, "video_youtube": false, ...}
    $table->decimal('progress_percentage', 5, 2)->default(0);
    $table->timestamp('last_updated');
    $table->timestamps();
});
Service: LogbookService
php
Copy
<?php

namespace App\Services;

use App\Models\Logbook;
use App\Models\MahasiswaProfile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class LogbookService
{
    public function createLogbook(array $data, int $mahasiswaId): Logbook
    {
        // Cek duplikasi tanggal
        $exists = Logbook::where('mahasiswa_id', $mahasiswaId)
            ->where('tanggal_kegiatan', $data['tanggal_kegiatan'])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'tanggal_kegiatan' => 'Anda sudah mengisi logbook untuk tanggal ini.'
            ]);
        }

        // Handle foto upload
        if (isset($data['foto_kegiatan'])) {
            $path = $data['foto_kegiatan']->store('logbooks/' . $mahasiswaId, 'private');
            $data['foto_kegiatan'] = $path;
        }

        return Logbook::create([
            'mahasiswa_id' => $mahasiswaId,
            'tanggal_kegiatan' => $data['tanggal_kegiatan'],
            'deskripsi' => $data['deskripsi'],
            'foto_kegiatan' => $data['foto_kegiatan'],
            'lokasi_kegiatan' => $data['lokasi_kegiatan'] ?? null,
            'status' => 'pending',
        ]);
    }

    public function verifyLogbook(int $logbookId, int $dplId, string $status, ?string $catatan = null): Logbook
    {
        $logbook = Logbook::findOrFail($logbookId);
        
        // Validasi: DPL hanya bisa verify logbook mahasiswa bimbingannya
        $mahasiswa = MahasiswaProfile::find($logbook->mahasiswa_id);
        if ($mahasiswa->kelompok->dpl_id !== $dplId) {
            abort(403, 'Bukan mahasiswa bimbingan Anda.');
        }

        $logbook->update([
            'status' => $status,
            'catatan_dpl' => $catatan,
            'verified_by' => $dplId,
            'verified_at' => now(),
        ]);

        return $logbook;
    }

    public function getStatistics(int $mahasiswaId): array
    {
        $total = Logbook::where('mahasiswa_id', $mahasiswaId)->count();
        $approved = Logbook::where('mahasiswa_id', $mahasiswaId)->where('status', 'approved')->count();
        $pending = Logbook::where('mahasiswa_id', $mahasiswaId)->where('status', 'pending')->count();
        $revision = Logbook::where('mahasiswa_id', $mahasiswaId)->where('status', 'revision')->count();

        return [
            'total' => $total,
            'approved' => $approved,
            'pending' => $pending,
            'revision' => $revision,
            'completion_rate' => $total > 0 ? round(($approved / $total) * 100, 2) : 0,
        ];
    }
}
4. God Mode Implementation & Audit
AuditService
php
Copy
<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;

class AuditService
{
    public static function logGodModeAccess(User $user, string $ability): void
    {
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'GOD_MODE_ACCESS',
            'resource' => $ability,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => [
                'url' => request()->url(),
                'method' => request()->method(),
                'reason' => 'Superadmin override via Gate::before',
            ],
            'created_at' => now(),
        ]);
    }

    public static function logCriticalAction(string $action, array $details = []): void
    {
        $user = auth()->user();
        
        AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'resource' => class_basename(debug_backtrace()[1]['class'] ?? 'Unknown'),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => array_merge($details, [
                'input' => request()->except(['password', 'password_confirmation']),
            ]),
            'created_at' => now(),
        ]);
    }
}
Middleware untuk Audit Trail
php
Copy
<?php

namespace App\Http\Middleware;

use Closure;
use App\Services\AuditService;

class CriticalActionAudit
{
    protected $criticalActions = [
        'nilai.finalize',
        'periode.delete',
        'kelompok.force-assign',
        'user.impersonate',
    ];

    public function handle($request, Closure $next)
    {
        $response = $next($request);

        $routeName = $request->route()->getName();
        
        if (in_array($routeName, $this->criticalActions)) {
            AuditService::logCriticalAction($routeName, [
                'route' => $routeName,
                'params' => $request->route()->parameters(),
            ]);
        }

        return $response;
    }
}
5. UI/UX Aesthetics & React Structure
Struktur Folder React (Modular)
plain
Copy
resources/js/
├── Components/
│   ├── UI/                    # Reusable UI components
│   │   ├── GlassCard.jsx      # Glassmorphism card wrapper
│   │   ├── GradientButton.jsx
│   │   ├── StatusBadge.jsx
│   │   └── DataTable.jsx
│   ├── Layout/
│   │   ├── Authenticated.jsx  # Main layout with sidebar
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   └── Icons/
│       └── CustomLucide.jsx
├── Pages/
│   ├── Dashboard/
│   │   ├── Superadmin/        # Role-based folder
│   │   ├── Dpl/
│   │   ├── Mahasiswa/
│   │   └── Mitra/
│   ├── Logbook/
│   ├── Penilaian/
│   └── Dokumen/
├── Hooks/
│   ├── useAuth.js
│   ├── useGrading.js
│   └── useNotification.js
├── Stores/
│   └── gradingStore.js        # Zustand/Jotai for state
├── Lib/
│   ├── utils.js
│   └── constants.js
└── app.jsx
Komponen UI Premium (Glassmorphism)
jsx
Copy
// resources/js/Components/UI/GlassCard.jsx
import React from 'react';
import { cn } from '@/Lib/utils';

export const GlassCard = ({ 
    children, 
    className, 
    variant = 'default',
    hover = true,
    padding = 'normal'
}) => {
    const variants = {
        default: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50',
        primary: 'bg-blue-500/10 dark:bg-blue-900/20 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30',
        success: 'bg-emerald-500/10 dark:bg-emerald-900/20 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30',
        warning: 'bg-amber-500/10 dark:bg-amber-900/20 backdrop-blur-xl border border-amber-200/30 dark:border-amber-700/30',
        danger: 'bg-rose-500/10 dark:bg-rose-900/20 backdrop-blur-xl border border-rose-200/30 dark:border-rose-700/30',
    };

    const paddings = {
        none: '',
        small: 'p-4',
        normal: 'p-6',
        large: 'p-8',
    };

    return (
        <div className={cn(
            'rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20',
            'transition-all duration-300 ease-out',
            hover && 'hover:shadow-xl hover:scale-[1.01] hover:bg-white/80 dark:hover:bg-slate-800/80',
            variants[variant],
            paddings[padding],
            className
        )}>
            {children}
        </div>
    );
};

// resources/js/Components/UI/GradientButton.jsx
export const GradientButton = ({ 
    children, 
    variant = 'primary', 
    size = 'md',
    className,
    ...props 
}) => {
    const variants = {
        primary: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
        success: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',
        danger: 'from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white',
        warning: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
        ghost: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 hover:from-slate-200 hover:to-slate-300',
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3 text-base',
    };

    return (
        <button
            className={cn(
                'relative inline-flex items-center justify-center',
                'font-semibold rounded-xl',
                'bg-gradient-to-r shadow-lg shadow-blue-500/25',
                'transform transition-all duration-200',
                'hover:shadow-xl hover:-translate-y-0.5',
                'active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
Dashboard Component Example
jsx
Copy
// resources/js/Pages/Dashboard/Superadmin/Index.jsx
import React from 'react';
import { Head } from '@inertiajs/react';
import { GlassCard } from '@/Components/UI/GlassCard';
import { GradientButton } from '@/Components/UI/GradientButton';
import { 
    Users, 
    MapPin, 
    GraduationCap, 
    FileCheck,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function SuperadminDashboard({ stats, recentActivities }) {
    const statCards = [
        { 
            title: 'Total Mahasiswa', 
            value: stats.totalMahasiswa, 
            icon: GraduationCap, 
            trend: '+12%',
            variant: 'primary',
            trendUp: true 
        },
        { 
            title: 'Kelompok Aktif', 
            value: stats.totalKelompok, 
            icon: MapPin, 
            trend: '+5%',
            variant: 'success',
            trendUp: true 
        },
        { 
            title: 'DPL Terdaftar', 
            value: stats.totalDpl, 
            icon: Users, 
            trend: '0%',
            variant: 'warning',
            trendUp: false 
        },
        { 
            title: 'Dokumen Terverifikasi', 
            value: stats.dokumenVerified, 
            icon: FileCheck, 
            trend: '+23%',
            variant: 'success',
            trendUp: true 
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <Head title="Dashboard Superadmin" />
            
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            Dashboard LPPM
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Sistem Manajemen KKN Terpadu
                        </p>
                    </div>
                    <GradientButton>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Laporan Akhir Periode
                    </GradientButton>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, idx) => (
                        <GlassCard key={idx} variant={card.variant} className="relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {card.title}
                                    </p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                        {card.value.toLocaleString()}
                                    </p>
                                </div>
                                <div className={`
                                    p-3 rounded-xl
                                    ${card.variant === 'primary' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : ''}
                                    ${card.variant === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : ''}
                                    ${card.variant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' : ''}
                                `}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={card.trendUp ? 'text-emerald-600' : 'text-slate-500'}>
                                    {card.trend}
                                </span>
                                <span className="text-slate-400 ml-2">vs bulan lalu</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <GlassCard className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Progress KKN Real-time
                            </h3>
                            <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-1">
                                <option>Periode 2024 Genap</option>
                            </select>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.chartData}>
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="mahasiswa" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="logbook" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Alerts & Quick Actions */}
                    <div className="space-y-6">
                        <GlassCard variant="danger">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-rose-900 dark:text-rose-100">
                                        Perhatian
                                    </h4>
                                    <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">
                                        12 mahasiswa belum upload dokumen wajib dengan deadline 2 hari lagi.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Aksi Cepat
                            </h3>
                            <div className="space-y-3">
                                <GradientButton variant="ghost" className="w-full justify-start">
                                    <Users className="w-4 h-4 mr-3" />
                                    Assign Kelompok Otomatis
                                </GradientButton>
                                <GradientButton variant="ghost" className="w-full justify-start">
                                    <FileCheck className="w-4 h-4 mr-3" />
                                    Finalisasi Nilai Massal
                                </GradientButton>
                                <GradientButton variant="ghost" className="w-full justify-start">
                                    <MapPin className="w-4 h-4 mr-3" />
                                    Tambah Lokasi Baru
                                </GradientButton>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
Tailwind Config (tailwind.config.js)
JavaScript
Copy
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    900: '#1e3a8a',
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
};
Ringkasan Arsitektur
Table
Copy
Aspek	Implementasi
Autentikasi	Spatie Permission + Laravel Gates
Grading	Service Class dengan audit trail otomatis
File Storage	Laravel Storage (private untuk dokumen)
Real-time	Laravel Echo + Pusher (untuk notifikasi nilai)
UI Framework	React + Inertia + Tailwind
State Management	Zustand untuk grading state
Audit	Middleware + dedicated service
Sistem ini dirancang untuk skalabilitas horizontal (bisa handle ribuan mahasiswa) dengan memperhatikan audit trail lengkap untuk kebutuhan akreditasi universitas.


------------

Kami akan membangun sistem manajemen KKN yang profesional dan skalabel dengan arsitektur berikut:

Arsitektur Aktor (Roles & Permissions):

Superadmin (LPPM)

DPL (Dosen Pembimbing Lapangan)

Mahasiswa

Mitra (Kepala Desa/Lurah)

Multi-Tier Grading Logic:

Komponen A (DPL - 50%)

Komponen B (Desa - 30%)

Komponen C (LPPM/Admin - 20%)

Workflow Dokumentasi & Logbook:

Logbook harian dengan foto dan status (Pending, Approved, Revision)

Report Management untuk 7 jenis dokumen

Fitur "God Mode" bagi Admin:

Menggunakan Gate::before di Laravel untuk akses darurat dengan log audit.

UI/UX Aesthetics:

Dashboard dengan Glassmorphism, Tailwind Cards, dan Lucide Icons.

Mari kita mulai dengan struktur database, Service Class, dan struktur folder React.

1. Arsitektur Aktor (Roles & Permissions)
Kami akan menggunakan package Spatie Laravel Permission untuk manajemen role dan permission. Namun, untuk kesederhanaan, kita akan buat tabel sendiri agar lebih terkontrol.

Migrations:
Tabel users (default Laravel) ditambah beberapa kolom:
php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('username')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
});
Tabel roles:
php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique(); // superadmin, dpl, mahasiswa, mitra
    $table->string('description')->nullable();
    $table->timestamps();
});
Tabel user_roles (many-to-many antara users dan roles):
php
Schema::create('user_roles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('role_id')->constrained()->onDelete('cascade');
    $table->timestamps();
});
Tabel permissions:
php
Schema::create('permissions', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('description')->nullable();
    $table->timestamps();
});
Tabel role_permissions (many-to-many antara roles dan permissions):
php
Schema::create('role_permissions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('role_id')->constrained()->onDelete('cascade');
    $table->foreignId('permission_id')->constrained()->onDelete('cascade');
    $table->timestamps();
});
Tabel periodes (Master data periode KKN):
php
Schema::create('periodes', function (Blueprint $table) {
    $table->id();
    $table->string('tahun');
    $table->string('semester'); // Ganjil/Genap
    $table->date('tanggal_buka');
    $table->date('tanggal_tutup');
    $table->boolean('status')->default(false); // aktif/tidak
    $table->timestamps();
});
Tabel fakultas:
php
Schema::create('fakultas', function (Blueprint $table) {
    $table->id();
    $table->string('kode');
    $table->string('nama');
    $table->timestamps();
});
Tabel prodis:
php
Schema::create('prodis', function (Blueprint $table) {
    $table->id();
    $table->foreignId('fakultas_id')->constrained()->onDelete('cascade');
    $table->string('kode');
    $table->string('nama');
    $table->timestamps();
});
Tabel lokasis (Desa/Kelurahan):
php
Schema::create('lokasis', function (Blueprint $table) {
    $table->id();
    $table->string('kode');
    $table->string('nama_desa');
    $table->string('kecamatan');
    $table->string('kabupaten');
    $table->string('provinsi');
    $table->text('alamat')->nullable();
    $table->string('koordinat')->nullable();
    $table->timestamps();
});
Tabel kelompoks:
php
Schema::create('kelompoks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('periode_id')->constrained()->onDelete('cascade');
    $table->foreignId('lokasi_id')->constrained()->onDelete('cascade');
    $table->string('nama_kelompok');
    $table->integer('jumlah_anggota')->default(0);
    $table->timestamps();
});
Tabel mahasiswas (extend dari user):
php
Schema::create('mahasiswas', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('prodi_id')->constrained()->onDelete('cascade');
    $table->string('nim')->unique();
    $table->string('no_hp')->nullable();
    $table->string('alamat')->nullable();
    $table->timestamps();
});
Tabel dosen (extend dari user):
php
Schema::create('dosens', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('nidn')->unique();
    $table->string('no_hp')->nullable();
    $table->timestamps();
});
Tabel mitras (extend dari user):
php
Schema::create('mitras', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('lokasi_id')->constrained()->onDelete('cascade');
    $table->string('jabatan')->nullable(); // Kepala Desa/Lurah
    $table->string('no_hp')->nullable();
    $table->timestamps();
});
Tabel kelompok_anggota (many-to-many antara kelompok dan mahasiswa):
php
Schema::create('kelompok_anggota', function (Blueprint $table) {
    $table->id();
    $table->foreignId('kelompok_id')->constrained()->onDelete('cascade');
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->timestamps();
});
Tabel dpls (Dosen Pembimbing Lapangan per kelompok):
php
Schema::create('dpls', function (Blueprint $table) {
    $table->id();
    $table->foreignId('kelompok_id')->constrained()->onDelete('cascade');
    $table->foreignId('dosen_id')->constrained()->onDelete('cascade');
    $table->timestamps();
});
2. Multi-Tier Grading Logic
Kami akan membuat tabel terpisah untuk setiap komponen penilaian, kemudian menghitung nilai akhir dengan Service Class.

Tabel nilai_komponen_a (DPL):
php
Schema::create('nilai_komponen_a', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->foreignId('periode_id')->constrained()->onDelete('cascade');
    $table->decimal('laporan_final', 5, 2)->default(0); // 30%
    $table->decimal('proker_eksekusi', 5, 2)->default(0); // 40%
    $table->decimal('artikel_ilmiah', 5, 2)->default(0); // 30%
    $table->decimal('total', 5, 2)->default(0);
    $table->timestamps();
});
Tabel nilai_komponen_b (Desa):
php
Schema::create('nilai_komponen_b', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->foreignId('periode_id')->constrained()->onDelete('cascade');
    $table->decimal('sikap', 5, 2)->default(0); // 50%
    $table->decimal('kedisiplinan', 5, 2)->default(0); // 50%
    $table->decimal('total', 5, 2)->default(0);
    $table->timestamps();
});
Tabel nilai_komponen_c (LPPM):
php
Schema::create('nilai_komponen_c', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->foreignId('periode_id')->constrained()->onDelete('cascade');
    $table->decimal('kehadiran_workshop', 5, 2)->default(0);
    $table->decimal('administrasi', 5, 2)->default(0);
    $table->decimal('total', 5, 2)->default(0);
    $table->timestamps();
});
Tabel nilai_akhir:
php
Schema::create('nilai_akhir', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->foreignId('periode_id')->constrained()->onDelete('cascade');
    $table->decimal('nilai_komponen_a', 5, 2)->default(0); // 50%
    $table->decimal('nilai_komponen_b', 5, 2)->default(0); // 30%
    $table->decimal('nilai_komponen_c', 5, 2)->default(0); // 20%
    $table->decimal('total', 5, 2)->default(0);
    $table->string('huruf', 2)->nullable(); // A, B+, B, C+, C, D, E
    $table->timestamps();
});
Service Class untuk Penilaian:
Kami akan membuat Service Class PenilaianService untuk menghitung nilai.

php
<?php

namespace App\Services;

use App\Models\NilaiAkhir;
use App\Models\NilaiKomponenA;
use App\Models\NilaiKomponenB;
use App\Models\NilaiKomponenC;

class PenilaianService
{
    public function hitungNilaiAkhir($mahasiswaId, $periodeId)
    {
        // Ambil data nilai dari masing-masing komponen
        $nilaiA = NilaiKomponenA::where('mahasiswa_id', $mahasiswaId)
            ->where('periode_id', $periodeId)
            ->first();

        $nilaiB = NilaiKomponenB::where('mahasiswa_id', $mahasiswaId)
            ->where('periode_id', $periodeId)
            ->first();

        $nilaiC = NilaiKomponenC::where('mahasiswa_id', $mahasiswaId)
            ->where('periode_id', $periodeId)
            ->first();

        // Hitung total dengan bobot
        $totalA = $nilaiA ? $nilaiA->total : 0;
        $totalB = $nilaiB ? $nilaiB->total : 0;
        $totalC = $nilaiC ? $nilaiC->total : 0;

        $nilaiAkhir = ($totalA * 0.5) + ($totalB * 0.3) + ($totalC * 0.2);

        // Konversi ke huruf
        $huruf = $this->konversiHuruf($nilaiAkhir);

        // Simpan atau update nilai akhir
        NilaiAkhir::updateOrCreate(
            [
                'mahasiswa_id' => $mahasiswaId,
                'periode_id' => $periodeId,
            ],
            [
                'nilai_komponen_a' => $totalA,
                'nilai_komponen_b' => $totalB,
                'nilai_komponen_c' => $totalC,
                'total' => $nilaiAkhir,
                'huruf' => $huruf,
            ]
        );

        return $nilaiAkhir;
    }

    private function konversiHuruf($nilai)
    {
        if ($nilai >= 85) return 'A';
        if ($nilai >= 80) return 'A-';
        if ($nilai >= 75) return 'B+';
        if ($nilai >= 70) return 'B';
        if ($nilai >= 65) return 'B-';
        if ($nilai >= 60) return 'C+';
        if ($nilai >= 55) return 'C';
        if ($nilai >= 50) return 'C-';
        if ($nilai >= 40) return 'D';
        return 'E';
    }
}
3. Workflow Dokumentasi & Logbook
Tabel logbooks:
php
Schema::create('logbooks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->date('tanggal');
    $table->text('kegiatan');
    $table->string('foto')->nullable();
    $table->enum('status', ['pending', 'approved', 'revision'])->default('pending');
    $table->text('catatan_dpl')->nullable();
    $table->timestamps();
});
Tabel dokumen_kkn (Master data jenis dokumen):
php
Schema::create('dokumen_kkn', function (Blueprint $table) {
    $table->id();
    $table->string('nama'); // Laporan Aset, Video YouTube, Jurnal, dll.
    $table->text('deskripsi')->nullable();
    $table->timestamps();
});
Tabel laporan_akhir (Upload dokumen oleh mahasiswa):
php
Schema::create('laporan_akhir', function (Blueprint $table) {
    $table->id();
    $table->foreignId('mahasiswa_id')->constrained()->onDelete('cascade');
    $table->foreignId('dokumen_kkn_id')->constrained()->onDelete('cascade');
    $table->string('file_path');
    $table->string('original_name');
    $table->enum('status', ['pending', 'verified', 'revision'])->default('pending');
    $table->text('catatan')->nullable();
    $table->timestamps();
});
4. Fitur "God Mode" bagi Admin
Kami akan menggunakan Gate::before di Laravel untuk memberikan akses penuh kepada Superadmin.

Di App\Providers\AuthServiceProvider:

php
use Illuminate\Support\Facades\Gate;

public function boot()
{
    $this->registerPolicies();

    // God Mode untuk Superadmin
    Gate::before(function ($user, $ability) {
        if ($user->hasRole('superadmin')) {
            return true;
        }
    });

    // Definisikan gate lainnya di sini
}
Namun, untuk log audit, kita akan membuat tabel audit_logs:

php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('action'); // create, read, update, delete, dll.
    $table->string('table_name');
    $table->json('old_values')->nullable();
    $table->json('new_values')->nullable();
    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamps();
});
Kemudian, gunakan model observer atau middleware untuk mencatat log. Misalnya, untuk akses darurat, kita bisa membuat middleware AuditLog yang mencatat setiap aksi dari Superadmin.

5. UI/UX Aesthetics
Kami akan menggunakan Tailwind CSS dengan konsep Glassmorphism. Rekomendasi komponen:

Dashboard dengan card glassmorphism (backdrop-blur, bg-white/10)

Gunakan Lucide Icons (https://lucide.dev/icons/)

Warna biru (blue-500) dengan aksen emas (yellow-500) untuk kesan premium.

Contoh card:

html
<div class="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
    <h3 class="text-xl font-semibold text-white">Judul Card</h3>
    <p class="text-gray-200">Isi card</p>
</div>
Struktur Folder React (Inertia.js):
text
resources/js/
├── Components/
│   ├── Layouts/
│   │   ├── AuthenticatedLayout.jsx
│   │   └── GuestLayout.jsx
│   ├── Dashboard/
│   │   ├── CardStat.jsx
│   │   ├── RecentLogbook.jsx
│   │   └── ChartNilai.jsx
│   ├── Logbook/
│   │   ├── LogbookForm.jsx
│   │   ├── LogbookList.jsx
│   │   └── LogbookItem.jsx
│   ├── Penilaian/
│   │   ├── KomponenAForm.jsx
│   │   ├── KomponenBForm.jsx
│   │   └── NilaiAkhirTable.jsx
│   └── UI/
│       ├── Button.jsx
│       ├── Card.jsx
│       └── Modal.jsx
├── Pages/
│   ├── Dashboard/
│   │   ├── Index.jsx (berdasarkan role)
│   │   ├── Superadmin.jsx
│   │   ├── DPL.jsx
│   │   ├── Mahasiswa.jsx
│   │   └── Mitra.jsx
│   ├── Logbook/
│   │   ├── Index.jsx
│   │   └── Show.jsx
│   ├── Penilaian/
│   │   ├── KomponenA.jsx
│   │   ├── KomponenB.jsx
│   │   └── NilaiAkhir.jsx
│   └── Auth/
│       ├── Login.jsx
│       └── Register.jsx
├── Services/
│   ├── api.js
│   └── penilaianService.js
├── Utils/
│   ├── constants.js
│   └── helpers.js
└── app.jsx
Service Class untuk Logbook (contoh):
php
<?php

namespace App\Services;

use App\Models\Logbook;
use Illuminate\Support\Facades\Storage;

class LogbookService
{
    public function createLogbook($data, $mahasiswaId)
    {
        // Upload foto jika ada
        if (isset($data['foto'])) {
            $path = $data['foto']->store('logbooks', 'public');
            $data['foto'] = $path;
        }

        $logbook = Logbook::create([
            'mahasiswa_id' => $mahasiswaId,
            'tanggal' => $data['tanggal'],
            'kegiatan' => $data['kegiatan'],
            'foto' => $data['foto'] ?? null,
            'status' => 'pending',
        ]);

        return $logbook;
    }

    public function approveLogbook($logbookId, $catatan = null)
    {
        $logbook = Logbook::findOrFail($logbookId);
        $logbook->update([
            'status' => 'approved',
            'catatan_dpl' => $catatan,
        ]);

        return $logbook;
    }
}
Kesimpulan:
Sistem ini dirancang dengan arsitektur yang modular dan skalabel. Dengan menggunakan Laravel, Inertia.js, dan Tailwind CSS, kami dapat membangun sistem yang responsif dan mudah dikembangkan. Setiap role memiliki akses dan fungsionalitas yang jelas, dan penilaian dilakukan secara otomatis dengan Service Class. Fitur God Mode untuk Superadmin dilengkapi dengan log audit untuk keamanan.

Selamat mengembangkan sistem KKN!

Saya akan memberikan rekomendasi arsitektur komprehensif untuk sistem manajemen KKN yang profesional dan skalabel.

1. Arsitektur Aktor & Permission Management
Database Schema (Migrations)
php
// database/migrations/xxxx_xx_xx_create_roles_table.php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique(); // superadmin, dpl, mahasiswa, mitra
    $table->string('guard_name')->default('web');
    $table->json('permissions')->nullable();
    $table->timestamps();
});

// database/migrations/xxxx_xx_xx_create_permissions_table.php
Schema::create('permissions', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('group'); // master-data, periode, penilaian, dll
    $table->string('description');
    $table->timestamps();
});

// database/migrations/xxxx_xx_xx_create_users_table.php (Extended)
Schema::table('users', function (Blueprint $table) {
    $table->foreignId('role_id')->constrained()->after('id');
    $table->string('phone')->nullable();
    $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
    $table->json('meta')->nullable(); // Untuk data spesifik role
    $table->softDeletes();
});
Service Class: PermissionService.php
php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    protected $permissionHierarchy = [
        'superadmin' => ['dpl', 'mahasiswa', 'mitra'],
        'dpl' => ['mahasiswa'],
        'mahasiswa' => [],
        'mitra' => []
    ];

    public function assignRoleWithPermissions(User $user, string $role)
    {
        $permissions = $this->getRolePermissions($role);
        $user->syncPermissions($permissions);
        
        Cache::forget("user.{$user->id}.permissions");
    }

    public function canImpersonate(User $admin, string $targetRole): bool
    {
        return in_array($targetRole, $this->permissionHierarchy[$admin->role->name] ?? []);
    }
}
2. Multi-Tier Grading System
Database Schema
php
// Penilaian Components
Schema::create('grading_components', function (Blueprint $table) {
    $table->id();
    $table->string('code'); // A1, A2, B1, B2, C1, C2
    $table->string('name');
    $table->decimal('weight', 5, 2); // 0.30, 0.40, dst
    $table->string('assigned_to'); // dpl, mitra, admin
    $table->timestamps();
});

Schema::create('student_grades', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('period_id')->constrained();
    $table->foreignId('grading_component_id')->constrained();
    $table->decimal('score', 5, 2);
    $table->text('feedback')->nullable();
    $table->foreignId('graded_by')->constrained('users');
    $table->timestamp('graded_at');
    $table->timestamps();
});

Schema::create('final_grades', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('period_id')->constrained();
    $table->decimal('total_score', 5, 2);
    $table->string('letter_grade', 2); // A, B+, B, C+, C, D, E
    $table->decimal('weighted_score_a', 5, 2);
    $table->decimal('weighted_score_b', 5, 2);
    $table->decimal('weighted_score_c', 5, 2);
    $table->boolean('is_locked')->default(false);
    $table->timestamps();
    $table->index(['student_id', 'period_id']);
});
Service Class: GradingService.php
php
namespace App\Services\Grading;

use App\Models\{StudentGrade, FinalGrade, GradingComponent};

class GradingService
{
    private $gradingRules = [
        'A' => ['min' => 85, 'max' => 100],
        'B+' => ['min' => 80, 'max' => 84.99],
        'B' => ['min' => 75, 'max' => 79.99],
        'C+' => ['min' => 70, 'max' => 74.99],
        'C' => ['min' => 65, 'max' => 69.99],
        'D' => ['min' => 50, 'max' => 64.99],
        'E' => ['min' => 0, 'max' => 49.99]
    ];

    public function calculateFinalGrade(int $studentId, int $periodId): FinalGrade
    {
        $components = GradingComponent::with(['grades' => function($q) use ($studentId) {
            $q->where('student_id', $studentId);
        }])->get();

        $weightedScores = [
            'A' => 0, 'B' => 0, 'C' => 0
        ];

        foreach ($components as $component) {
            $score = $component->grades->first()->score ?? 0;
            $weightedScores[$component->assigned_to] += $score * $component->weight;
        }

        $total = ($weightedScores['A'] * 0.5) + 
                 ($weightedScores['B'] * 0.3) + 
                 ($weightedScores['C'] * 0.2);

        return FinalGrade::updateOrCreate(
            ['student_id' => $studentId, 'period_id' => $periodId],
            [
                'total_score' => $total,
                'letter_grade' => $this->convertToLetterGrade($total),
                'weighted_score_a' => $weightedScores['A'],
                'weighted_score_b' => $weightedScores['B'],
                'weighted_score_c' => $weightedScores['C']
            ]
        );
    }

    private function convertToLetterGrade(float $score): string
    {
        foreach ($this->gradingRules as $letter => $range) {
            if ($score >= $range['min'] && $score <= $range['max']) {
                return $letter;
            }
        }
        return 'E';
    }
}
3. Workflow Logbook & Dokumentasi
Database Schema
php
Schema::create('logbooks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('group_id')->constrained();
    $table->date('log_date');
    $table->text('activity');
    $table->json('photos')->nullable(); // Array of photo paths
    $table->enum('status', ['pending', 'approved', 'revision'])->default('pending');
    $table->text('feedback')->nullable();
    $table->foreignId('reviewed_by')->nullable()->constrained('users');
    $table->timestamp('reviewed_at')->nullable();
    $table->timestamps();
    $table->index(['student_id', 'log_date']);
});

Schema::create('document_types', function (Blueprint $table) {
    $table->id();
    $table->string('name'); // Laporan Aset, Video, Jurnal, dll
    $table->string('format'); // pdf, mp4, docx
    $table->integer('max_size'); // in KB
    $table->boolean('is_required')->default(true);
    $table->integer('deadline_days'); // Hari sebelum KKN berakhir
    $table->timestamps();
});

Schema::create('student_documents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('document_type_id')->constrained();
    $table->foreignId('period_id')->constrained();
    $table->string('file_path');
    $table->string('original_name');
    $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
    $table->text('notes')->nullable();
    $table->timestamp('submitted_at');
    $table->timestamp('verified_at')->nullable();
    $table->timestamps();
});
Service Class: DocumentTrackingService.php
php
namespace App\Services\Document;

class DocumentTrackingService
{
    public function getPendingSubmissions(int $groupId)
    {
        return User::whereHas('groups', function($q) use ($groupId) {
                $q->where('group_id', $groupId);
            })
            ->with(['documents' => function($q) {
                $q->where('status', 'pending')
                  ->with('documentType');
            }])
            ->get()
            ->map(function($student) {
                return [
                    'student' => $student->name,
                    'pending_docs' => $student->documents->pluck('documentType.name'),
                    'submission_rate' => $this->calculateSubmissionRate($student)
                ];
            });
    }

    private function calculateSubmissionRate($student): float
    {
        $totalRequired = DocumentType::where('is_required', true)->count();
        $submitted = $student->documents->where('status', '!=', 'pending')->count();
        
        return ($submitted / $totalRequired) * 100;
    }
}
4. God Mode Implementation
App/Providers/AuthServiceProvider.php
php
use Illuminate\Support\Facades\Gate;

public function boot()
{
    $this->registerPolicies();

    // God Mode Gate
    Gate::before(function ($user, $ability) {
        if ($user->hasRole('superadmin')) {
            // Log God Mode access
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'god_mode_access',
                'details' => [
                    'ability' => $ability,
                    'ip' => request()->ip(),
                    'user_agent' => request()->userAgent()
                ]
            ]);
            
            return true;
        }
    });

    // Emergency Access Middleware
    Gate::define('emergency-access', function ($user, $targetRole) {
        return $user->hasRole('superadmin') && 
               in_array($targetRole, ['dpl', 'mitra']);
    });
}
Audit Log System
php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('action');
    $table->morphs('auditable'); // Polymorphic relation
    $table->json('old_values')->nullable();
    $table->json('new_values')->nullable();
    $table->json('metadata')->nullable();
    $table->string('ip_address', 45);
    $table->string('user_agent')->nullable();
    $table->timestamps();
    $table->index(['action', 'created_at']);
});
5. UI/UX Premium Dashboard Components
React Component Structure
text
resources/js/
├── Components/
│   ├── Layout/
│   │   ├── AdminLayout.jsx
│   │   ├── DashboardLayout.jsx
│   │   └── Sidebar/
│   │       ├── NavItem.jsx
│   │       └── UserMenu.jsx
│   ├── Dashboard/
│   │   ├── StatsCards/
│   │   │   ├── GlassCard.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   └── ProgressRing.jsx
│   │   ├── Charts/
│   │   │   ├── GradeDistribution.jsx
│   │   │   ├── SubmissionTimeline.jsx
│   │   │   └── AttendanceHeatmap.jsx
│   │   └── Widgets/
│   │       ├── RecentLogbook.jsx
│   │       ├── PendingApprovals.jsx
│   │       └── DeadlineTracker.jsx
│   ├── Forms/
│   │   ├── LogbookForm.jsx
│   │   ├── GradingForm.jsx
│   │   └── DocumentUpload.jsx
│   └── UI/
│       ├── Badge/
│       ├── Button/
│       ├── Modal/
│       └── Table/
├── Pages/
│   ├── Dashboard/
│   │   ├── SuperAdmin.jsx
│   │   ├── DPL.jsx
│   │   ├── Mahasiswa.jsx
│   │   └── Mitra.jsx
│   ├── Logbook/
│   ├── Grading/
│   └── Documents/
└── Services/
    ├── api.js
    └── websocket.js
Premium Dashboard Component Example
jsx
// resources/js/Components/Dashboard/StatsCards/GlassCard.jsx
import { LucideIcon } from 'lucide-react';

const GlassCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
    green: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    purple: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30'
  };

  return (
    <div className={`
      backdrop-blur-xl bg-gradient-to-br ${colors[color]}
      border rounded-2xl p-6 shadow-2xl shadow-${color}-500/10
      hover:shadow-${color}-500/20 transition-all duration-300
      hover:-translate-y-1
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-medium px-2 py-1 rounded-full
            ${trend > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-300 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
      <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r from-${color}-400 to-${color}-600`} 
             style={{ width: '75%' }} />
      </div>
    </div>
  );
};
Tailwind Configuration (tailwind.config.js)
javascript
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        }
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  }
}
Additional Recommendations
1. Queue System for Heavy Operations
php
// app/Jobs/CalculateFinalGradesJob.php
class CalculateFinalGradesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(GradingService $gradingService)
    {
        Student::chunk(100, function ($students) use ($gradingService) {
            foreach ($students as $student) {
                $gradingService->calculateFinalGrade($student->id, $currentPeriod);
            }
        });
    }
}
2. API Resource Structure
text
app/Http/Resources/
├── UserResource.php
├── LogbookResource.php
├── GradeResource.php
└── DocumentResource.php
3. Repository Pattern Implementation
php
// app/Repositories/LogbookRepository.php
class LogbookRepository
{
    public function getPendingForDPL($dplId, $filters = [])
    {
        return Logbook::whereHas('student.group.dpl', function($q) use ($dplId) {
                $q->where('dosen_id', $dplId);
            })
            ->filter($filters)
            ->with(['student', 'photos'])
            ->paginate(20);
    }
}
4. Real-time Notifications
php
// Using Laravel Echo + Pusher/WebSocket
class LogbookApproved implements ShouldBroadcast
{
    public function broadcastOn()
    {
        return new PrivateChannel('student.' . $this->logbook->student_id);
    }
}
Sistem ini dirancang dengan:

Modular Architecture: Setiap komponen terpisah dan dapat dikembangkan mandiri

Caching Strategy: Redis untuk data yang sering diakses

API First: Siap untuk mobile app development

Audit Trail: Semua perubahan tercatat

Responsive Design: Menggunakan Tailwind CSS utilities

Accessibility: Memenuhi standar WCAG 2.1

Untuk implementasi penuh, saya sarankan menggunakan:

Spatie Laravel Permission untuk manajemen role

Laravel Excel untuk export/import data

Laravel Telescope untuk debugging

Inertia Progress untuk UX yang smooth

Chart.js atau ApexCharts untuk visualisasi data

----------

Arsitektur dan Strategi Implementasi Sistem Manajemen Kuliah Kerja Nyata (KKN) Berbasis Laravel 12, Inertia.js, dan Tailwind CSS
Digitalisasi program Kuliah Kerja Nyata (KKN) di Indonesia telah mengalami transformasi signifikan seiring dengan diperkenalkannya kebijakan Merdeka Belajar Kampus Merdeka (MBKM). Program KKN bukan lagi sekadar pengabdian masyarakat konvensional, melainkan sebuah bentuk integrasi antara riset, pemberdayaan, dan pembelajaran lapangan yang terstruktur. Dalam konteks pendidikan tinggi di Indonesia, institusi seperti Universitas Gadjah Mada (UGM) dan Universitas Sebelas Maret (UNS) telah menetapkan standar administrasi yang ketat, mulai dari tahap pembekalan hingga pelaporan akhir yang melibatkan berbagai pemangku kepentingan. Kebutuhan akan sistem informasi yang profesional dan skalabel menjadi krusial untuk mengelola ribuan mahasiswa, ratusan dosen pembimbing, serta berbagai mitra di tingkat desa atau kelurahan.   

Penggunaan Laravel 12 sebagai basis backend memberikan keunggulan teknis yang relevan dengan kebutuhan sistem akademik modern. Dengan struktur yang semakin ramping namun bertenaga, Laravel 12 memungkinkan pengembang untuk membangun logika bisnis yang kompleks melalui Service Classes dan Action Classes yang terisolasi. Integrasi dengan Inertia.js (React) menawarkan pengalaman pengguna yang setara dengan Single Page Application (SPA) tanpa mengorbankan kemudahan pengembangan sisi server. Sementara itu, Tailwind CSS menyediakan fleksibilitas desain yang diperlukan untuk menciptakan antarmuka yang bersih, fungsional, dan memiliki estetika tinggi sesuai dengan ekspektasi pengguna modern.   

Arsitektur Aktor dan Manajemen Otorisasi Berbasis Peran
Sistem manajemen KKN yang skalabel harus didasarkan pada pemisahan tanggung jawab yang jelas antar aktor. Arsitektur otorisasi dalam sistem ini menggunakan pendekatan Role-Based Access Control (RBAC) yang diimplementasikan melalui paket Spatie Laravel-Permission. Pendekatan ini memungkinkan fleksibilitas dalam menentukan izin (permissions) yang dapat dikelompokkan ke dalam peran (roles) tertentu, memudahkan penyesuaian jika terjadi perubahan kebijakan di tingkat universitas.   

Aktor pertama adalah Superadmin yang dikelola oleh Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM). Peran ini memiliki otoritas penuh atau "God Mode" terhadap seluruh data master, termasuk pengelolaan data fakultas, program studi, dan lokasi KKN. Superadmin bertanggung jawab untuk membuka periode pendaftaran, melakukan pembagian kelompok mahasiswa, menugaskan Dosen Pembimbing Lapangan (DPL), serta melakukan finalisasi nilai setelah semua komponen terpenuhi. Dalam operasionalnya, LPPM memerlukan akses terhadap audit log global untuk memantau integritas data di seluruh sistem.   

Aktor kedua, Dosen Pembimbing Lapangan (DPL), berfungsi sebagai mentor akademik bagi kelompok mahasiswa tertentu. Tugas utama DPL meliputi verifikasi harian terhadap logbook mahasiswa, validasi Program Kerja (Proker) yang disusun oleh kelompok, serta penginputan nilai akademik yang mencakup laporan final dan artikel ilmiah. DPL harus memiliki ruang lingkup data yang terbatas hanya pada mahasiswa atau kelompok yang berada di bawah bimbingannya, sebuah konsep yang dalam Laravel dapat diimplementasikan menggunakan Query Scopes atau Global Scopes pada model Eloquent.   

Mahasiswa, sebagai pelaku utama, memiliki alur kerja yang dimulai dari registrasi, unggah berkas persyaratan (seperti transkrip nilai atau surat keterangan sehat), hingga masuk ke dalam kelompok yang telah ditentukan oleh admin. Selama masa penerjunan, mahasiswa berkewajiban mengisi logbook harian yang mencakup deskripsi kegiatan dan dokumentasi foto. Tahap akhir bagi mahasiswa adalah pengunggahan laporan akhir dan hasil karya kreatif seperti video atau artikel ilmiah.   

Aktor keempat yang unik dalam sistem KKN di Indonesia adalah Mitra, yang biasanya merupakan Kepala Desa atau Lurah di lokasi pelaksanaan KKN. Peran ini memiliki akses terbatas untuk melihat daftar mahasiswa di desanya dan memberikan penilaian terhadap aspek non-akademik. Penilaian dari mitra sangat penting untuk mengukur integritas sosial dan kedisiplinan mahasiswa di lapangan, yang seringkali tidak terpantau secara langsung oleh DPL.   

Aktor	Peran Utama	Hak Akses Utama	Ruang Lingkup Data
Superadmin (LPPM)	Pengelola Pusat	manage-master, open-period, assign-dpl, audit-global, finalize-grades	Seluruh data sistem (Global)
DPL (Dosen)	Mentor Akademik	verify-logbook, validate-proker, input-academic-scores	Kelompok bimbingan spesifik
Mahasiswa	Peserta KKN	register-kkn, upload-docs, fill-logbook, submit-final-reports	Data pribadi dan kelompok sendiri
Mitra (Kades)	Validator Lapangan	assess-soft-skills, view-village-students	Mahasiswa di lokasi desa terkait
Desain Database dan Logika Penilaian Berjenjang (Multi-Tier Grading)
Sistem penilaian dalam KKN universitas di Indonesia umumnya bersifat komprehensif, menggabungkan evaluasi dari berbagai pihak untuk mencerminkan capaian pembelajaran mahasiswa secara utuh. Desain database harus mampu menampung berbagai komponen nilai ini dengan bobot yang berbeda-beda. Tabel evaluations berfungsi sebagai entitas pusat yang menghubungkan mahasiswa dengan skor dari DPL, Mitra, dan LPPM.   

Logika perhitungan nilai akhir sebaiknya tidak diletakkan di dalam Controller untuk menjaga kebersihan kode dan kemudahan pengujian. Penggunaan Service Class seperti GradingService memungkinkan abstraksi perhitungan matematis yang kompleks. Dalam Laravel 12, kita dapat menggunakan fitur Type Hinting dan Return Types yang ketat untuk memastikan konsistensi data skor.   

Skema penilaian yang diminta memiliki tiga komponen utama dengan bobot tertentu. Komponen A berasal dari DPL (50%) yang terbagi lagi menjadi Laporan Final (30% dari 50%), Proker (40% dari 50%), dan Artikel (30% dari 50%). Komponen B berasal dari Desa (30%) yang mencakup Sikap (50% dari 30%) dan Kedisiplinan (50% dari 30%). Komponen C berasal dari LPPM (20%) berdasarkan kehadiran workshop dan administrasi.   

Konversi dari skor numerik (0-100) ke huruf (A, B+, B, dst) dilakukan secara otomatis. Dalam implementasi backend, kita dapat menggunakan computed properties atau metode pada Service Class yang dipicu setiap kali ada perubahan data nilai. Pada sisi frontend (Inertia React), nilai ini ditampilkan secara real-time melalui re-rendering komponen saat data props diperbarui.   

Formula perhitungan nilai akhir (NA) dapat direpresentasikan sebagai berikut:

NA=(S 
A
​
 ×0.5)+(S 
B
​
 ×0.3)+(S 
C
​
 ×0.2)
Di mana:

S 
A
​
 =(Laporan×0.3)+(Proker×0.4)+(Artikel×0.3)

S 
B
​
 =(Sikap×0.5)+(Kedisiplinan×0.5)

S 
C
​
 =(Workshop×0.5)+(Administrasi×0.5)

Skema database untuk mendukung sistem ini memerlukan tabel-tabel berikut:

Nama Tabel	Kolom Utama	Relasi
users	id, name, email, role_id	belongsTo(roles)
students	id, user_id, nim, prodi_id, group_id	belongsTo(users), belongsTo(groups)
evaluations	id, student_id, score_a, score_b, score_c, final_score, grade	belongsTo(students)
evaluation_details	id, evaluation_id, component_name, raw_score, weight	belongsTo(evaluations)
Implementasi GradingService dalam PHP akan terlihat seperti ini:

PHP
namespace App\Services;

use App\Models\Student;
use App\Models\Evaluation;

class GradingService
{
    public function calculateAndStore(Student $student, array $scores): Evaluation
    {
        $scoreA = ($scores['laporan'] * 0.3) + ($scores['proker'] * 0.4) + ($scores['artikel'] * 0.3);
        $scoreB = ($scores['sikap'] * 0.5) + ($scores['kedisiplinan'] * 0.5);
        $scoreC = ($scores['workshop'] * 0.5) + ($scores['administrasi'] * 0.5);

        $finalScore = ($scoreA * 0.5) + ($scoreB * 0.3) + ($scoreC * 0.2);
        $grade = $this->determineGrade($finalScore);

        return Evaluation::updateOrCreate(
            ['student_id' => $student->id],
           
        );
    }

    private function determineGrade(float $score): string
    {
        if ($score >= 85) return 'A';
        if ($score >= 80) return 'A-';
        if ($score >= 75) return 'B+';
        if ($score >= 70) return 'B';
        if ($score >= 65) return 'B-';
        if ($score >= 60) return 'C';
        return 'E';
    }
}
   

Alur Kerja Dokumentasi, Logbook, dan Pelaporan
Sistem logbook harian merupakan instrumen kendali mutu utama dalam pelaksanaan KKN. Setiap entri logbook oleh mahasiswa harus mendukung unggah foto kegiatan yang berfungsi sebagai bukti fisik keberadaan di lokasi dan pelaksanaan program kerja. Status entri ini dikelola melalui alur persetujuan: Pending saat pertama kali dibuat, Approved setelah diverifikasi DPL, atau Revision jika deskripsi atau foto dianggap tidak memadai oleh pembimbing.   

Selain logbook, manajemen laporan (Report Management) harus menangani tujuh jenis dokumen wajib yang umumnya diminta oleh universitas di Indonesia untuk memenuhi standar luaran. Ketujuh dokumen tersebut meliputi:   

Laporan Rencana Kegiatan (LRK): Disusun di awal periode sebagai panduan program.   

Laporan Pelaksanaan Kegiatan (LPK): Laporan akhir yang merangkum seluruh eksekusi program.   

Laporan Aset: Dokumentasi barang atau hibah fisik yang diberikan kepada desa.

Artikel Ilmiah: Tulisan akademis berbasis hasil KKN untuk publikasi.   

Video Dokumentasi (Link YouTube): Luaran kreatif untuk publikasi digital.   

Jurnal Harian Kolektif: Rekapitulasi kegiatan kelompok.

Profil Desa/Buku Cerita Sukses: Dokumentasi potensi wilayah dan capaian pengabdian.   

Fitur tracking sangat krusial bagi LPPM untuk mengidentifikasi mahasiswa atau kelompok mana yang belum mengunggah dokumen tertentu. Implementasi teknisnya menggunakan tabel documents yang memiliki kolom type (enum) dan status. Dashboard admin dapat melakukan kueri terhadap mahasiswa yang tidak memiliki rekaman pada tipe dokumen tertentu, memungkinkan pengiriman notifikasi otomatis bagi yang terlambat.   

Tipe Dokumen	Penanggung Jawab	Status Alur Kerja
Logbook Harian	Individu	Draft -> Pending -> Approved/Revision
LRK / LPK	Kelompok	Draft -> Submitted -> Verified
Artikel Ilmiah	Individu	Uploaded -> Reviewed -> Finalized
Video YouTube	Kelompok	URL Submitted -> Validated
Logika State Machine untuk perubahan status logbook dapat diimplementasikan menggunakan Laravel Eloquent Observers atau paket seperti spatie/laravel-model-states. Namun, untuk kesederhanaan dan performa, penggunaan metode eksplisit pada LogbookService sudah memadai untuk skala universitas.   

Implementasi Administratif Bypass (God Mode) dan Audit Trail
Dalam sistem informasi skala besar, seringkali terjadi situasi darurat yang memerlukan intervensi langsung dari administrator pusat (Superadmin), seperti penginputan nilai yang terlewat oleh mitra yang tidak memiliki akses internet atau perbaikan data kelompok di menit-menit terakhir. Laravel menyediakan mekanisme Gate::before di dalam AuthServiceProvider yang memungkinkan pengecekan otorisasi tertentu dilewati oleh pengguna dengan peran admin.   

Namun, kebebasan akses ini membawa risiko keamanan dan integritas data. Oleh karena itu, setiap tindakan "God Mode" wajib dicatat dalam sistem audit log. Audit log tidak hanya menyimpan siapa yang melakukan perubahan, tetapi juga nilai lama (old values) dan nilai baru (new values), alamat IP, serta user agent sebagai bagian dari bukti forensik digital.   

PHP
// app/Providers/AuthServiceProvider.php

use Illuminate\Support\Facades\Gate;
use App\Models\AuditLog;

public function boot(): void
{
    Gate::before(function ($user, $ability) {
        if ($user->hasRole('superadmin')) {
            // Kita tetap membiarkan Gate::before mengembalikan true, 
            // namun pencatatan audit dilakukan di level Controller atau Middleware
            return true;
        }
    });
}
Strategi terbaik adalah menggunakan Middleware khusus yang memantau permintaan HTTP dari admin saat mengakses rute non-admin. Paket iamfarhad/laravel-audit-log dapat dikonfigurasi untuk secara otomatis memantau model-model tertentu yang krusial seperti Evaluation dan Logbook. Tabel audit_logs harus memiliki indeks yang baik untuk mendukung pencarian cepat oleh LPPM saat melakukan audit global.   

Kolom Audit	Deskripsi
causer_id	ID admin yang melakukan aksi
subject_id	ID entitas yang dimodifikasi (misal: ID Mahasiswa)
action	Jenis tindakan (Created, Updated, Deleted, Bypassed)
old_values	Data sebelum perubahan (JSON)
new_values	Data sesudah perubahan (JSON)
metadata	IP Address, User Agent, dan Konteks URL
Estetika UI/UX: Dashboard Modern dengan Glassmorphism
Pengalaman pengguna yang "Wow" dalam sistem akademik dapat dicapai melalui kombinasi prinsip desain kontemporer dan utilitas Tailwind CSS. Konsep Glassmorphism memberikan kesan kedalaman dan transparansi yang elegan, sangat cocok untuk dashboard yang menampilkan banyak widget data.   

Karakteristik utama Glassmorphism yang harus diimplementasikan meliputi:

Transparansi: Penggunaan latar belakang semi-transparan dengan bg-white/30 atau bg-slate-800/30.   

Multi-layered Approach: Elemen yang tampak melayang di atas latar belakang yang berwarna-warni atau memiliki gradien lembut.   

Backdrop Blur: Menggunakan utilitas backdrop-blur-md atau backdrop-blur-lg dari Tailwind untuk menciptakan efek kaca buram.   

Subtle Borders: Garis tepi tipis dengan opasitas rendah (border-white/20) untuk mendefinisikan batas komponen tanpa terlihat kaku.   

Penggunaan Lucide Icons memberikan konsistensi visual melalui ikon garis yang bersih dan modern, menggantikan pustaka ikon yang lebih berat atau kurang estetis. Setiap kartu widget (Tailwind Cards) harus dirancang secara responsif, menggunakan grid layout yang menyesuaikan jumlah kolom berdasarkan ukuran layar pengguna.   

Contoh struktur komponen React untuk kartu dashboard premium:

JavaScript
import { Activity, UserCheck, FileText, MapPin } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="relative group p-6 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl transition-all hover:scale-[1.02]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight">{label}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-20`}>
        <Icon size={28} className={colorClass.replace('bg-', 'text-')} />
      </div>
    </div>
    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
  </div>
);
   

Struktur Folder Modular untuk Skalabilitas
Penerapan struktur folder yang tepat menentukan seberapa mudah sistem ini dipelihara seiring bertambahnya fitur. Mengadopsi prinsip Domain-Driven Design (DDD) yang disederhanakan sangat direkomendasikan untuk proyek Laravel-Inertia skala menengah ke atas.   

Struktur Backend (Laravel 12)
Dalam Laravel 12, kita dapat mengorganisir logika bisnis ke dalam direktori app/Domains atau tetap menggunakan struktur app/Services dan app/Actions yang dikelompokkan berdasarkan konteks.   

app/ ├── Actions/ # Single responsibility classes (e.g., RegisterStudentAction) ├── Http/ │ ├── Controllers/ # Thin controllers, delegating logic to Services │ ├── Middleware/ # Custom auth & audit middleware │ └── Requests/ # Form validation logic ├── Models/ # Eloquent models with rich relationships ├── Services/ # Business logic orchestration │ ├── GradingService.php │ ├── LogbookService.php │ └── AuditService.php └── Providers/ # Service container bindings

   

Struktur Frontend (React Inertia)
Struktur frontend harus memisahkan antara komponen UI murni, tata letak global, dan logika halaman spesifik.   

resources/js/ ├── components/ # Atomic UI elements (Buttons, Inputs, Modals) ├── layouts/ # Persistent layouts (Authenticated, Guest, Admin) ├── modules/ # Shared logic across features │ ├── auth/ # Hooks like usePermissions │ ├── grading/ # Components like GradeBadge │ └── documents/ # File upload helpers ├── pages/ # Inertia rendered pages │ ├── Admin/ # Pages for LPPM │ ├── Dpl/ # Pages for Dosen │ ├── Student/ # Pages for Mahasiswa │ └── Mitra/ # Pages for Kepala Desa ├── types/ # TypeScript interfaces & enums └── utils/ # Formatting helpers (Date, Currency, Score)

   

Penggunaan Shared Props di HandleInertiaRequests memungkinkan data otorisasi tersedia secara global di seluruh komponen React, sehingga pengecekan seperti auth.user.can('verify-logbook') dapat dilakukan secara deklaratif di mana saja.   

Rekomendasi Teknis untuk Performa dan Keamanan
Mengingat sistem KKN di Indonesia seringkali mengalami lonjakan lalu lintas (traffic spike) saat masa pendaftaran atau tenggat waktu pengunggahan laporan, strategi skalabilitas harus diterapkan pada level infrastruktur dan kode.

Queue Management: Proses yang memakan waktu lama, seperti pembuatan sertifikat KKN dalam format PDF atau sinkronisasi data besar ke pangkalan data dikti, harus dilakukan secara asinkron menggunakan Laravel Queues.   

Storage Driver: Gunakan driver penyimpanan eksternal seperti AWS S3 atau MinIO untuk berkas laporan dan foto logbook. Hal ini mencegah kepenuhan disk pada server aplikasi dan mempermudah replikasi aset.   

Database Optimization: Gunakan Eager Loading (with()) untuk menghindari masalah kueri N+1 saat menampilkan daftar mahasiswa beserta nilai dan kelompoknya. Pastikan indeks yang tepat pada kolom nim, student_id, dan group_id.   

Real-time Interaction: Untuk fitur penilaian yang bersifat interaktif, gunakan Inertia Partial Reloads untuk memperbarui skor tanpa memuat ulang seluruh halaman, memberikan kesan aplikasi yang sangat responsif.   

Sistem manajemen KKN yang dibangun dengan fondasi Laravel 12 dan React memberikan keseimbangan sempurna antara produktivitas pengembang dan pengalaman pengguna yang luar biasa. Dengan mengikuti standar universitas di Indonesia yang mengedepankan akuntabilitas dan kolaborasi multidisiplin, arsitektur ini siap untuk menangani kompleksitas administrasi akademik di masa depan. Pengembangan berkelanjutan dapat mencakup integrasi dengan sistem informasi akademik (SIAKAD) universitas melalui API yang aman, memastikan data nilai KKN mengalir secara otomatis ke transkrip nilai akhir mahasiswa.   


ugm.ac.id
Buku Panduan Penyelenggaraan Merdeka Belajar–Kampus Merdeka - UGM
Terbuka di jendela baru

ptb.fkip.uns.ac.id
BUKU PEDOMAN KULIAH KERJA NYATA UNIVERSITAS SEBELAS ...
Terbuka di jendela baru

kkn.ugm.ac.id
Pelaporan dan Penilaian – kkn.ugm.ac.id
Terbuka di jendela baru

laracasts.com
Need Guidance on Choosing the Right Architecture for a Laravel Application - Laracasts
Terbuka di jendela baru

anasahson.github.io
Laravel 12 Folder Structure: 2025 Complete Developer Guide | Anas Ahson
Terbuka di jendela baru

laraveldaily.com
User Roles and Permissions Protection - Laravel Daily
Terbuka di jendela baru

github.com
kurniaandi/laravel-inertia-react-spatie: Tutorial Laravel 10 Bahasa Indonesia - Role & Permission Inertia React & Tailwind CSS - GitHub
Terbuka di jendela baru

flyonui.com
How To Implement Glassmorphism With Tailwind CSS Easily? - FlyonUI
Terbuka di jendela baru

github.com
LuanEdCosta/react-tailwindcss-glassmorphism - GitHub
Terbuka di jendela baru

spatie.be
Introduction | laravel-permission - Spatie
Terbuka di jendela baru

codingoblin.com
Roles and Permissions in Laravel Jetstream (Inertia.js) using Spatie Package - Codingoblin
Terbuka di jendela baru

infosecinstitute.com
Laravel authorization best practices and tips - Infosec
Terbuka di jendela baru

reddit.com
Laravel 12 + Vue JS + Spatie Roles & Permissions - Reddit
Terbuka di jendela baru

laravel-news.com
Laravel Audit Log
Terbuka di jendela baru

github.com
iamfarhad/laravel-audit-log: A comprehensive entity-level audit logging package for Laravel with model-specific tables for tracking changes in your application's data. Perfect for compliance, debugging, and maintaining data integrity in modern web applications. - GitHub
Terbuka di jendela baru

techlipse.co.ke
Mastering Laravel Service Classes: Clean Architecture, Practical Patterns, and Production-Ready Examples | TechLipse
Terbuka di jendela baru

laraveldaily.com
Service Classes in Laravel: 10 Open-Source Practical Examples
Terbuka di jendela baru

id.scribd.com
Laporan Individual Kegiatan KKN | PDF - Scribd
Terbuka di jendela baru

id.scribd.com
Laporan Rencana Kegiatan KKN UGM | PDF - Scribd
Terbuka di jendela baru

id.scribd.com
Format Penilaian Dari Pemerintah Desa | PDF - Scribd
Terbuka di jendela baru

id.scribd.com
Instrumen Penilaian KKN | PDF - Scribd
Terbuka di jendela baru

lppm.unikama.ac.id
penilaian, monitoring, dan evaluasi program kkn - Universitas PGRI Kanjuruhan Malang
Terbuka di jendela baru

edrawsoft.com
ER Diagrams for University Database: A Complete Tutorial - Edraw
Terbuka di jendela baru

edrawmax.com
University Management System Er Diagram | EdrawMax Template
Terbuka di jendela baru

oneuptime.com
How to Use Service Classes in Laravel - OneUptime
Terbuka di jendela baru

medium.com
How to Use Service Classes in Laravel 12 for a Clean and Maintainable Codebase
Terbuka di jendela baru

inertiajs.com
Authorization - Inertia.js Documentation
Terbuka di jendela baru

laracasts.com
Authorization and Inertia - Laracasts
Terbuka di jendela baru

stackoverflow.com
Converting letter grade GPA to number grade using JavaScript - Stack Overflow
Terbuka di jendela baru

madewithlaravel.com
Laravel Process Approval - Multi-level Approval Workflows
Terbuka di jendela baru

laravel-news.com
A package to handle process approval flow in a laravel application. - Laravel News
Terbuka di jendela baru

stackoverflow.com
Database design - Approval work flow and version creation - Stack Overflow
Terbuka di jendela baru

laravel-news.com
Comprehensive entity-level audit logging package for Laravel applications with model-specific tables, field exclusion, and batch processing support - Laravel News
Terbuka di jendela baru

jeylabs.github.io
Log audit inside your Laravel app - GitHub Pages
Terbuka di jendela baru

next.jqueryscript.net
Open-Source Tailwind CSS Dashboard Template - Reactwind - NextGen JavaScript
Terbuka di jendela baru

dev.to
# I Built an Apple-Style Glassmorphism React Component Library - DEV Community
Terbuka di jendela baru

medium.com
Implementing Domain-Driven Architecture in Laravel: Setup, Advantages, and Practical Use Cases | by Harry Es Pant | Medium
Terbuka di jendela baru

dev.to
Laravel modular folder structure - DEV Community
Terbuka di jendela baru

spatie.be
How to structure the frontend of a Laravel Inertia React application - Spatie
Terbuka di jendela baru

medium.com
Creating a Guest Layout in Laravel Starter Kit 12 — React & Inertia - Medium
Terbuka di jendela baru

medium.com
React Folder Structure for Scalable Enterprise Apps | by Amar Pandav | Medium
Terbuka di jendela baru

dev.to
Folder Structures in React Projects - DEV Community
Terbuka di jendela baru

codeforest.net
Deadly Logging Mistakes: Laravel Logging Best Practices You Can't Ignore - CodeForest
Terbuka di jendela baru

laravel.com
Directory Structure - Laravel 12.x - The PHP Framework For Web Artisans
Terbuka di jendela baru

gptdevelopers.io
How To Build A Custom Education Management System In Laravel In 2024