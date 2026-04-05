<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
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
            'period_id' => $period->id,
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
        ], 'kkn');
    }

    public function test_faculty_scoped_registration_stats_only_include_the_assigned_faculty(): void
    {
        $facultyA = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);
        $facultyB = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
        $period = Periode::factory()->active()->create();

        $facultyScopedAdmin = User::factory()->create([
            'faculty_id' => $facultyA->id,
        ]);
        $facultyScopedAdmin->assignRole('superadmin');
        $facultyScopedAdmin->assignRole('faculty_admin');

        $studentAUser = User::factory()->create();
        $studentAUser->assignRole('student');
        $studentAMahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentAUser->id,
            'faculty_id' => $facultyA->id,
        ]);

        $studentBUser = User::factory()->create();
        $studentBUser->assignRole('student');
        $studentBMahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentBUser->id,
            'faculty_id' => $facultyB->id,
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $studentAMahasiswa->id,
            'period_id' => $period->id,
            'status' => 'pending',
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $studentBMahasiswa->id,
            'period_id' => $period->id,
            'status' => 'approved',
        ]);

        $this->actingAs($facultyScopedAdmin)
            ->get(route('admin.pendaftaran.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Registrations/Index')
                ->where('stats.total', 1)
                ->where('stats.pending', 1)
                ->where('stats.approved', 0)
                ->has('stats.by_faculty', 1)
                ->where('stats.by_faculty.0.faculty_name', 'Fakultas Dakwah')
                ->where('stats.by_faculty.0.count', 1)
            );
    }
}
