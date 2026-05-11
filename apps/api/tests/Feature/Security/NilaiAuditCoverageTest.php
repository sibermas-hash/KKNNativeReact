<?php

declare(strict_types=1);

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\LogAudit;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Enums\KknType;

/**
 * Regression test R11-DB-013 alternative (ADR-001):
 * Audit trail menyediakan forensic untuk perubahan skor + role peserta +
 * konfigurasi penilaian. Menguji bahwa observer terdaftar dengan severity
 * yang tepat.
 */

beforeEach(function () {
    LogAudit::query()->delete();
});

it('logs NilaiKkn score mutations with high severity', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $nilai = NilaiKkn::factory()->create([
        'total_score' => 75,
        'letter_grade' => 'B',
    ]);

    $createLog = LogAudit::latest('id')->first();
    expect($createLog->action)->toBe('CREATE');
    expect($createLog->severity)->toBe('high');
    expect($createLog->model_type)->toBe(NilaiKkn::class);
    // Score TIDAK di-mask — audit trail perlu nilai aktual untuk forensic.
    expect($createLog->new_values['total_score'] ?? null)->not->toBe('***MASKED***');

    LogAudit::query()->delete();
    $nilai->update(['total_score' => 90, 'letter_grade' => 'A']);

    $updateLog = LogAudit::latest('id')->first();
    expect($updateLog->action)->toBe('UPDATE');
    expect($updateLog->severity)->toBe('high');
    // Diff-only: old=75, new=90 tercatat.
    expect((float) ($updateLog->old_values['total_score'] ?? 0))->toBe(75.0);
    expect((float) ($updateLog->new_values['total_score'] ?? 0))->toBe(90.0);
});

it('logs PesertaKkn role changes (audit for makeLeader)', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    $periode = createActivePeriod('execution');
    $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $peserta = PesertaKkn::factory()->create([
        'kelompok_id' => $kelompok->id,
        'periode_id' => $periode->id,
    ]);

    LogAudit::query()->delete();

    $peserta->update(['role' => 'Ketua']);

    $log = LogAudit::latest('id')->first();
    expect($log)->not->toBeNull();
    expect($log->action)->toBe('UPDATE');
    expect($log->model_type)->toBe(PesertaKkn::class);
    // Diff memiliki role change.
    expect($log->new_values['role'] ?? null)->toBe('Ketua');
});

it('logs KonfigurasiPenilaian weight changes with high severity', function () {
    $actor = createUserWithRole('superadmin');
    $this->actingAs($actor);

    KonfigurasiPenilaian::ensureDefaults();
    $config = KonfigurasiPenilaian::where('kkn_type', KknType::REGULER)
        ->where('config_key', 'weight_dpl_report')
        ->first();

    LogAudit::query()->delete();

    $config->update(['percentage' => 35]);

    $log = LogAudit::latest('id')->first();
    expect($log)->not->toBeNull();
    expect($log->action)->toBe('UPDATE');
    expect($log->severity)->toBe('high'); // Konfigurasi → high
    expect($log->model_type)->toBe(KonfigurasiPenilaian::class);
});

it('system-level writes without auth do not pollute audit log', function () {
    // AuditObserver early-return kalau tidak ada auth user.
    PesertaKkn::factory()->create();

    expect(LogAudit::count())->toBe(0);
});
