<?php

namespace Tests\Feature\DailyReports;

use App\Models\KelompokKkn;
use App\Models\User;
use App\Models\PesertaKkn;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyReportAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function students_can_create_daily_reports(): void
    {
        $user = User::factory()->create();
        $user->assignRole('mahasiswa');
        
        $group = KelompokKkn::factory()->create();
        $peserta = PesertaKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $group->id,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($user)->get('/student/daily-reports/create');

        $response->assertSuccessful();
    }

    /** @test */
    public function non_members_cannot_submit_daily_reports(): void
    {
        $student = User::factory()->create();
        $student->assignRole('mahasiswa');
        
        $group = KelompokKkn::factory()->create();
        // Don't add student to group

        $response = $this->actingAs($student)->get('/student/daily-reports/create');

        $response->assertStatus(403);
    }

    /** @test */
    public function students_can_only_view_own_reports(): void
    {
        $student1 = User::factory()->create();
        $student1->assignRole('mahasiswa');
        
        $student2 = User::factory()->create();
        $student2->assignRole('mahasiswa');

        $group = KelompokKkn::factory()->create();
        
        PesertaKkn::factory()->create([
            'user_id' => $student1->id,
            'kelompok_id' => $group->id,
        ]);

        // Student 2 should not see student 1's group
        $response = $this->actingAs($student2)->get("/student/daily-reports?group_id={$group->id}");

        $response->assertStatus(403);
    }
}
