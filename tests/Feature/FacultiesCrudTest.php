<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacultiesCrudTest extends TestCase
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
        $response = $this->actingAs($this->admin)->get(route('admin.fakultas.index'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/MasterData/Faculties/Index')
                ->where('syncInfo.mode', 'sync-only')
                ->where('syncInfo.source', 'Master Mahasiswa')
            );
    }

    public function test_store_is_blocked_because_faculties_are_sync_only(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.fakultas.store'), [
            'code' => 'TSTCR',
            'nama' => 'Test Create Faculty',
        ]);

        $response->assertSessionHas('error', 'Data fakultas mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');
        $this->assertFalse(Fakultas::where('code', 'TSTCR')->exists(), 'Faculty should not be created manually');
    }

    public function test_update_is_blocked_because_faculties_are_sync_only(): void
    {
        $faculty = Fakultas::create(['code' => 'TSTUP', 'nama' => 'Before Update']);

        $response = $this->actingAs($this->admin)->put(route('admin.fakultas.update', $faculty), [
            'code' => 'TSTUP2',
            'nama' => 'After Update',
        ]);

        $response->assertSessionHas('error', 'Data fakultas mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');

        $faculty->refresh();
        $this->assertSame('TSTUP', $faculty->code);
        $this->assertSame('Before Update', $faculty->nama);
    }

    public function test_destroy_is_blocked_because_faculties_are_sync_only(): void
    {
        $faculty = Fakultas::create(['code' => 'TSTDL', 'nama' => 'To Delete']);

        $response = $this->actingAs($this->admin)->delete(route('admin.fakultas.destroy', $faculty));

        $response->assertSessionHas('error', 'Data fakultas mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');
        $this->assertNotNull(Fakultas::find($faculty->id), 'Faculty should not be deleted manually');
    }
}
