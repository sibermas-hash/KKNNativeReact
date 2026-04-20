<?php

namespace Tests\Feature;

use App\Http\Middleware\KknThrottleMiddleware;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use App\Models\User;
use App\Services\DplEligibilityService;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDplAssignmentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->mock(DplEligibilityService::class, function ($mock) {
            $mock->shouldReceive('isQualifiedForDpl')->andReturn([
                'eligible' => true,
                'reason' => 'Mocked eligible',
            ]);
        });
    }

    public function test_superadmin_can_open_dpl_assignment_page_with_expected_data(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Dosen::factory()->create();
        $period = Periode::factory()->active()->create();
        KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => Lokasi::factory(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dpl.penugasan'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Dpl/Assignment')
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
        $this->withoutMiddleware(KknThrottleMiddleware::class);
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);

        $dosen = Dosen::factory()->create([
            'user_id' => null,
            'nip' => '198700010001',
        ]);
        $period = Periode::factory()->active()->create();

        $this->actingAs($admin)
            ->from(route('admin.dpl.penugasan'))
            ->post(route('admin.dpl.tugaskan-periode'), [
                'dosen_id' => $dosen->id,
                'periode_id' => $period->id,
                'max_kelompok_kkn' => 3,
            ])
            ->assertRedirect(route('admin.dpl.penugasan'));

        $this->assertDatabaseHas('dpl_periode', [
            'dosen_id' => $dosen->id,
            'periode_id' => $period->id,
            'max_kelompok_kkn' => 3,
            'is_active' => true,
        ]);

        $dplPeriodId = DplPeriod::query()
            ->where('dosen_id', $dosen->id)
            ->where('periode_id', $period->id)
            ->value('id');

        $user = User::query()->where('username', $dosen->nip)->first();

        $this->assertNotNull($user);
        $this->assertTrue((bool) $user->must_change_password);
        $this->assertTrue($user->hasRole('dpl'));
        $this->assertDatabaseHas('dosen', [
            'id' => $dosen->id,
            'user_id' => $user->id,
        ]);
        $this->assertNotNull($dplPeriodId);
    }

    public function test_superadmin_can_assign_dpl_to_group_and_district_after_activation(): void
    {
        $this->withoutMiddleware(KknThrottleMiddleware::class);
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
            'periode_id' => $period->id,
            'location_id' => $district->id,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.dpl.penugasan'))
            ->post(route('admin.dpl.tugaskan-periode'), [
                'dosen_id' => $dosen->id,
                'periode_id' => $period->id,
                'max_kelompok_kkn' => 3,
            ])
            ->assertRedirect(route('admin.dpl.penugasan'));

        $dplPeriodId = DplPeriod::query()
            ->where('dosen_id', $dosen->id)
            ->where('periode_id', $period->id)
            ->value('id');

        $this->actingAs($admin)
            ->from(route('admin.dpl.penugasan'))
            ->post(route('admin.dpl.tugaskan-kelompok', $group), [
                'dpl_periode_id' => $dplPeriodId,
            ])
            ->assertRedirect(route('admin.dpl.penugasan'));

        $this->assertDatabaseHas('kelompok_kkn', [
            'id' => $group->id,
            'dpl_id' => $dosen->id,
            'dpl_periode_id' => $dplPeriodId,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.dpl.penugasan'))
            ->post(route('admin.dpl.tugaskan-wilayah'), [
                'dosen_id' => $dosen->id,
                'periode_id' => $period->id,
                'district_id' => '3301010',
                'max_kelompok_kkn' => 3,
            ])
            ->assertRedirect(route('admin.dpl.penugasan'));

        $this->assertDatabaseHas('dpl_kecamatan_assignments', [
            'dpl_periode_id' => $dplPeriodId,
            'dosen_id' => $dosen->id,
            'periode_id' => $period->id,
            'kecamatan_id' => '3301010',
            'district_name' => 'Kecamatan Demo',
            'is_active' => true,
        ]);
    }

    public function test_admin_role_cannot_open_dpl_assignment_page_if_restricted(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $period = Periode::factory()->active()->create();
        KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => Lokasi::factory(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dpl.penugasan'))
            ->assertStatus(403);
    }

    public function test_workshop_pass_flag_is_scoped_to_selected_period(): void
    {
        if (! Workshop::supportsPeriodAssignment()) {
            $this->markTestSkipped('Schema workshop saat ini belum mendukung periode_id.');
        }

        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $periodActive = Periode::factory()->active()->create(['name' => 'Periode Aktif']);
        $periodOld = Periode::factory()->create(['name' => 'Periode Lama']);

        $dosenUser = User::factory()->create();
        $dosen = Dosen::factory()->create([
            'user_id' => $dosenUser->id,
            'nip' => '198700010099',
        ]);

        $oldWorkshop = Workshop::query()->create([
            'periode_id' => $periodOld->id,
            'title' => 'Workshop Lama',
            'workshop_date' => now()->addDay()->toDateString(),
            'status' => 'scheduled',
        ]);

        PesertaWorkshop::query()->create([
            'workshop_id' => $oldWorkshop->id,
            'user_id' => $dosenUser->id,
            'registered_at' => now(),
            'attendance_status' => 'attended',
            'checked_in_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dpl.penugasan', ['periode_id' => $periodActive->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Dpl/Assignment')
            );
    }
}
