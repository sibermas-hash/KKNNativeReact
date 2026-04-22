<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDplRegistrationPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_superadmin_can_open_dpl_registration_page_with_postgres_safe_status_sorting(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $period = Periode::factory()->registration()->create();

        $pendingRegistration = DplPeriod::query()->create([
            'dosen_id' => Dosen::factory()->create(['nama' => 'DPL Pending'])->id,
            'periode_id' => $period->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
            'status' => 'pending',
        ]);
        $pendingRegistration->forceFill([
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ])->save();

        $approvedRegistration = DplPeriod::query()->create([
            'dosen_id' => Dosen::factory()->create(['nama' => 'DPL Approved'])->id,
            'periode_id' => $period->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
            'status' => 'approved',
        ]);
        $approvedRegistration->forceFill([
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ])->save();

        $rejectedRegistration = DplPeriod::query()->create([
            'dosen_id' => Dosen::factory()->create(['nama' => 'DPL Rejected'])->id,
            'periode_id' => $period->id,
            'max_kelompok_kkn' => 5,
            'is_active' => false,
            'status' => 'rejected',
        ]);
        $rejectedRegistration->forceFill([
            'created_at' => now(),
            'updated_at' => now(),
        ])->save();

        $this->actingAs($admin)
            ->get(route('admin.dpl.pendaftaran', ['period_id' => $period->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Dpl/Registration')
                ->has('registrations', 3)
                ->where('registrations.0.status', 'pending')
                ->where('registrations.0.dosen.nama', 'DPL Pending')
                ->where('registrations.1.status', 'approved')
                ->where('registrations.1.dosen.nama', 'DPL Approved')
                ->where('registrations.2.status', 'rejected')
                ->where('registrations.2.dosen.nama', 'DPL Rejected')
            );
    }
}
