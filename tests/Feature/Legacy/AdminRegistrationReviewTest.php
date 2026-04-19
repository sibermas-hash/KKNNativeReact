<?php

namespace Tests\Feature;

use App\Enums\KknType;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminRegistrationReviewTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_admin_reject_stores_reason_without_overwriting_student_notes(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $studentUser = User::factory()->create([
            'phone' => '081111111111',
            'address' => 'Jl. Siliwangi No. 99',
        ]);
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'nik' => '3301010101011111',
            'mother_name' => 'Rohayati',
            'birth_place' => 'Banyumas',
            'birth_date' => '2003-01-01',
        ]);

        $period = Periode::factory()->active()->create();

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'pending',
            'notes' => 'Saya siap mengikuti KKN dan sudah melengkapi berkas.',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.tolak', $registration), [
                'notes' => 'Surat sehat belum terbaca jelas. Mohon unggah ulang.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('peserta_kkn', [
            'id' => $registration->id,
            'status' => 'rejected',
            'notes' => 'Saya siap mengikuti KKN dan sudah melengkapi berkas.',
            'rejection_reason' => 'Surat sehat belum terbaca jelas. Mohon unggah ulang.',
            'last_rejected_by' => $admin->id,
        ]);
    }

    public function test_faculty_scoped_registration_stats_only_include_the_assigned_faculty(): void
    {
        $facultyA = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);
        $facultyB = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
        $period = Periode::factory()->active()->create();

        $facultyScopedAdmin = User::factory()->create([
            'fakultas_id' => $facultyA->id,
        ]);
        $facultyScopedAdmin->assignRole('superadmin');
        $facultyScopedAdmin->assignRole('faculty_admin');

        $studentAUser = User::factory()->create();
        $studentAUser->assignRole('student');
        $studentAMahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentAUser->id,
            'fakultas_id' => $facultyA->id,
        ]);

        $studentBUser = User::factory()->create();
        $studentBUser->assignRole('student');
        $studentBMahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentBUser->id,
            'fakultas_id' => $facultyB->id,
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $studentAMahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'pending',
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $studentBMahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'approved',
        ]);

        $this->actingAs($facultyScopedAdmin)
            ->get(route('admin.pendaftaran.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Registrations/Index')
            );
    }

    public function test_admin_registration_detail_includes_uploaded_student_documents(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $studentUser = User::factory()->create();
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'health_certificate_path' => 'health-certificates/surat-sehat.pdf',
            'parent_permission_path' => 'parent-permissions/izin-ortu.pdf',
        ]);

        $period = Periode::factory()->active()->create();

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'approved',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.pendaftaran.show', $registration))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Registrations/Show')
                ->has('registration.dokumen', 2)
                ->where('registration.periode.governance.program_type_label', 'KKN Reguler')
                ->where('registration.dokumen.0.type', 'health_certificate')
                ->where('registration.dokumen.1.type', 'parent_permission')
            );
    }

    public function test_admin_approval_for_regular_program_assigns_group_automatically_after_review(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $studentUser = User::factory()->create([
            'phone' => '081333333333',
            'address' => 'Jl. Mawar No. 1',
            'domicile_village_name' => 'Desa Asal',
            'domicile_district_name' => 'Kecamatan Asal',
            'domicile_regency_name' => 'Kabupaten Asal',
            'address_verified_at' => now(),
        ]);
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'health_certificate_path' => 'health-certificates/surat-sehat.pdf',
            'parent_permission_path' => 'parent-permissions/izin-ortu.pdf',
        ]);

        $period = Periode::factory()->active()->create([
            'jenis' => KknType::REGULER,
            'program_type' => Periode::PROGRAM_TYPE_REGULER,
            'registration_mode' => Periode::REGISTRATION_MODE_OPEN,
            'placement_mode' => Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
        ]);

        KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'status' => 'active',
            'location_id' => Lokasi::factory()->create([
                'village_name' => 'Desa Asal',
                'district_name' => 'Kecamatan Asal',
                'regency_name' => 'Kabupaten Asal',
            ])->id,
        ]);

        $eligibleGroup = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'status' => 'active',
            'location_id' => Lokasi::factory()->create([
                'village_name' => 'Desa Penempatan',
                'district_name' => 'Kecamatan Penempatan',
                'regency_name' => 'Kabupaten Lain',
            ])->id,
        ]);

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'kelompok_id' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.setujui', $registration))
            ->assertRedirect();

        $this->assertDatabaseHas('peserta_kkn', [
            'id' => $registration->id,
            'status' => 'approved',
            'kelompok_id' => $eligibleGroup->id,
            'approved_by' => $admin->id,
        ]);
    }

    public function test_admin_cannot_assign_student_to_group_from_different_period(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $studentUser = User::factory()->create();
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
        ]);

        $period = Periode::factory()->active()->create();
        $otherPeriod = Periode::factory()->create();

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'pending',
        ]);

        $foreignGroup = KelompokKkn::factory()->create([
            'periode_id' => $otherPeriod->id,
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.tugaskan-kelompok', $registration), [
                'kelompok_id' => $foreignGroup->id,
            ])
            ->assertSessionHasErrors('kelompok_id');

        $this->assertDatabaseHas('peserta_kkn', [
            'id' => $registration->id,
            'kelompok_id' => null,
        ]);
    }

    public function test_admin_cannot_manually_assign_pending_registration_to_group(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $studentUser = User::factory()->create();
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
        ]);

        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'status' => 'active',
        ]);

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.tugaskan-kelompok', $registration), [
                'kelompok_id' => $group->id,
            ])
            ->assertSessionHasErrors('kelompok_id');

        $this->assertDatabaseHas('peserta_kkn', [
            'id' => $registration->id,
            'kelompok_id' => null,
            'status' => 'pending',
        ]);
    }

    public function test_bulk_approve_rejects_registration_when_assigned_group_is_invalid(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $studentUser = User::factory()->create();
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
        ]);

        $period = Periode::factory()->active()->create();
        $otherPeriod = Periode::factory()->create();
        $foreignGroup = KelompokKkn::factory()->create([
            'periode_id' => $otherPeriod->id,
            'status' => 'active',
        ]);

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'kelompok_id' => $foreignGroup->id,
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.pendaftaran.setuju-massal'), [
                'ids' => [$registration->id],
            ])
            ->assertSessionHasErrors('kelompok_id');

        $this->assertDatabaseHas('peserta_kkn', [
            'id' => $registration->id,
            'status' => 'pending',
        ]);
    }
}
