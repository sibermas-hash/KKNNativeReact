<?php

namespace Tests\Feature;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\PoskoKelompok;
use App\Models\KKN\Workshop;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentDailyReportGpsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_student_can_submit_daily_report_with_gps_metadata_inside_allowed_radius(): void
    {
        Storage::fake('local');
        [$user, $mahasiswa, $group] = $this->createStudentContext();

        $this->actingAs($user)
            ->post(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'category' => 'program_unggulan',
                'abcd_stage' => 'discovery',
                'title' => 'Kegiatan Posyandu Desa',
                'activity' => 'Pendampingan kegiatan posyandu di balai desa.',
                'reflection' => 'Koordinasi dengan kader berjalan baik.',
                'output' => 'Data peserta posyandu dan dokumentasi kegiatan.',
                'location_name' => 'Balai Desa',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'files' => [
                    UploadedFile::fake()->image('bukti1.jpg', 640, 480),
                ],
            ])
            ->assertRedirect(route('student.laporan-harian.index'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('kegiatan_kkn', [
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'title' => 'Kegiatan Posyandu Desa',
            'location_name' => 'Balai Desa',
            'location_source' => 'gps',
        ]);
    }

    public function test_student_cannot_submit_daily_report_outside_allowed_radius(): void
    {
        Storage::fake('local');
        [$user] = $this->createStudentContext();

        $this->from(route('student.laporan-harian.create'))
            ->actingAs($user)
            ->post(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'category' => 'program_unggulan',
                'abcd_stage' => 'discovery',
                'title' => 'Laporan di luar wilayah',
                'activity' => 'Mahasiswa mencoba mengirim dari lokasi yang jauh.',
                'location_name' => 'Lokasi Tidak Valid',
                'latitude' => '-7.30000000',
                'longitude' => '109.50000000',
                'gps_accuracy' => '22.00',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'files' => [
                    UploadedFile::fake()->image('bukti1.jpg', 640, 480),
                ],
            ])
            ->assertRedirect(route('student.laporan-harian.create'))
            ->assertSessionHasErrors('latitude');
    }

    public function test_student_can_submit_daily_report_via_json_sync_channel(): void
    {
        Storage::fake('local');
        [$user] = $this->createStudentContext();

        $this->actingAs($user)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'category' => 'shilaturrahmi',
                'abcd_stage' => 'discovery',
                'title' => 'Sinkronisasi Offline',
                'activity' => 'Laporan ini dikirim ulang dari antrean offline.',
                'location_name' => 'Posko Kelompok',
                'latitude' => '-7.42441000',
                'longitude' => '109.23071000',
                'gps_accuracy' => '15.00',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'files' => [
                    UploadedFile::fake()->image('bukti1.jpg', 640, 480),
                ],
            ])
            ->assertCreated()
            ->assertJson([
                'message' => 'Laporan harian berhasil dikirim.',
            ]);

        $this->assertDatabaseHas('kegiatan_kkn', [
            'title' => 'Sinkronisasi Offline',
            'location_source' => 'gps',
        ]);
    }

    /**
     * @return array{0: User, 1: Mahasiswa, 2: KelompokKkn}
     */
    private function createStudentContext(): array
    {
        static $counter = 0;
        $counter++;

        $period = Periode::factory()->execution()->create([
            'name' => "Period for GPS Test {$counter}",
        ]);

        $user = User::factory()->create([
            'username' => "student_daily_gps_{$counter}",
            'email' => "student_daily_gps_{$counter}@test.com",
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        $location = Lokasi::factory()->create([
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
        ]);

        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
        ]);

        PoskoKelompok::create([
            'kelompok_id' => $group->id,
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
            'photo_path' => 'posko-photos/demo-posko.jpg',
            'photo_name' => 'demo-posko.jpg',
            'photo_size' => 1024,
            'uploaded_by' => $user->id,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'periode_id' => $group->periode_id,
            'role' => 'Anggota',
        ]);

        $workshop = Workshop::create([
            'title' => 'Pembekalan Wajib',
            'description' => 'Pembekalan dasar sebelum laporan harian.',
            'methodology' => 'Workshop',
            'workshop_date' => now()->subDay()->toDateString(),
            'start_time' => '08:00',
            'end_time' => '10:00',
            'location' => 'Aula Kampus',
            'status' => 'completed',
        ]);

        PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $user->id,
            'registered_at' => now()->subDay(),
            'attendance_status' => 'attended',
            'checked_in_at' => now()->subDay(),
        ]);

        return [$user, $mahasiswa, $group];
    }
}
