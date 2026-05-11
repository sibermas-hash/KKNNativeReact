<?php

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Services\KKN\GpsAntiSpoofService;

describe('GPS Anti-Spoof Service (R10-002)', function () {

    beforeEach(function () {
        $this->service = app(GpsAntiSpoofService::class);
    });

    it('allows legitimate GPS coords with normal accuracy', function () {
        $result = $this->service->analyze([
            'latitude' => -7.4296123,
            'longitude' => 109.2518745,
            'gps_accuracy' => 15.5,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => false,
        ], 99999);

        expect($result['action'])->toBe(GpsAntiSpoofService::ACTION_ALLOW);
        expect($result['score'])->toBeLessThan(40);
        expect($result['suspicions'])->toBeEmpty();
    });

    it('rejects when is_mock_location=true', function () {
        $result = $this->service->analyze([
            'latitude' => -7.4296123,
            'longitude' => 109.2518745,
            'gps_accuracy' => 15,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => true,
        ], 99999);

        expect($result['action'])->toBe(GpsAntiSpoofService::ACTION_REJECT);
        expect($result['score'])->toBeGreaterThanOrEqual(70);
        expect(collect($result['suspicions'])->pluck('code'))->toContain('mock_location_flag');
    });

    it('flags zero-accuracy GPS', function () {
        $result = $this->service->analyze([
            'latitude' => -7.4296123,
            'longitude' => 109.2518745,
            'gps_accuracy' => 0.0,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => false,
        ], 99999);

        expect($result['action'])->toBe(GpsAntiSpoofService::ACTION_FLAG);
        expect(collect($result['suspicions'])->pluck('code'))->toContain('zero_accuracy');
    });

    it('flags perfectly rounded coordinates', function () {
        $result = $this->service->analyze([
            'latitude' => -7.5000000,
            'longitude' => 109.2000000,
            'gps_accuracy' => 10.0,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => false,
        ], 99999);

        expect(collect($result['suspicions'])->pluck('code'))->toContain('rounded_coords');
        expect($result['score'])->toBeGreaterThanOrEqual(40);
    });

    it('detects teleportation between reports', function () {
        $mahasiswa = Mahasiswa::factory()->create();
        $kelompok = KelompokKkn::factory()->create();

        KegiatanKkn::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'date' => now()->toDateString(),
            'title' => 'Prev activity',
            'activity' => 'test',
            'latitude' => -7.4296123,
            'longitude' => 109.2518745,
            'gps_accuracy' => 15,
            'captured_at' => now()->subHour(),
            'status' => 'approved',
        ]);

        // Force created_at so teleport check triggers
        KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)->update([
            'created_at' => now()->subHour(),
        ]);

        $result = $this->service->analyze([
            'latitude' => -6.1944491,     // Jakarta ~400km away
            'longitude' => 106.8229055,
            'gps_accuracy' => 15,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => false,
        ], $mahasiswa->id);

        expect(collect($result['suspicions'])->pluck('code'))->toContain('teleportation');
        expect($result['action'])->toBe(GpsAntiSpoofService::ACTION_REJECT);
    });

    it('flags identical coordinates with previous report', function () {
        $mahasiswa = Mahasiswa::factory()->create();
        $kelompok = KelompokKkn::factory()->create();

        KegiatanKkn::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'date' => now()->subDay()->toDateString(),
            'title' => 'Prev',
            'activity' => 'test',
            'latitude' => -7.4296123,
            'longitude' => 109.2518745,
            'gps_accuracy' => 15,
            'captured_at' => now()->subDay(),
            'status' => 'approved',
        ]);

        $result = $this->service->analyze([
            'latitude' => -7.4296123,
            'longitude' => 109.2518745,
            'gps_accuracy' => 15,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => false,
        ], $mahasiswa->id);

        expect(collect($result['suspicions'])->pluck('code'))->toContain('identical_coords');
    });

    it('combines multiple suspicions into higher score', function () {
        $result = $this->service->analyze([
            'latitude' => -7.5000000,
            'longitude' => 109.2000000,
            'gps_accuracy' => 0.0,
            'captured_at' => now()->toIso8601String(),
            'is_mock_location' => true,
        ], 99996);

        expect($result['action'])->toBe(GpsAntiSpoofService::ACTION_REJECT);
        expect($result['score'])->toBeGreaterThanOrEqual(70);
        expect(count($result['suspicions']))->toBeGreaterThan(1);
    });
});
