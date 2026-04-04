<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DplMasterSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_superadmin_can_open_master_dosen_sync_page_without_creating_accounts(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        Dosen::factory()->create(['nip' => '198700010010']);

        $service = Mockery::mock(MasterApiService::class);
        $service->shouldReceive('getAllEmployees')->once()->andReturn([
            ['id' => 1, 'nip' => '198700010010', 'name' => 'Dosen Lama', 'email' => 'lama@example.test'],
            ['id' => 2, 'nip' => '198700010011', 'name' => 'Dosen Baru', 'email' => 'baru@example.test'],
        ]);
        $this->app->instance(MasterApiService::class, $service);

        $this->actingAs($admin)
            ->get(route('admin.dpl.sync'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dpl/Sync')
                ->has('availableDosen', 1)
                ->where('availableDosen.0.nip', '198700010011')
                ->where('title', 'Sinkronisasi Master Dosen')
            );
    }

    public function test_syncing_master_dosen_only_creates_local_dosen_record(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $faculty = Fakultas::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.dpl.sync.store'), [
                'master_id' => 77,
                'nip' => '198700010099',
                'name' => 'Dosen Master Baru',
                'organization_id' => $faculty->master_id,
                'birth_date' => '1987-01-01',
                'gender' => 'L',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('dosen', [
            'nip' => '198700010099',
            'nama' => 'Dosen Master Baru',
            'master_id' => 77,
            'faculty_id' => $faculty->id,
            'gender' => 'L',
        ], 'kkn');

        $this->assertDatabaseMissing('users', [
            'username' => '198700010099',
        ]);
    }
}
