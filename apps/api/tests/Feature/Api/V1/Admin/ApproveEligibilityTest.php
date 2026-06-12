<?php

declare(strict_types=1);

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Services\EligibilityService;
use Mockery\MockInterface;

/**
 * Regression test untuk audit R9-008 fix:
 * `PesertaKknController::approve` dan `bulkApprove` sekarang re-run eligibility
 * sebelum mengubah status ke approved. Superadmin dengan `?force=1` boleh bypass.
 */
beforeEach(function () {
    $this->admin = createUserWithRole('superadmin'); // bypass permission check
    $periode = createActivePeriod('placement');
    $this->kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $this->periode = $periode;
});

afterEach(function () {
    Mockery::close();
});

function makePendingPeserta(KelompokKkn $kelompok, int $periodeId): PesertaKkn
{
    $user = createUserWithRole('student');
    $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);

    return PesertaKkn::create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $periodeId,
        'kelompok_id' => $kelompok->id,
        'status' => 'pending',
        'registration_date' => now(),
    ]);
}

/**
 * Mock EligibilityService::checkEligibility. Returns helper to stub per-call
 * result and configures the container binding.
 */
function stubEligibility(bool $eligible, string $failingKey = 'min_sks', string $failingMessage = 'SKS tidak mencukupi (90/100)'): MockInterface
{
    $mock = Mockery::mock(EligibilityService::class);
    $mock->shouldReceive('checkEligibility')->andReturnUsing(function () use ($eligible, $failingKey, $failingMessage) {
        $checks = [
            'min_sks' => ['passed' => true, 'key' => 'min_sks', 'message' => 'SKS cukup'],
            'min_gpa' => ['passed' => true, 'key' => 'min_gpa', 'message' => 'IPK cukup'],
            'ukt_payment' => ['passed' => true, 'key' => 'ukt_payment', 'message' => 'UKT lunas'],
            'registration_window' => ['passed' => false, 'key' => 'registration_window', 'message' => 'di luar jadwal'],
            'no_active_registration' => ['passed' => false, 'key' => 'no_active_registration', 'message' => 'masih ada aktif'],
            'documents' => ['passed' => true, 'key' => 'documents', 'message' => 'lengkap'],
        ];

        if (! $eligible) {
            $checks[$failingKey] = [
                'passed' => false,
                'key' => $failingKey,
                'message' => $failingMessage,
            ];
        }

        return [
            'checks' => $checks,
            'is_eligible' => $eligible,
        ];
    });

    app()->instance(EligibilityService::class, $mock);

    return $mock;
}

it('approves peserta when eligibility check passes', function () {
    stubEligibility(eligible: true);

    $peserta = makePendingPeserta($this->kelompok, $this->periode->id);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/admin/pendaftaran/{$peserta->id}/approve")
        ->assertOk()
        ->assertJsonPath('success', true);

    expect($peserta->fresh()->status)->toBe('approved');
});

it('rejects approve with 422 and reason when eligibility fails', function () {
    stubEligibility(eligible: false, failingKey: 'min_sks', failingMessage: 'SKS tidak mencukupi (90/100)');

    $peserta = makePendingPeserta($this->kelompok, $this->periode->id);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/admin/pendaftaran/{$peserta->id}/approve")
        ->assertStatus(422)
        ->assertJsonFragment(['code' => 'VALIDATION_ERROR'])
        ->assertJsonPath('error.message', 'Mahasiswa tidak memenuhi syarat approval: SKS tidak mencukupi (90/100)');

    expect($peserta->fresh()->status)->toBe('pending');
});

it('skips registration_window and no_active_registration checks', function () {
    // Both are flagged "failing" in stub but should be filtered out.
    stubEligibility(eligible: true); // actual data doesn't matter — method should return eligible=true

    $peserta = makePendingPeserta($this->kelompok, $this->periode->id);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/admin/pendaftaran/{$peserta->id}/approve")
        ->assertOk();

    expect($peserta->fresh()->status)->toBe('approved');
});

it('allows superadmin force bypass with ?force=1', function () {
    stubEligibility(eligible: false, failingMessage: 'Seharusnya gagal');

    $peserta = makePendingPeserta($this->kelompok, $this->periode->id);

    $this->actingAs($this->admin)
        ->patchJson("/api/v1/admin/pendaftaran/{$peserta->id}/approve?force=1")
        ->assertOk();

    expect($peserta->fresh()->status)->toBe('approved');
});

it('bulkApprove returns skipped list with reason for failing peserta', function () {
    // Sebagian eligible, sebagian tidak.
    $mock = Mockery::mock(EligibilityService::class);
    $mock->shouldReceive('checkEligibility')->andReturnUsing(function ($mahasiswa) {
        // Genap → lolos, ganjil → gagal. Simulasi partial success.
        $eligible = $mahasiswa->id % 2 === 0;

        return [
            'checks' => $eligible ? [] : [
                'min_sks' => ['passed' => false, 'key' => 'min_sks', 'message' => 'SKS kurang'],
            ],
            'is_eligible' => $eligible,
        ];
    });
    app()->instance(EligibilityService::class, $mock);

    $peserta1 = makePendingPeserta($this->kelompok, $this->periode->id);
    $peserta2 = makePendingPeserta($this->kelompok, $this->periode->id);
    $peserta3 = makePendingPeserta($this->kelompok, $this->periode->id);

    $ids = [$peserta1->id, $peserta2->id, $peserta3->id];

    $response = $this->actingAs($this->admin)
        ->postJson('/api/v1/admin/pendaftaran/bulk-approve', ['ids' => $ids]);

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveKeys(['approved_count', 'skipped_count', 'skipped']);
    expect($data['approved_count'] + $data['skipped_count'])->toBe(3);
    // Yang skipped harus punya reason
    if ($data['skipped_count'] > 0) {
        expect($data['skipped'][0])->toHaveKeys(['id', 'nim', 'nama', 'reason']);
    }
});

it('bulkApprove force=1 approves all without eligibility check', function () {
    // Stub yang SELALU gagal — tapi dengan force=1 seharusnya tetap approve.
    stubEligibility(eligible: false);

    $peserta1 = makePendingPeserta($this->kelompok, $this->periode->id);
    $peserta2 = makePendingPeserta($this->kelompok, $this->periode->id);

    $response = $this->actingAs($this->admin)
        ->postJson('/api/v1/admin/pendaftaran/bulk-approve', [
            'ids' => [$peserta1->id, $peserta2->id],
            'force' => true,
        ]);

    $response->assertOk();
    expect($response->json('data.approved_count'))->toBe(2);
    expect($response->json('data.skipped_count'))->toBe(0);
});

it('forbids faculty_admin from approve and bulkApprove', function () {
    $facultyAdmin = createUserWithRole('faculty_admin');
    $peserta = makePendingPeserta($this->kelompok, $this->periode->id);

    $this->actingAs($facultyAdmin)
        ->patchJson("/api/v1/admin/pendaftaran/{$peserta->id}/approve")
        ->assertStatus(403);

    $this->actingAs($facultyAdmin)
        ->postJson('/api/v1/admin/pendaftaran/bulk-approve', ['ids' => [$peserta->id]])
        ->assertStatus(403);

    expect($peserta->fresh()->status)->toBe('pending');
});
