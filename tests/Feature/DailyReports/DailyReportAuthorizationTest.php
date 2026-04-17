<?php

namespace Tests\Feature\DailyReports;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Tests\TestCase;

class DailyReportAuthorizationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /** @test */
    public function students_can_create_daily_reports(): void
    {
        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
        ]);

        $user = User::factory()->create();
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'period_id' => $period->id,
        ]);

        PoskoKelompok::create([
            'kelompok_id' => $group->id,
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
            'photo_path' => 'posko-photos/test.jpg',
            'photo_name' => 'test.jpg',
            'photo_size' => 1024,
            'uploaded_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->get(route('student.laporan-harian.create'));

        $response->assertOk();
    }

    /** @test */
    public function non_members_cannot_submit_daily_reports(): void
    {
        Periode::factory()->execution()->create();

        $student = User::factory()->create();
        $student->assignRole('student');

        Mahasiswa::factory()->create(['user_id' => $student->id]);

        // Don't add student to any group

        $response = $this->actingAs($student)->get(route('student.laporan-harian.create'));

        $response->assertForbidden();
    }

    /** @test */
    public function students_can_only_view_own_reports(): void
    {
        $period = Periode::factory()->execution()->create();

        $student1 = User::factory()->create();
        $student1->assignRole('student');
        $mhs1 = Mahasiswa::factory()->create(['user_id' => $student1->id]);

        $student2 = User::factory()->create();
        $student2->assignRole('student');
        Mahasiswa::factory()->create(['user_id' => $student2->id]);

        $group = KelompokKkn::factory()->create(['period_id' => $period->id]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mhs1->id,
            'kelompok_id' => $group->id,
            'period_id' => $period->id,
        ]);

        // Student 2 is not in the group, so the create page should be forbidden
        $response = $this->actingAs($student2)->get(route('student.laporan-harian.create'));

        $response->assertForbidden();
    }
}
