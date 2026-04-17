<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProgramsCrudTest extends TestCase
{
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::create([
            'username' => 'admin',
            'name' => 'Super Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);
        $this->admin->assignRole('superadmin');
    }

    public function test_index_returns_200(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.prodi.index'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/MasterData/Programs/Index')
                ->where('syncInfo.mode', 'sync-only')
                ->where('syncInfo.source', 'Master Mahasiswa')
            );
    }

    public function test_store_is_blocked_because_programs_are_sync_only(): void
    {
        $faculty = Fakultas::factory()->create();

        $response = $this->actingAs($this->admin)->post(route('admin.prodi.store'), [
            'faculty_id' => $faculty->id,
            'nama' => 'Test Program',
        ]);

        $response->assertSessionHas('error', 'Data program studi mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');
        $this->assertFalse(Prodi::where('nama', 'Test Program')->exists(), 'Program should not be created manually');
    }

    public function test_update_is_blocked_because_programs_are_sync_only(): void
    {
        $faculty = Fakultas::factory()->create();
        $program = Prodi::create([
            'faculty_id' => $faculty->id,
            'code' => 'PRD1',
            'nama' => 'Before Update',
        ]);

        $response = $this->actingAs($this->admin)->put(route('admin.prodi.update', $program), [
            'faculty_id' => $faculty->id,
            'nama' => 'After Update',
        ]);

        $response->assertSessionHas('error', 'Data program studi mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');

        $program->refresh();
        $this->assertSame('Before Update', $program->nama);
    }

    public function test_destroy_is_blocked_because_programs_are_sync_only(): void
    {
        $faculty = Fakultas::factory()->create();
        $program = Prodi::create([
            'faculty_id' => $faculty->id,
            'code' => 'PRD2',
            'nama' => 'To Delete',
        ]);

        $response = $this->actingAs($this->admin)->delete(route('admin.prodi.destroy', $program));

        $response->assertSessionHas('error', 'Data program studi mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');
        $this->assertNotNull(Prodi::find($program->id), 'Program should not be deleted manually');
    }
}
