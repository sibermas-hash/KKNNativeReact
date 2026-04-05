<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDplAssignmentTest extends TestCase
{
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
                ->has('districts')
                ->has('districtCoordinators')
            );
    }

    public function test_superadmin_can_activate_dpl_for_period_and_create_login_account(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);

        $dosen = Dosen::factory()->create([
            'user_id' => null,
            'nip' => '198700010001',
        ]);
        $period = Periode::factory()->active()->create();

        $this->actingAs($admin)
            ->from(route('admin.dpl.assignment'))
            ->post(route('admin.dpl.assign-period'), [
                'dosen_id' => $dosen->id,
                'period_id' => $period->id,
                'max_groups' => 3,
            ])
            ->assertRedirect(route('admin.dpl.assignment'));

        $this->assertDatabaseHas('dpl_periods', [
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 3,
            'is_active' => true,
        ], 'kkn');

        $dplPeriodId = DplPeriod::query()
            ->where('dosen_id', $dosen->id)
            ->where('period_id', $period->id)
            ->value('id');

        $user = User::query()->where('username', $dosen->nip)->first();

        $this->assertNotNull($user);
        $this->assertTrue((bool) $user->must_change_password);
        $this->assertTrue($user->hasRole('dpl'));
        $this->assertDatabaseHas('dosen', [
            'id' => $dosen->id,
            'user_id' => $user->id,
        ], 'kkn');
        $this->assertNotNull($dplPeriodId);
    }

    public function test_superadmin_can_assign_dpl_to_group_and_district_after_activation(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);

        $district = Lokasi::factory()->create([
            'district_id' => '3301010',
            'district_name' => 'Kecamatan Demo',
            'regency_name' => 'Kabupaten Demo',
        ]);

        $dosen = Dosen::factory()->create([
            'user_id' => null,
            'nip' => '198700010002',
        ]);
        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $district->id,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.dpl.assignment'))
            ->post(route('admin.dpl.assign-period'), [
                'dosen_id' => $dosen->id,
                'period_id' => $period->id,
                'max_groups' => 3,
            ])
            ->assertRedirect(route('admin.dpl.assignment'));

        $dplPeriodId = DplPeriod::query()
            ->where('dosen_id', $dosen->id)
            ->where('period_id', $period->id)
            ->value('id');

        $this->actingAs($admin)
            ->from(route('admin.dpl.assignment'))
            ->post(route('admin.dpl.assign-group', $group), [
                'dpl_period_id' => $dplPeriodId,
            ])
            ->assertRedirect(route('admin.dpl.assignment'));

        $this->assertDatabaseHas('kelompok_kkn', [
            'id' => $group->id,
            'dpl_id' => $dosen->id,
            'dpl_period_id' => $dplPeriodId,
        ], 'kkn');

        $this->actingAs($admin)
            ->from(route('admin.dpl.assignment'))
            ->post(route('admin.dpl.assign-district'), [
                'dosen_id' => $dosen->id,
                'period_id' => $period->id,
                'district_id' => '3301010',
                'max_groups' => 3,
            ])
            ->assertRedirect(route('admin.dpl.assignment'));

        $this->assertDatabaseHas('dpl_kecamatan_assignments', [
            'dpl_period_id' => $dplPeriodId,
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'district_id' => '3301010',
            'district_name' => 'Kecamatan Demo',
            'is_active' => true,
        ], 'kkn');
    }
}
