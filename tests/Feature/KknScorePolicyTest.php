<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\KKN\NilaiKkn;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class KknScorePolicyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_admin_can_view_any_score(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin);
        $this->assertTrue(Gate::allows('viewAny', NilaiKkn::class));
    }

    public function test_admin_can_create_scores(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin);
        $this->assertTrue(Gate::allows('create', NilaiKkn::class));
    }

    public function test_admin_can_finalize_scores(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $score = new NilaiKkn(['is_finalized' => false]);

        $this->actingAs($admin);
        $this->assertTrue(Gate::allows('finalize', $score));
    }

    public function test_admin_can_bulk_finalize_scores(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin);
        $this->assertTrue(Gate::allows('bulkFinalize', NilaiKkn::class));
    }

    public function test_admin_cannot_update_finalized_scores(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $score = new NilaiKkn();
        $score->is_finalized = true;

        $this->actingAs($admin);
        $this->assertFalse(Gate::allows('update', $score));
    }

    public function test_admin_can_update_non_finalized_scores(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $score = new NilaiKkn(['is_finalized' => false]);

        $this->actingAs($admin);
        $this->assertTrue(Gate::allows('update', $score));
    }

    public function test_student_cannot_create_scores(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student);
        $this->assertFalse(Gate::allows('create', NilaiKkn::class));
    }

    public function test_student_cannot_finalize_scores(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $score = new NilaiKkn(['is_finalized' => false]);

        $this->actingAs($student);
        $this->assertFalse(Gate::allows('finalize', $score));
    }

    public function test_superadmin_can_finalize_scores(): void
    {
        $superadmin = User::factory()->create();
        $superadmin->assignRole('superadmin');

        $score = new NilaiKkn(['is_finalized' => false]);

        $this->actingAs($superadmin);
        $this->assertTrue(Gate::allows('finalize', $score));
    }

    public function test_dpl_can_create_scores(): void
    {
        $dpl = User::factory()->create();
        $dpl->assignRole('dpl');

        $this->actingAs($dpl);
        $this->assertTrue(Gate::allows('create', NilaiKkn::class));
    }
}
