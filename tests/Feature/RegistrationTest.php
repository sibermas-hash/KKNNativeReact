<?php

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;

test('student can register for active period', function () {
    $mahasiswa = Mahasiswa::factory()->create();
    $periode = Periode::factory()->active()->create();

    $peserta = PesertaKkn::factory()->create([
        'mahasiswa_id' => $mahasiswa->id,
        'period_id' => $periode->id,
        'status' => 'pending',
    ]);

    expect($peserta)->toBeInstanceOf(PesertaKkn::class);
    expect($peserta->mahasiswa_id)->toBe($mahasiswa->id);
    expect($peserta->period_id)->toBe($periode->id);
    expect($peserta->status)->toBe('pending');
});

test('student cannot register twice for the same period', function () {
    $mahasiswa = Mahasiswa::factory()->create();
    $periode = Periode::factory()->active()->create();

    PesertaKkn::factory()->create([
        'mahasiswa_id' => $mahasiswa->id,
        'period_id' => $periode->id,
    ]);

    // Attempt duplicate registration
    $duplicate = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
        ->where('period_id', $periode->id)
        ->count();

    expect($duplicate)->toBe(1);
});
