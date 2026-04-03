<?php

namespace Tests\Feature;

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\SlotTerkunci;
use App\Models\KKN\Workshop;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StudentFullLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    private function createStudent()
    {
        $user = User::factory()->create();
        $user->assignRole('student');
        
        $fakultas = Fakultas::factory()->create(['nama' => 'Fakultas Tarbiyah']);
        $prodi = Prodi::factory()->create(['faculty_id' => $fakultas->id]);

        $student = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'faculty_id' => $fakultas->id,
            'program_id' => $prodi->id,
            'sks_completed' => 110,
            'is_bta_ppi_passed' => true,
            'health_certificate_path' => 'test/health.pdf',
            'parent_permission_path' => 'test/parent.pdf',
        ]);

        return [$user, $student, $fakultas];
    }

    /** @test */
    public function student_cannot_register_to_group_with_different_faculty_restriction()
    {
        [$user, $student, $myFaculty] = $this->createStudent();
        $otherFaculty = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
        
        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
            'capacity' => 1,
        ]);
        SlotTerkunci::create([
            'kelompok_id' => $group->id,
            'tipe_slot' => 'fakultas',
            'fakultas_id' => $otherFaculty->id,
            'kuota_slot' => 1,
        ]);

        $response = $this->actingAs($user)
            ->from(route('student.registration.create'))
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
                'kelompok_id' => $group->id,
            ]);

        $response->assertRedirect(route('student.registration.create'));
        $response->assertSessionHasErrors('kelompok_id');
        $this->assertTrue(session('errors')->get('kelompok_id')[0] !== null);
    }

    /** @test */
    public function student_can_register_to_unrestricted_group()
    {
        [$user, $student, $myFaculty] = $this->createStudent();
        
        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
                'kelompok_id' => $group->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('peserta_kkn', [
            'mahasiswa_id' => $student->id,
            'kelompok_id' => $group->id,
        ], 'kkn');
    }

    /** @test */
    public function student_can_submit_smart_attendance_and_get_score()
    {
        [$user, $student] = $this->createStudent();
        
        $workshop = Workshop::create([
            'title' => 'Pembekalan Day 1',
            'workshop_date' => now(),
            'start_time' => '08:00',
            'active_token' => 'KKN123',
            'latitude' => -7.4244,
            'longitude' => 109.2307,
            'radius_meters' => 100,
            'status' => 'scheduled'
        ]);

        // Register student to workshop
        PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $user->id,
            'attendance_status' => 'registered'
        ]);

        // Mock a registration to KKN to ensure score syncing works
        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create(['period_id' => $period->id]);
        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $student->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id
        ]);

        // Submit attendance via service (Controller logic)
        $service = app(\App\Services\WorkshopService::class);
        $service->submitSelfAttendance(
            $workshop->id,
            $user->id,
            -7.4244, // Exact location
            109.2307,
            'KKN123',
            'device_123',
            '127.0.0.1'
        );

        $this->assertDatabaseHas('peserta_workshop', [
            'user_id' => $user->id,
            'attendance_status' => 'attended'
        ], 'kkn');

        // Verify score is synced (Admin components)
        $this->assertDatabaseHas('nilai_kkn', [
            'user_id' => $user->id,
            'workshop_score' => 100
        ], 'kkn');
    }

    /** @test */
    public function certificate_cannot_be_generated_if_final_report_not_approved()
    {
        [$user, $student] = $this->createStudent();
        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create(['period_id' => $period->id]);
        
        $score = NilaiKkn::create([
            'user_id' => $user->id,
            'mahasiswa_id' => $student->id,
            'kelompok_id' => $group->id,
            'total_score' => 85,
            'letter_grade' => 'A',
            'is_finalized' => true
        ]);

        $service = app(\App\Services\CertificateService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Laporan akhir belum disetujui DPL');
        
        $service->generateForStudent($score);
    }
}
