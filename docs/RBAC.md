# RBAC Documentation - SIBERMAS KKN

**Last Updated:** 2026-05-11
**Version:** 1.0
**Package:** Spatie Laravel Permission

---

## Table of Contents

1. [Role Overview](#role-overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Permissions](#permissions)
4. [Role Details](#role-details)
5. [Middleware Usage](#middleware-usage)
6. [Database Schema](#database-schema)
7. [Seeder Reference](#seeder-reference)

---

## Role Overview

SIBERMAS KKN menggunakan **6 role** yang didefinisikan menggunakan package `spatie/laravel-permission`.

| Role | Display Name | Description |
|------|-------------|-------------|
| `superadmin` | Super Administrator | Akses penuh ke seluruh sistem |
| `admin` | Administrator | Manajemen KKN (kecuali pengaturan sistem) |
| `faculty_admin` | Faculty Administrator | Akses baca saja per fakultas |
| `dosen` | Dosen | Akses portal dosen |
| `dpl` | Dosen Pembimbing Lapangan | Supervisi dan evaluasi peserta |
| `student` | Mahasiswa | Akses data sendiri |

---

## Role Hierarchy

```
┌─────────────────────────────────────────────────┐
│                  superadmin                      │
│         (All permissions + system settings)      │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                    admin                         │
│        (All KKN management operations)          │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│               faculty_admin                      │
│    (Read-only, scoped by faculty)               │
└─────────────────────┬───────────────────────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│      dosen       │       │       dpl       │
│ (Portal access)  │       │  (Supervision)  │
└────────┬────────┘       └────────┬────────┘
         │                         │
         └───────────┬─────────────┘
                     ▼
         ┌─────────────────┐
         │     student     │
         │   (Self data)   │
         └─────────────────┘
```

---

## Permissions

### Permission List

| Permission | Description |
|------------|-------------|
| `access-admin-panel` | Mengakses portal admin |
| `access-dosen-panel` | Mengakses portal dosen |
| `manage-dpl` | Mengelola penugasan DPL |
| `transfer-students` | Memindahkan mahasiswa antar kelompok |
| `view-faculty-data` | Melihat data per fakultas |
| `manage-settings` | Mengelola pengaturan sistem (superadmin only) |

### Permission Assignment by Role

| Permission | superadmin | admin | faculty_admin | dosen | dpl | student |
|------------|:----------:|:-----:|:-------------:|:-----:|:---:|:-------:|
| `access-admin-panel` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `access-dosen-panel` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `manage-dpl` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `transfer-students` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `view-faculty-data` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `manage-settings` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Role Details

### 1. Super Administrator (`superadmin`)

**Deskripsi:** Akses penuh ke seluruh sistem tanpa batasan.

**Scope:** Global (all data, all faculties, all periods)

**Job Description:**
- Manajemen pengguna (create, update, delete)
- Manajemen role dan permission
- Manajemen periode KKN
- Akses ke pengaturan sistem (`manage-settings`)
- Rotasi kunci AI
- Backup dan restore database
- Monitoring kesehatan sistem

**Contoh Tugas:**
```php
// Membuat user baru dengan role tertentu
$user->assignRole('admin');

// Memberikan permission spesifik
$user->givePermissionTo('manage-settings');

// Akses semua data
$allPeriods = Periode::withTrashed()->get();
```

**Guard:** `web`

---

### 2. Administrator (`admin`)

**Deskripsi:** Manajemen operasional KKN sehari-hari.

**Scope:** Global (all data, all faculties, all periods)

**Job Description:**
- Manajemen periode KKN
- Verifikasi pendaftaran mahasiswa
- Pembagian kelompok
- Penugasan DPL
- Monitoring attendance harian
- Generate laporan
- Generate sertifikat
- Export data

**Tidak memiliki:**
- Akses ke `manage-settings`
- Pembuatan superadmin baru

**Contoh Tugas:**
```php
// Approve pendaftaran
$registration->approve();

// Buat kelompok baru
$kelompok = KelompokKkn::create([...]);

// Assign DPL
$dpl->assignRole('dpl');
```

**Guard:** `web`

---

### 3. Faculty Administrator (`faculty_admin`)

**Deskripsi:** Akses baca saja dengan scope fakultas.

**Scope:** Data fakultasnya sendiri saja (scoped by faculty)

**Job Description:**
- Melihat data mahasiswa fakultasnya
- Melihat laporan KKN fakultasnya
- Melihat statistik fakultasnya
- Download laporan fakultasnya

**Pembatasan:**
- Tidak bisa CREATE, UPDATE, DELETE
- Tidak bisa memindahkan mahasiswa antar fakultas
- Tidak bisa edit data di luar faculty-nya

**Contoh Tugas:**
```php
// Faculty scope filter di controller
$peserta = PesertaKkn::whereHas('mahasiswa.fakultas', function($q) {
    $q->where('fakultas_id', $user->fakultas_id);
})->get();

// Melihat data (read-only)
$laporan = Laporan::whereHas('peserta.mahasiswa.fakultas', ...)->get();
```

**Guard:** `web`

---

### 4. Dosen (`dosen`)

**Deskripsi:** Dosen biasa tanpa tugas supervise KKN.

**Scope:** Portal dosen saja (bukan DPL)

**Job Description:**
- Akses portal dosen
- Melihat informasi umum KKN
- Update profil sendiri

**Pembatasan:**
- Tidak bisa akses data mahasiswa
- Tidak bisa akses admin panel
- Tidak punya mahasiswa bimbingan

**Contoh Tugas:**
```php
// Dosen bisa login ke portal dosen
// Melihat info umum KKN
// Update profile sendiri
$user->update(['phone' => '081234567890']);
```

**Guard:** `web`

---

### 5. Dosen Pembimbing Lapangan (`dpl`)

**Deskripsi:** Dosen yang bertugas sebagai pembimbing lapangan.

**Scope:** Kelompok yang dibimbingnya saja (via `dpl_periode` pivot)

**Job Description:**
- Akses portal dosen
- Supervisi mahasiswa bimbingannya
- Approval laporan harian
- Approval program kerja
- Evaluasi mahasiswa
- Bimbingan dan feedback
- Monitoring attendance mahasiswa

**Pembatasan:**
- Tidak bisa akses data di luar kelompoknya
- Tidak bisa approval di luar kelompoknya

**Contoh Tugas:**
```php
// Cek mahasiswa bimbingan
$mahasiswas = PesertaKkn::whereHas('kelompok.dpl', function($q) {
    $q->where('dosen_id', auth()->id());
})->get();

// Approve laporan
$laporan->approveByDpl();

// Beri evaluasi
$evaluasi = Evaluasi::create([...]);
```

**Guard:** `web`

---

### 6. Student (`student`)

**Deskripsi:** Mahasiswa peserta KKN.

**Scope:** Data sendiri saja

**Job Description:**
- Pendaftaran KKN
- Submit attendance harian (GPS-based)
- Submit laporan harian
- Submit program kerja
- Submit laporan akhir
- Upload dokumen
- Chat dengan DPL
- Lihat status dan nilai
- Download sertifikat

**Pembatasan:**
- Tidak bisa akses portal admin
- Tidak bisa akses portal dosen
- Hanya data sendiri

**Contoh Tugas:**
```php
// Submit attendance
$attendance = Attendance::create([
    'user_id' => auth()->id(),
    'latitude' => $request->lat,
    'longitude' => $request->lng,
    'timestamp_client' => now(),
]);

// Submit laporan
$laporan = Laporan::create([
    'peserta_id' => auth()->user()->peserta->id,
    'kegiatan' => $request->kegiatan,
    'tanggal' => today(),
]);
```

**Guard:** `web`

---

## Middleware Usage

### Route Middleware Configuration

**File:** `apps/api/routes/api.php`

```php
// Admin routes - superadmin, admin, faculty_admin
Route::middleware(['auth:sanctum', 'role:superadmin|admin|faculty_admin', 'not_locked'])
    ->prefix('admin')
    ->group(base_path('routes/api/admin.php'));

// Dosen/DPL routes - dosen, dpl, superadmin
Route::middleware(['auth:sanctum', 'role:dosen|dpl|superadmin', 'not_locked'])
    ->prefix('dosen')
    ->group(base_path('routes/api/dosen.php'));

// Student routes - student only
Route::middleware(['auth:sanctum', 'role:student', 'not_locked'])
    ->prefix('student')
    ->group(base_path('routes/api/student.php'));

// Public routes - no auth required
Route::middleware(['throttle:public'])
    ->prefix('public')
    ->group(base_path('routes/api/public.php'));
```

### Middleware Reference

| Middleware | Purpose |
|------------|---------|
| `auth:sanctum` | Verifikasi token authentication |
| `role:xxx` | Verifikasi role user |
| `not_locked` | Cek apakah periode aktif tidak terkunci |
| `phase` | Cek fase KKN (registration/selection/active/etc) |
| `admin.auth` | EnsureAdminAuthorization - PERMISSION_MAP check |

### Admin Authorization Middleware

**File:** `apps/api/app/Http/Middleware/EnsureAdminAuthorization.php`

```php
// Deny-by-default: controller yang tidak ada di PERMISSION_MAP akan error 500
if (! array_key_exists($controllerClass, self::PERMISSION_MAP)) {
    Log::error('EnsureAdminAuthorization: controller missing from PERMISSION_MAP', [...]);
    abort(500, 'Controller not authorized');
}

$requiredPermission = self::PERMISSION_MAP[$controllerClass];

if (!$user->can($requiredPermission)) {
    abort(403, 'You do not have permission');
}
```

---

## Database Schema

### Tables

```
roles
├── id
├── name (unique: superadmin, admin, faculty_admin, dosen, dpl, student)
├── guard_name (default: web)
├── created_at
└── updated_at

permissions
├── id
├── name (unique)
├── guard_name (default: web)
├── created_at
└── updated_at

role_permissions (pivot)
├── role_id
├── permission_id

model_has_roles (Spatie)
├── role_id
├── model_type (App\Models\User)
├── model_id

model_has_permissions (Spatie)
├── permission_id
├── model_type (App\Models\User)
├── model_id
```

### User Model Trait

```php
// App\Models\User.php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;

    // Available methods:
    // $user->assignRole('admin');
    // $user->removeRole('admin');
    // $user->syncRoles(['admin', 'dpl']);
    // $user->hasRole('admin');
    // $user->can('manage-settings');
    // $user->givePermissionTo('transfer-students');
}
```

---

## Seeder Reference

### RoleSeeder

**File:** `apps/api/database/seeders/RoleSeeder.php`

```php
$roles = ['superadmin', 'admin', 'faculty_admin', 'dosen', 'dpl', 'student'];

foreach ($roles as $role) {
    Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
}
```

### PermissionSeeder

**File:** `apps/api/database/seeders/PermissionSeeder.php`

```php
$permissions = [
    'access-admin-panel',
    'access-dosen-panel',
    'manage-dpl',
    'transfer-students',
    'view-faculty-data',
    'manage-settings',
];

// Superadmin: semua permission
$superadmin->syncPermissions($permissions);

// Admin: semua kecuali manage-settings
$adminPermissions = array_filter($permissions, fn($p) => $p !== 'manage-settings');
$admin->syncPermissions($adminPermissions);

// Faculty Admin: read-only
$facultyAdmin->syncPermissions([
    'access-admin-panel',
    'view-faculty-data',
    'manage-dpl',
]);

// Dosen/DPL: portal access only
foreach (['dosen', 'dpl'] as $roleName) {
    $role->syncPermissions(['access-dosen-panel']);
}

// Student: no admin permissions
// (No permissions needed for student role)
```

### SuperAdminSeeder

**File:** `apps/api/database/seeders/SuperAdminSeeder.php`

Creates:
1. All roles and permissions
2. Superadmin user account
3. Assigns all permissions to superadmin role

```php
// Default credentials (HARUS DIUBAH DI PRODUCTION)
SUPERADMIN_EMAIL = 'superadmin@sibermas.uinsaizu.ac.id'
SUPERADMIN_USERNAME = 'superadmin'
```

---

## Environment-Specific Behavior

### Local Development

```php
// TestAutoLogin middleware aktif di environment 'local' dan 'testing'
// Memungkinkan login tanpa password dengan header khusus
// Lihat: apps/api/app/Http/Middleware/TestAutoLogin.php
```

### Production

```php
// TestAutoLogin MATI (AUTH_TEST_AUTO_LOGIN_ENABLED=false)
// Semua route harus melalui authentication normal
// Rate limiting aktif
```

---

## Security Considerations

### Deny-by-Default

Unmapped controllers trigger 500 error:

```php
// EnsureAdminAuthorization.php
if (! array_key_exists($controllerClass, self::PERMISSION_MAP)) {
    Log::error('EnsureAdminAuthorization: controller missing from PERMISSION_MAP', [
        'controller' => $controllerClass,
        'user_id' => $user->id ?? null,
    ]);
    abort(500, 'Controller not authorized');
}
```

### Superadmin Bypass

```php
// Superadmin bisa akses semua route admin tanpa cek permission
if ($user->hasRole('superadmin')) {
    return $next($request);
}
```

### Faculty Scoping

Faculty admin hanya bisa lihat data fakultasnya:

```php
// Di controller yang menggunakan FacultyScopeService
$query->whereHas('mahasiswa.fakultas', function($q) use ($user) {
    $q->where('fakultas_id', $user->faculity_id);
});
```

---

## Testing

### Test File

**File:** `apps/api/tests/Feature/Security/AdminPermissionCoverageTest.php`

```php
it('every permission referenced in PERMISSION_MAP exists in DB', function () {
    $referenced = collect(EnsureAdminAuthorization::PERMISSION_MAP)
        ->values()
        ->unique();

    $seeded = Permission::pluck('name')->all();

    foreach ($referenced as $permission) {
        expect($permission)->toBeIn($seeded);
    }
});
```

---

## Troubleshooting

### User tidak bisa akses route

1. Cek role user:
```php
$user->roles()->pluck('name');
```

2. Cek permission:
```php
$user->getPermissionNames();
```

3. Cek route middleware:
```bash
php artisan route:list --path=admin
```

### Role tidak ter-assign

1. Run seeder:
```bash
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=PermissionSeeder
```

2. Clear cache:
```bash
php artisan cache:forget spatie.permission.cache
php artisan permission:cache-reset
```

### Middleware 403 Forbidden

1. Cek PERMISSION_MAP di `EnsureAdminAuthorization.php`
2. Pastikan controller ada di map
3. Cek apakah user punya role yang sesuai
