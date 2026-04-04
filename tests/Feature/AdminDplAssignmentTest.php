<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDplAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_superadmin_can_open_dpl_assignment_page_with_expected_data(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Dosen::factory()->create();
        $period = Periode::factory()->active()->create();
        KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => Lokasi::factory(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dpl.assignment'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dpl/Assignment')
                ->has('assignments')
                ->has('groups', 1)
                ->has('allDosen', 1)
                ->has('allPeriods', 1)
            );
    }

    public function test_superadmin_can_assign_dpl_to_period_and_group(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $dosen = Dosen::factory()->create();
        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => Lokasi::factory(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.dpl.assign-period'), [
                'dosen_id' => $dosen->id,
                'period_id' => $period->id,
                'max_groups' => 3,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('dpl_periods', [
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 3,
            'is_active' => true,
        ], 'kkn');

        $dplPeriodId = \App\Models\KKN\DplPeriod::query()
            ->where('dosen_id', $dosen->id)
            ->where('period_id', $period->id)
            ->value('id');

        $this->actingAs($admin)
            ->post(route('admin.dpl.assign-group', $group), [
                'dpl_period_id' => $dplPeriodId,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('kelompok_kkn', [
            'id' => $group->id,
            'dpl_id' => $dosen->id,
            'dpl_period_id' => $dplPeriodId,
        ], 'kkn');
    }
}
