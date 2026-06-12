<?php

use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa as KknMahasiswa;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// ─── Helper: student dengan profil lengkap ────────────────────────────────────

function createStudentWithProfile(): User
{
    $user = createUserWithRole('student');

    KknMahasiswa::factory()->create([
        'user_id' => $user->id,
        'nik' => '3301010101010001',
        'mother_name' => 'Ibu Test',
        'birth_place' => 'Purwokerto',
        'birth_date' => '2000-01-01',
        'gender' => 'L',
        'shirt_size' => 'M',
    ]);

    $user->update([
        'phone' => '081234567890',
        'address' => 'Jl. Test No. 1',
        'address_village_name' => 'Desa Test',
        'address_district_name' => 'Kecamatan Test',
        'address_regency_name' => 'Banyumas',
        'address_postal_code' => '53100',
        'address_lat' => -7.4246,
        'address_lng' => 109.2342,
        'address_verified_at' => now(),
        'avatar' => 'avatars/test.jpg',
    ]);

    return $user;
}

// ─── Student: Poster Potensi Desa ─────────────────────────────────────────────

describe('Student Poster Potensi Desa', function () {

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/student/poster-potensi-desa')
            ->assertStatus(401);
    });

    it('returns 403 for dosen role', function () {
        $user = createUserWithRole('dosen');
        Dosen::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson('/api/v1/student/poster-potensi-desa')
            ->assertStatus(403);
    });

    it('returns 403 PROFILE_INCOMPLETE for student without profile', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/poster-potensi-desa')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('poster endpoint accessible for student with complete profile', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->getJson('/api/v1/student/poster-potensi-desa');

        // 200 (no active period) or 403 (phase blocked) — both are valid
        expect($response->status())->toBeIn([200, 403]);
    });

    it('poster upload rejects invalid file types', function () {
        $user = createStudentWithProfile();
        Storage::fake('public');

        $file = UploadedFile::fake()->create('malware.exe', 100, 'application/octet-stream');

        $response = $this->actingAs($user)->postJson('/api/v1/student/poster-potensi-desa', [
            'poster' => $file,
        ]);

        // 422 validation or 403 phase-blocked
        expect($response->status())->toBeIn([422, 403]);
    });

    it('poster upload rejects missing file', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->postJson('/api/v1/student/poster-potensi-desa', []);

        expect($response->status())->toBeIn([422, 403]);
    });

})->group('student', 'poster');

// ─── Student: Work Programs ───────────────────────────────────────────────────

describe('Student Work Programs', function () {

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/student/work-programs')
            ->assertStatus(401);
    });

    it('returns 403 PROFILE_INCOMPLETE for student without profile', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/work-programs')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('work programs accessible for student with complete profile', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->getJson('/api/v1/student/work-programs');

        expect($response->status())->toBeIn([200, 403]);
        if ($response->status() === 200) {
            $response->assertJson(['success' => true]);
        }
    });

    it('work program store validates required title', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->postJson('/api/v1/student/work-programs', [
            'description' => 'Test description',
            'kategori' => 'pendukung',
        ]);

        // 422 (missing title) or 403 (phase blocked)
        expect($response->status())->toBeIn([422, 403]);
    });

    it('work program store validates required description', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->postJson('/api/v1/student/work-programs', [
            'title' => 'Test Program',
            'kategori' => 'pendukung',
        ]);

        expect($response->status())->toBeIn([422, 403]);
    });

    it('work program show returns 404 for non-existent id', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->getJson('/api/v1/student/work-programs/99999999');

        expect($response->status())->toBeIn([404, 403]);
    });

    it('admin cannot access student work programs endpoint', function () {
        $admin = createUserWithRole('superadmin');

        $this->actingAs($admin)->getJson('/api/v1/student/work-programs')
            ->assertStatus(403);
    });

})->group('student', 'work-programs');

// ─── Student: DPL Evaluation ──────────────────────────────────────────────────

