<?php

namespace Tests\Feature;

use App\Models\KKN\LogAudit;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuditLogPageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_superadmin_can_open_audit_log_index(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_audit',
            'email' => 'superadmin-audit@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $actor = User::factory()->create([
            'name' => 'Operator Audit',
            'email' => 'operator-audit@example.test',
        ]);

        LogAudit::create([
            'user_id' => $actor->id,
            'action' => 'UPDATE',
            'description' => 'Memperbarui konfigurasi sistem',
            'model_type' => User::class,
            'model_id' => $actor->id,
            'old_values' => ['name' => 'Operator Lama'],
            'new_values' => ['name' => 'Operator Audit'],
            'severity' => 'medium',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);

        $this->actingAs($superadmin)
            ->get(route('admin.audit-log.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AuditLog/Index')
                ->where('stats.total', 1)
                ->where('stats.high_risk', 0)
                ->where('stats.unique_users', 1)
                ->where('logs.meta.last_page', 1)
                ->has('logs.data', 1)
                ->where('logs.data.0.description', 'Memperbarui konfigurasi sistem')
                ->where('logs.data.0.user.name', 'Operator Audit')
            );
    }

    public function test_superadmin_can_open_audit_log_detail_page(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_audit_detail',
            'email' => 'superadmin-audit-detail@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $actor = User::factory()->create([
            'name' => 'Aktor Audit',
            'email' => 'aktor-audit@example.test',
        ]);

        $log = LogAudit::create([
            'user_id' => $actor->id,
            'action' => 'DELETE',
            'description' => 'Menghapus data dummy',
            'model_type' => User::class,
            'model_id' => $actor->id,
            'old_values' => ['status' => 'active'],
            'new_values' => ['status' => 'deleted'],
            'severity' => 'high',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ]);

        $this->actingAs($superadmin)
            ->get(route('admin.audit-log.show', $log))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AuditLog/Show')
                ->where('log.id', $log->id)
                ->where('log.action', 'DELETE')
                ->where('log.user.name', 'Aktor Audit')
            );
    }
}
