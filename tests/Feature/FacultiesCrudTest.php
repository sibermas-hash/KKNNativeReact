<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacultiesCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

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
        $response = $this->actingAs($this->admin)->get('/admin/faculties');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Faculties/Index')
                ->where('syncInfo.mode', 'sync-only')
                ->where('syncInfo.source', 'Master Mahasiswa')
            );
    }

    public function test_store_is_blocked_because_faculties_are_sync_only(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/faculties', [
            'code' => 'TSTCR',
            'name' => 'Test Create Faculty',
        ]);

        $response->assertSessionHas('error', 'Data fakultas mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');
        $this->assertFalse(Fakultas::where('code', 'TSTCR')->exists(), 'Faculty should not be created manually');
    }

    public function test_update_is_blocked_because_faculties_are_sync_only(): void
    {
        $faculty = Fakultas::create(['code' => 'TSTUP', 'nama' => 'Before Update']);

        $response = $this->actingAs($this->admin)->put("/admin/faculties/{$faculty->id}", [
            'code' => 'TSTUP2',
            'name' => 'After Update',
        ]);

        $response->assertSessionHas('error', 'Data fakultas mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');

        $faculty->refresh();
        $this->assertSame('TSTUP', $faculty->code);
        $this->assertSame('Before Update', $faculty->nama);
    }

    public function test_destroy_is_blocked_because_faculties_are_sync_only(): void
    {
        $faculty = Fakultas::create(['code' => 'TSTDL', 'nama' => 'To Delete']);

        $response = $this->actingAs($this->admin)->delete("/admin/faculties/{$faculty->id}");

        $response->assertSessionHas('error', 'Data fakultas mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.');
        $this->assertNotNull(Fakultas::find($faculty->id), 'Faculty should not be deleted manually');
    }
}