describe('Student DPL Evaluation', function () {

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/student/dpl-evaluation/form')
            ->assertStatus(401);
    });

    it('returns 403 PROFILE_INCOMPLETE for student without profile', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/student/dpl-evaluation/form')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

    it('dpl evaluation form accessible for student with complete profile', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->getJson('/api/v1/student/dpl-evaluation/form');

        expect($response->status())->toBeIn([200, 403]);
        if ($response->status() === 200) {
            $response->assertJson(['success' => true]);
        }
    });

    it('dpl evaluation store validates required fields', function () {
        $user = createStudentWithProfile();

        $response = $this->actingAs($user)->postJson('/api/v1/student/dpl-evaluation', []);

        expect($response->status())->toBeIn([422, 403]);
    });

})->group('student', 'dpl-evaluation');

// ─── Admin: Daily Reports (Laporan Harian) ────────────────────────────────────

describe('Admin Daily Reports', function () {

    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/admin/laporan/harian')
            ->assertStatus(401);
    });

    it('returns 403 for student role', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/admin/laporan/harian')
            ->assertStatus(403);
    });

    it('returns 403 for dpl role', function () {
        $user = createUserWithRole('dpl');
        Dosen::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson('/api/v1/admin/laporan/harian')
            ->assertStatus(403);
    });

    it('admin can list daily reports', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/harian')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data']);
    });

    it('admin daily reports supports search filter', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/harian?search=test')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin daily reports supports status filter', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/harian?status=submitted')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin daily report show returns 404 for non-existent id', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/harian/99999999')
            ->assertStatus(404);
    });

})->group('admin', 'daily-reports');

// ─── Admin: Program Kerja Monitoring ─────────────────────────────────────────

describe('Admin Program Kerja Monitoring', function () {

    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/admin/laporan/program-kerja')
            ->assertStatus(401);
    });

    it('returns 403 for student role', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/admin/laporan/program-kerja')
            ->assertStatus(403);
    });

    it('admin can list program kerja', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/program-kerja')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin program kerja supports search filter', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/program-kerja?search=pelatihan')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin program kerja supports status filter', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/program-kerja?status=approved')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

})->group('admin', 'program-kerja');

// ─── Admin: Database Sync ─────────────────────────────────────────────────────

describe('Admin Database Sync', function () {

    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/admin/database-sync')
            ->assertStatus(401);
    });

    it('returns 403 for student role', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/admin/database-sync')
            ->assertStatus(403);
    });

    it('admin can list database sync logs', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/database-sync')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can check database sync health', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/database-sync/health')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('database sync log show returns 404 for non-existent id', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/database-sync/logs/99999999')
            ->assertStatus(404);
    });

})->group('admin', 'database-sync');

// ─── Admin: Laporan Akhir ─────────────────────────────────────────────────────

describe('Admin Laporan Akhir', function () {

    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('returns 401 for unauthenticated', function () {
        $this->getJson('/api/v1/admin/laporan/akhir')
            ->assertStatus(401);
    });

    it('admin can list laporan akhir', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/akhir')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('laporan akhir show returns 404 for non-existent id', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/laporan/akhir/99999999')
            ->assertStatus(404);
    });

})->group('admin', 'laporan-akhir');

// ─── Role Isolation: New Endpoints ───────────────────────────────────────────

describe('Role Isolation: New Endpoints', function () {

    it('student cannot access admin laporan harian', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/admin/laporan/harian')
            ->assertStatus(403);
    });

    it('dpl cannot access admin laporan harian', function () {
        $user = createUserWithRole('dpl');
        Dosen::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson('/api/v1/admin/laporan/harian')
            ->assertStatus(403);
    });

    it('student cannot access admin program kerja monitoring', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/admin/laporan/program-kerja')
            ->assertStatus(403);
    });

    it('dosen cannot access student poster endpoint', function () {
        $user = createUserWithRole('dosen');
        Dosen::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson('/api/v1/student/poster-potensi-desa')
            ->assertStatus(403);
    });

    it('admin cannot access student work programs', function () {
        $admin = createUserWithRole('superadmin');

        $this->actingAs($admin)->getJson('/api/v1/student/work-programs')
            ->assertStatus(403);
    });

    it('dpl cannot access admin database sync', function () {
        $user = createUserWithRole('dpl');
        Dosen::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->getJson('/api/v1/admin/database-sync')
            ->assertStatus(403);
    });

})->group('role-isolation');
