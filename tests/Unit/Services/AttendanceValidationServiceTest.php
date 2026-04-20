<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Attendance;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use App\Models\User;
use App\Services\KKN\AttendanceValidationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceValidationServiceTest extends TestCase
{
    use RefreshDatabase;

    private AttendanceValidationService $service;

    private Attendance $attendance;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AttendanceValidationService;

        // Setup test data
        $periode = Periode::factory()->create();
        $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);

        // Create posko with known location (for geofence testing)
        $posko = PoskoKelompok::factory()->create([
            'kelompok_id' => $kelompok->id,
            'latitude' => -7.2575,
            'longitude' => 110.4268,
            'radius_meters' => 500,
        ]);

        $user = User::factory()->create();
        $pesertaKkn = PesertaKkn::factory()->create([
            'user_id' => $user->id,
            'periode_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        $this->attendance = Attendance::factory()->create([
            'user_id' => $user->id,
            'peserta_kkn_id' => $pesertaKkn->id,
            'kelompok_id' => $kelompok->id,
            'periode_id' => $periode->id,
            'latitude' => -7.2575,
            'longitude' => 110.4268,
            'accuracy_meters' => 25,
            'timestamp_client' => now(),
            'timestamp_server' => now(),
        ]);
    }

    /**
     * Test: Validate good attendance (within geofence, good accuracy)
     */
    public function test_validate_good_attendance(): void
    {
        $result = $this->service->validate($this->attendance);

        $this->assertTrue($result['valid']);
        $this->assertTrue($result['within_geofence']);
        $this->assertEquals('verified', $this->attendance->status);
    }

    /**
     * Test: Detect accuracy issues
     */
    public function test_validate_poor_accuracy(): void
    {
        $this->attendance->accuracy_meters = 150; // > 100m threshold
        $this->attendance->save();

        $result = $this->service->validate($this->attendance);

        $flags = collect($result['flags']);
        $accuracyFlag = $flags->firstWhere('type', 'accuracy_poor');

        $this->assertNotNull($accuracyFlag);
        $this->assertEquals('warning', $accuracyFlag['severity']);
    }

    /**
     * Test: Detect outside geofence
     */
    public function test_validate_outside_geofence(): void
    {
        // Far from posko (> 500m)
        $this->attendance->latitude = -7.3000;
        $this->attendance->longitude = 110.5000;
        $this->attendance->save();

        $result = $this->service->validate($this->attendance);

        $this->assertFalse($result['within_geofence']);

        $flags = collect($result['flags']);
        $geofenceFlag = $flags->firstWhere('type', 'outside_geofence');

        $this->assertNotNull($geofenceFlag);
    }

    /**
     * Test: Detect timestamp mismatch
     */
    public function test_validate_timestamp_mismatch(): void
    {
        $this->attendance->timestamp_client = now()->subMinutes(10);
        $this->attendance->timestamp_gps = now(); // GPS time differs significantly
        $this->attendance->save();

        $result = $this->service->validate($this->attendance);

        // Should be flagged but not necessarily invalid (depends on threshold)
        $this->assertNotEmpty($result['flags']);
    }

    /**
     * Test: Detect impossible speed (velocity anomaly)
     */
    public function test_validate_speed_anomaly(): void
    {
        $this->attendance->speed_mps = 60; // 60 m/s = 216 km/h (impossible)
        $this->attendance->save();

        $result = $this->service->validate($this->attendance);

        // Should be invalid
        $flags = collect($result['flags']);
        $speedFlag = $flags->firstWhere('type', 'speed_anomaly');

        $this->assertNotNull($speedFlag);
        $this->assertFalse($result['valid']);
    }

    /**
     * Test: Validation message generation
     */
    public function test_validation_message_verified(): void
    {
        $this->service->validate($this->attendance);
        $message = $this->service->getValidationMessage($this->attendance);

        $this->assertStringContainsString('✅', $message);
    }

    /**
     * Test: Validation message for flagged attendance
     */
    public function test_validation_message_flagged(): void
    {
        $this->attendance->status = 'flagged_anomaly';
        $this->attendance->validation_flags = [
            [
                'type' => 'speed_anomaly',
                'severity' => 'critical',
                'message' => 'Kecepatan tidak mungkin',
            ],
        ];
        $this->attendance->save();

        $message = $this->service->getValidationMessage($this->attendance);

        $this->assertStringContainsString('⚠️', $message);
    }

    /**
     * Test: Haversine distance calculation accuracy
     */
    public function test_haversine_distance_calculation(): void
    {
        // Two known points: Yogyakarta
        $lat1 = -7.2575;
        $lon1 = 110.4268;

        // About 1km away
        $lat2 = -7.2678;
        $lon2 = 110.4277;

        $distance = $this->attendance->calculateDistanceFromPosko();

        // Should be around 1000 meters (±100m tolerance for earth model differences)
        $this->assertGreaterThan(900, $distance);
        $this->assertLessThan(1100, $distance);
    }
}
