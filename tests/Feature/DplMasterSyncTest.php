<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DplMasterSyncTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_superadmin_can_open_master_dosen_sync_page_without_creating_accounts(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Dosen::factory()->create([
            'nip' => '198700010010',
            'master_id' => '1',
            'master_synced_at' => now()->subHour(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dpl.sync'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Dpl/Sync')
                ->where('summary.local_lecturers', 1)
                ->where('summary.with_master_link', 1)
                ->where('title', 'Sinkronisasi Master Dosen')
            );
    }

    public function test_bulk_syncing_master_dosen_only_creates_local_dosen_record(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $faculty = Fakultas::factory()->create([
            'master_id' => 'FAC-001',
        ]);

        $service = Mockery::mock(MasterApiService::class);
        $service->shouldReceive('yieldSyncDosen')->once()->andReturn((function () use ($faculty) {
            yield [
                'id' => '77',
                'nip' => '198700010099',
                'name' => 'Dosen Master Baru',
                'organization_id' => $faculty->master_id,
                'birth_date' => '1987-01-01',
                'gender' => 'L',
            ];
        })());
        $this->app->instance(MasterApiService::class, $service);

        $this->actingAs($admin)
            ->post(route('admin.dpl.sinkron.store'))
            ->assertRedirect();

        $this->assertDatabaseHas('dosen', [
            'nip' => '198700010099',
            'nama' => 'Dosen Master Baru',
            'master_id' => '77',
            'fakultas_id' => $faculty->id,
            'gender' => 'L',
        ], 'kkn');

        $this->assertDatabaseHas('users', [
            'username' => '198700010099',
        ]);
    }

    public function test_targeted_sync_only_uses_requested_nip(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');
        Fakultas::factory()->create();

        $service = Mockery::mock(MasterApiService::class);
        $service->shouldReceive('getEmployeesByNipList')
            ->once()
            ->with(['198700010055'])
            ->andReturn([
                [
                    'id' => '55',
                    'nip' => '198700010055',
                    'name' => 'Dosen NIP Terpilih',
                ],
            ]);
        $this->app->instance(MasterApiService::class, $service);

        $this->actingAs($admin)
            ->post(route('admin.dpl.sinkron.store'), [
                'nip_list' => "198700010055\n",
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('dosen', [
            'nip' => '198700010055',
            'nama' => 'Dosen NIP Terpilih',
            'master_id' => '55',
        ], 'kkn');
    }
}
