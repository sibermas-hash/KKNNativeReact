<?php

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use App\Notifications\Auth\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;

describe('Admin user management API', function () {
    beforeEach(function () {
        $this->superadmin = createUserWithRole('superadmin');
    });

    it('returns the fields required by the admin pengguna edit modal', function () {
        $fakultas = Fakultas::factory()->create();
        $prodi = Prodi::factory()->create(['fakultas_id' => $fakultas->id]);

        $studentUser = User::factory()->create([
            'username' => 'modal-student',
            'name' => 'Modal Student',
            'email' => 'modal-student@example.test',
            'fakultas_id' => $fakultas->id,
        ]);
        $studentUser->assignRole('student');

        Mahasiswa::create([
            'user_id' => $studentUser->id,
            'nim' => '221234567890',
            'nama' => 'Modal Student',
            'fakultas_id' => $fakultas->id,
            'prodi_id' => $prodi->id,
            'batch_year' => 2022,
            'semester' => 8,
            'sks_completed' => 120,
            'gpa' => 3.55,
            'status_bta_ppi' => 'LULUS',
            'status_aktif' => 'AKTIF',
            'is_paid_ukt' => true,
            'gender' => 'L',
            'shirt_size' => 'L',
            'birth_place' => 'Purwokerto',
            'birth_date' => '2002-01-15',
            'marital_status' => 'BELUM',
            'alamat' => 'Jl. Mahasiswa 1',
            'phone' => '08123456789',
            'api_email' => 'student-api@example.test',
            'mother_name' => 'Ibu Student',
            'nik' => '3302010101010001',
        ]);

        $lecturerUser = User::factory()->create([
            'username' => 'modal-dosen',
            'name' => 'Modal Dosen',
            'email' => 'modal-dosen@example.test',
            'fakultas_id' => $fakultas->id,
        ]);
        $lecturerUser->assignRole('dosen');

        Dosen::create([
            'user_id' => $lecturerUser->id,
            'nip' => '198001012006041001',
            'nama' => 'Modal Dosen',
            'nama_gelar' => 'Dr. Modal Dosen',
            'nidn' => '0015018001',
            'nik' => '3302010101010002',
            'phone' => '08129876543',
            'jabatan' => 'Lektor',
            'pendidikan_terakhir' => 'S3',
            'golongan' => 'III/c',
            'pangkat' => 'Penata',
            'birth_date' => '1980-01-15',
            'tempat_lahir' => 'Banyumas',
            'gender' => 'P',
            'alamat' => 'Jl. Dosen 2',
            'status_aktif' => 'AKTIF',
            'status_pegawai' => 'PNS',
            'is_cpns' => false,
            'is_tugas_belajar' => false,
            'fakultas_id' => $fakultas->id,
        ]);

        $this->actingAs($this->superadmin)
            ->getJson("/api/v1/admin/pengguna/{$studentUser->id}")
            ->assertOk()
            ->assertJsonPath('data.user.fakultas_id', $fakultas->id)
            ->assertJsonPath('data.mahasiswa.fakultas_id', $fakultas->id)
            ->assertJsonPath('data.mahasiswa.prodi_id', $prodi->id)
            ->assertJsonPath('data.mahasiswa.phone', '08123456789')
            ->assertJsonPath('data.mahasiswa.alamat', 'Jl. Mahasiswa 1')
            ->assertJsonPath('data.mahasiswa.api_email', 'student-api@example.test')
            ->assertJsonPath('data.mahasiswa.marital_status', 'BELUM');

        $this->actingAs($this->superadmin)
            ->getJson("/api/v1/admin/pengguna/{$lecturerUser->id}")
            ->assertOk()
            ->assertJsonPath('data.user.fakultas_id', $fakultas->id)
            ->assertJsonPath('data.dosen.fakultas_id', $fakultas->id)
            ->assertJsonPath('data.dosen.pendidikan_terakhir', 'S3');
    });

    it('keeps role filter scoped when search is applied', function () {
        $student = User::factory()->create([
            'username' => 'student-audit-scope',
            'name' => 'Audit Scope',
            'email' => 'student-scope@example.test',
        ]);
        $student->assignRole('student');

        $dosen = User::factory()->create([
            'username' => 'dosen-audit-scope',
            'name' => 'Audit Scope',
            'email' => 'dosen-scope@example.test',
        ]);
        $dosen->assignRole('dosen');

        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/pengguna?search=Audit%20Scope&role=dosen');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $dosen->id);
    });

    it('supports paginating pengguna per batch', function () {
        User::factory()->count(30)->create()->each(function (User $user): void {
            $user->assignRole('student');
        });

        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/pengguna?page=2&per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 10);
    });

    it('filters pengguna by fakultas and active status', function () {
        $fakultasA = Fakultas::factory()->create();
        $fakultasB = Fakultas::factory()->create();

        $inactiveFacultyUser = User::factory()->create([
            'username' => 'inactive-faculty-user',
            'name' => 'Inactive Faculty User',
            'email' => 'inactive-faculty-user@example.test',
            'fakultas_id' => $fakultasA->id,
            'is_active' => false,
        ]);
        $inactiveFacultyUser->assignRole('student');

        $activeFacultyUser = User::factory()->create([
            'username' => 'active-faculty-user',
            'name' => 'Active Faculty User',
            'email' => 'active-faculty-user@example.test',
            'fakultas_id' => $fakultasA->id,
            'is_active' => true,
        ]);
        $activeFacultyUser->assignRole('student');

        $otherFacultyUser = User::factory()->create([
            'username' => 'other-faculty-user',
            'name' => 'Other Faculty User',
            'email' => 'other-faculty-user@example.test',
            'fakultas_id' => $fakultasB->id,
            'is_active' => false,
        ]);
        $otherFacultyUser->assignRole('student');

        $response = $this->actingAs($this->superadmin)
            ->getJson("/api/v1/admin/pengguna?fakultas_id={$fakultasA->id}&is_active=0");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $inactiveFacultyUser->id)
            ->assertJsonPath('data.0.is_active', false)
            ->assertJsonPath('data.0.fakultas_id', $fakultasA->id);
    });

    it('prevents superadmin from disabling their own account', function () {
        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/pengguna/{$this->superadmin->id}/ubah-status");

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'FORBIDDEN');

        expect($this->superadmin->fresh()->is_active)->toBeTrue();
    });

    it('prevents demoting the last active superadmin', function () {
        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/pengguna/{$this->superadmin->id}/role", [
                'role' => 'admin',
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'FORBIDDEN');

        expect($this->superadmin->fresh()->hasRole('superadmin'))->toBeTrue();
    });

    it('sends a reset link instead of rotating the password immediately', function () {
        Notification::fake();

        $user = User::factory()->create([
            'username' => 'reset-link-user',
            'email' => 'reset-link-user@example.test',
            'password' => 'CurrentPassword123!',
            'must_change_password' => false,
        ]);
        $user->assignRole('student');
        $originalHash = $user->password;

        $response = $this->actingAs($this->superadmin)
            ->postJson("/api/v1/admin/pengguna/{$user->id}/reset-password");

        $response->assertOk()
            ->assertJsonPath('data.delivery', 'email')
            ->assertJsonPath('data.email_sent', true);

        expect($user->fresh()->password)->toBe($originalHash);
        Notification::assertSentTo($user, ResetPasswordNotification::class);
    });

    it('rejects admin-triggered reset when the user has no email', function () {
        Notification::fake();

        $user = User::factory()->create([
            'username' => 'no-email-user',
            'email' => null,
        ]);
        $user->assignRole('student');

        $response = $this->actingAs($this->superadmin)
            ->postJson("/api/v1/admin/pengguna/{$user->id}/reset-password");

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');

        Notification::assertNothingSent();
    });
})->group('admin');
