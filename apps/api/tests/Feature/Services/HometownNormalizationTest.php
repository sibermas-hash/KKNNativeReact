<?php

declare(strict_types=1);

use App\Services\AutomaticGroupPlacementService;
use App\Services\GroupSelectionService;

/**
 * Regression test R9-R04: hometown normalization regex harus handle
 * varian penulisan administrative prefix.
 */

beforeEach(function () {
    // Pakai reflection untuk akses private method.
    $this->service = new AutomaticGroupPlacementService(
        app(GroupSelectionService::class)
    );

    $this->normalize = function (?string $v): string {
        $reflection = new ReflectionMethod(AutomaticGroupPlacementService::class, 'normalizeAdministrativeName');
        $reflection->setAccessible(true);
        return $reflection->invoke($this->service, $v);
    };
});

it('normalizes kabupaten variants to bare name', function () {
    $normalize = $this->normalize;

    expect($normalize('Banyumas'))->toBe('banyumas');
    expect($normalize('Kabupaten Banyumas'))->toBe('banyumas');
    expect($normalize('Kab. Banyumas'))->toBe('banyumas');
    expect($normalize('Kab Banyumas'))->toBe('banyumas');
    expect($normalize('KAB. BANYUMAS'))->toBe('banyumas');
    expect($normalize('kabupaten banyumas'))->toBe('banyumas');
});

it('normalizes kota and kotamadya variants', function () {
    $normalize = $this->normalize;

    expect($normalize('Kota Yogyakarta'))->toBe('yogyakarta');
    expect($normalize('Kotamadya Jakarta Selatan'))->toBe('jakarta selatan');
    expect($normalize('KOTA TEGAL'))->toBe('tegal');
});

it('normalizes DKI and other province prefixes', function () {
    $normalize = $this->normalize;

    expect($normalize('DKI Jakarta'))->toBe('jakarta');
    expect($normalize('Provinsi Jawa Tengah'))->toBe('jawa tengah');
});

it('handles compound prefixes', function () {
    $normalize = $this->normalize;

    // Edge case: beberapa input lama bisa "Kab. Kota Banyumas" (typo user).
    expect($normalize('Kab Kota Banyumas'))->toBe('banyumas');
});

it('handles dots and punctuation correctly', function () {
    $normalize = $this->normalize;

    expect($normalize('Kab. Banyumas.'))->toBe('banyumas');
    expect($normalize('  Kab.  Banyumas  '))->toBe('banyumas');
    expect($normalize('Kab, Banyumas'))->toBe('banyumas');
});

it('preserves multi-word city names', function () {
    $normalize = $this->normalize;

    expect($normalize('Kabupaten Banyumas Tengah'))->toBe('banyumas tengah');
    expect($normalize('Kota Tangerang Selatan'))->toBe('tangerang selatan');
});

it('returns empty string for blank input', function () {
    $normalize = $this->normalize;

    expect($normalize(null))->toBe('');
    expect($normalize(''))->toBe('');
    expect($normalize('   '))->toBe('');
});

it('makes hometown comparison work across variants', function () {
    $normalize = $this->normalize;

    // Simulasi: mahasiswa alamat "Kab. Banyumas", kelompok lokasi
    // "Banyumas" — harus terdeteksi sebagai kota yang sama.
    $mahasiswaHome = $normalize('Kab. Banyumas');
    $kelompokRegency = $normalize('Banyumas');

    expect($mahasiswaHome)->toBe($kelompokRegency);
});
