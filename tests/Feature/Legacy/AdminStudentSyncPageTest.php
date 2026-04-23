<?php

namespace Tests\Feature\Legacy;

use App\Models\KKN\Mahasiswa;
use App\Models\User;
use App\Services\StudentSyncService;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Tests\TestCase;

class AdminStudentSyncPageTest extends TestCase
{
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create([
            'username' => 'superadmin_sync',
            'name' => 'Superadmin Sync',
            'email' => 'superadmin-sync@example.test',
        ]);
        $this->admin->assignRole('superadmin');
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_sync_page_shows_bulk_and_targeted_sync_summary(): void
    {
        $user = User::factory()->create(['username' => '24030001']);

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nim' => '24030001',
            'nama' => 'Mahasiswa Sync',
            'master_id' => '1001',
            'master_synced_at' => Carbon::parse('2026-04-06 09:00:00'),
        ]);

        $this->actingAs($this->admin)
            ->get('/admin/mahasiswa/sinkron')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Academic/Students/Sync')
                ->where('summary.local_students', 1)
                ->where('summary.with_master_link', 1)
                ->where('summary.last_synced_at', '2026-04-06 09:00:00')
            );
    }

    public function test_sync_page_can_sync_specific_nim_list(): void
    {
        $mock = Mockery::mock(StudentSyncService::class);
        $mock->shouldReceive('syncFromApi')
            ->once()
            ->with(['24030001', '24030002'])
            ->andReturn([
                'total' => 2,
                'synced' => 2,
                'errors' => 0,
                'log' => [],
            ]);

        $this->app->instance(StudentSyncService::class, $mock);

        $this->actingAs($this->admin)
            ->post('/admin/mahasiswa/sinkron', [
                'nim_list' => "24030001\n24030002,24030001",
            ])
            ->assertRedirect()
            ->assertSessionHas('success');
    }
}
