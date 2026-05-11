<?php

declare(strict_types=1);

use App\Models\KKN\LogAudit;
use App\Models\KKN\Mahasiswa;

/*
 * AuditObserver + LogAuditController behavior.
 *
 * The observer is registered on a specific set of models in
 * AppServiceProvider::boot() (NilaiKkn, Laporan, KegiatanKkn, Mahasiswa,
 * Evaluasi, KonfigurasiSertifikat). We pick Mahasiswa as the vehicle.
 */

beforeEach(function () {
    LogAudit::query()->delete();
});

it('observer does nothing when no user is authenticated', function () {
    // No actingAs — system writes should not pollute the audit log.
    Mahasiswa::factory()->create();

    expect(LogAudit::count())->toBe(0);
});

it('observer logs CREATE with new_values and high severity for score models', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $m = Mahasiswa::factory()->create(['nama' => 'Budi']);

    $log = LogAudit::latest('id')->first();
    expect($log)->not->toBeNull();
    expect($log->action)->toBe('CREATE');
    expect($log->user_id)->toBe($actor->id);
    expect($log->model_type)->toBe(Mahasiswa::class);
    expect($log->model_id)->toEqual($m->id);
    expect($log->new_values)->toBeArray();
    expect($log->old_values)->toBeNull();
    expect($log->severity)->toBe('low');
    expect($log->description)->toContain('Mahasiswa');
});

it('observer UPDATE stores only the diff, not full row', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $m = Mahasiswa::factory()->create(['nama' => 'Before', 'gpa' => 3.0]);
    LogAudit::query()->delete(); // discard CREATE row, focus on UPDATE

    $m->update(['nama' => 'After']);

    $log = LogAudit::latest('id')->first();
    expect($log)->not->toBeNull();
    expect($log->action)->toBe('UPDATE');
    expect($log->severity)->toBe('medium');

    // Diff contract: only 'nama' should appear, not gpa/batch_year/etc.
    expect(array_keys($log->new_values))->toBe(['nama']);
    expect($log->new_values['nama'])->toBe('After');
    expect($log->old_values['nama'])->toBe('Before');
});

it('observer masks sensitive PII fields', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $m = Mahasiswa::factory()->create([
        'nik' => '3300000000000001',
        'phone' => '08123456789',
        'mother_name' => 'Ibu Budi',
    ]);

    $log = LogAudit::latest('id')->first();
    // Keys still visible for auditability; values redacted.
    expect($log->new_values['nik'])->toBe('***MASKED***');
    expect($log->new_values['phone'])->toBe('***MASKED***');
    expect($log->new_values['mother_name'])->toBe('***MASKED***');
});

it('observer skips UPDATE when only updated_at changed', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $m = Mahasiswa::factory()->create();
    LogAudit::query()->delete();

    // Touch to force updated_at change without other field changes.
    $m->touch();

    expect(LogAudit::count())->toBe(0);
});

it('DELETE is logged with high severity', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $m = Mahasiswa::factory()->create();
    LogAudit::query()->delete();

    $m->delete();

    $log = LogAudit::latest('id')->first();
    expect($log)->not->toBeNull();
    expect($log->action)->toBe('DELETE');
    expect($log->severity)->toBe('high');
    expect($log->old_values)->toBeArray();
    expect($log->new_values)->toBeNull();
});

it('admin audit-log index supports model_type basename filter', function () {
    $admin = createUserWithRole('superadmin');

    // Seed mixed logs via actingAs
    $this->actingAs($admin);
    Mahasiswa::factory()->create();
    LogAudit::create([
        'user_id' => $admin->id,
        'action' => 'CUSTOM',
        'description' => 'Test',
        'severity' => 'low',
        'model_type' => 'App\\Models\\KKN\\Laporan',
        'model_id' => 1,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
    ]);

    // Filter by basename — should match only Mahasiswa rows.
    $response = $this->actingAs($admin)
        ->getJson('/api/v1/admin/audit-log?model_type=Mahasiswa');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $row) {
        expect($row['model_basename'])->toBe('Mahasiswa');
    }
});

it('admin audit-log index supports severity + date range filters', function () {
    $admin = createUserWithRole('superadmin');

    $oldLog = LogAudit::create([
        'user_id' => $admin->id,
        'action' => 'OLD_CREATE',
        'severity' => 'low',
        'description' => 'old',
        'model_type' => 'App\\Models\\KKN\\Mahasiswa',
        'model_id' => 1,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
    ]);
    // Force backdated created_at — Laravel auto-sets created_at on create(),
    // so we must update() with a raw value. Disable observers on LogAudit
    // itself to avoid recursion (it's not observed anyway).
    $oldLog->forceFill(['created_at' => now()->subDays(10)])->save();

    LogAudit::create([
        'user_id' => $admin->id,
        'action' => 'NEW_DELETE',
        'severity' => 'high',
        'description' => 'new',
        'model_type' => 'App\\Models\\KKN\\NilaiKkn',
        'model_id' => 2,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
    ]);

    // severity filter
    $sevResp = $this->actingAs($admin)->getJson('/api/v1/admin/audit-log?severity=high');
    $sevResp->assertOk();
    foreach ($sevResp->json('data') as $row) {
        expect($row['severity'])->toBe('high');
    }

    // date_from filter — exclude the 10-days-old row
    $dateResp = $this->actingAs($admin)->getJson(
        '/api/v1/admin/audit-log?date_from='.now()->subDays(1)->toDateString()
    );
    $dateResp->assertOk();
    $actions = array_column($dateResp->json('data'), 'action');
    expect($actions)->not->toContain('OLD_CREATE');
});

it('LogAuditResource returns model_type + model_basename (not broken auditable_*)', function () {
    $admin = createUserWithRole('superadmin');

    $log = LogAudit::create([
        'user_id' => $admin->id,
        'action' => 'TEST',
        'description' => 'test',
        'severity' => 'low',
        'model_type' => 'App\\Models\\KKN\\Mahasiswa',
        'model_id' => 42,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
    ]);

    $response = $this->actingAs($admin)->getJson("/api/v1/admin/audit-log/{$log->id}");
    $response->assertOk();
    $response->assertJsonPath('data.model_type', 'App\\Models\\KKN\\Mahasiswa');
    $response->assertJsonPath('data.model_basename', 'Mahasiswa');
    $response->assertJsonPath('data.severity', 'low');

    // Verify the old broken fields are NOT leaking
    expect($response->json('data'))->not->toHaveKey('auditable_type');
    expect($response->json('data'))->not->toHaveKey('auditable_id');
});
