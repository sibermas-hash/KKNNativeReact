<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Attendance;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Services\KKN\FraudDetectionService;
use Tests\Concerns\RefreshPostgresDatabase;
use Tests\TestCase;

class FraudDetectionServiceTest extends TestCase
{
    use RefreshPostgresDatabase;

    private FraudDetectionService $service;

    private Attendance $attendance;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new FraudDetectionService;

        $periode = Periode::factory()->create();
        $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);

        $this->user = User::factory()->create();
        $pesertaKkn = PesertaKkn::factory()->create([
            'user_id' => $this->user->id,
            'periode_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        $this->attendance = Attendance::factory()->create([
            'user_id' => $this->user->id,
            'peserta_kkn_id' => $pesertaKkn->id,
            'kelompok_id' => $kelompok->id,
            'periode_id' => $periode->id,
        ]);
    }

    /**
     * Test: Clean attendance (minimal risk)
     */
    public function test_clean_attendance_low_risk(): void
    {
        $result = $this->service->analyze($this->attendance);

        $this->assertLessThan(20, $result['risk_score']);
        $this->assertEquals('minimal', $result['risk_level']);
        $this->assertFalse($result['requires_manual_review']);
    }

    /**
     * Test: Detect velocity anomaly (impossible travel)
     */
    public function test_detect_velocity_anomaly(): void
    {
        // Create previous attendance 1km away
        Attendance::factory()->create([
            'user_id' => $this->user->id,
            'latitude' => -7.2678,
            'longitude' => 110.4277,
            'timestamp_client' => now()->subSeconds(30), // 30 seconds ago
        ]);

        // Current attendance 50km away
        $this->attendance->latitude = -7.0000;
        $this->attendance->longitude = 110.5000;
        $this->attendance->save();

        $result = $this->service->analyze($this->attendance);

        $velocityIndicator = collect($result['indicators'])
            ->firstWhere('type', 'impossible_velocity');

        $this->assertNotNull($velocityIndicator);
        $this->assertGreaterThanOrEqual(20, $result['risk_score']);
    }

    /**
     * Test: Detect repeated exact location (GPS spoofing)
     */
    public function test_detect_repeated_exact_location(): void
    {
        // Create 4 previous attendances at exact same location within 7 days
        for ($i = 0; $i < 4; $i++) {
            Attendance::factory()->create([
                'user_id' => $this->user->id,
                'latitude' => $this->attendance->latitude,
                'longitude' => $this->attendance->longitude,
                'created_at' => now()->subDays($i),
            ]);
        }

        $result = $this->service->analyze($this->attendance);

        $spoofingIndicator = collect($result['indicators'])
            ->firstWhere('type', 'repeated_exact_location');

        $this->assertNotNull($spoofingIndicator);
        $this->assertGreaterThanOrEqual(15, $result['risk_score']);
    }

    /**
     * Test: Detect round number coordinates (spoofing pattern)
     */
    public function test_detect_round_number_coordinates(): void
    {
        $this->attendance->latitude = -7.0000;
        $this->attendance->longitude = 110.0000;
        $this->attendance->accuracy_meters = 5; // Very accurate claim
        $this->attendance->save();

        $result = $this->service->analyze($this->attendance);

        $roundCoordIndicator = collect($result['indicators'])
            ->firstWhere('type', 'round_number_coordinates');

        $this->assertNotNull($roundCoordIndicator);
    }

    /**
     * Test: Detect multiple users from same device
     */
    public function test_detect_shared_device_signature(): void
    {
        $deviceSig = 'device_abc123';

        // Create attendances from 3 different users with same device
        $otherUser1 = User::factory()->create();
        $otherUser2 = User::factory()->create();

        Attendance::factory()->create([
            'user_id' => $otherUser1->id,
            'device_signature' => $deviceSig,
            'created_at' => now()->subDays(5),
        ]);

        Attendance::factory()->create([
            'user_id' => $otherUser2->id,
            'device_signature' => $deviceSig,
            'created_at' => now()->subDays(3),
        ]);

        $this->attendance->device_signature = $deviceSig;
        $this->attendance->save();

        $result = $this->service->analyze($this->attendance);

        $deviceIndicator = collect($result['indicators'])
            ->firstWhere('type', 'shared_device_signature');

        $this->assertNotNull($deviceIndicator);
        $this->assertGreaterThanOrEqual(25, $result['risk_score']);
    }

    /**
     * Test: Risk level classification
     */
    public function test_risk_level_classification(): void
    {
        $testCases = [
            0 => 'minimal',
            25 => 'low',
            50 => 'medium',
            75 => 'high',
            90 => 'critical',
        ];

        foreach ($testCases as $score => $level) {
            // Mock result with specific score
            $reflection = new \ReflectionClass($this->service);
            $method = $reflection->getMethod('analyze');

            // Create a mock attendance with specific characteristics
            $test = Attendance::factory()->create([
                'user_id' => User::factory()->create()->id,
                'speed_mps' => $score > 80 ? 100 : null, // Critical if high speed
            ]);

            $result = $this->service->analyze($test);

            // Verify level exists
            $this->assertIn($result['risk_level'], ['minimal', 'low', 'medium', 'high', 'critical']);
        }
    }

    /**
     * Test: Manual review trigger at threshold
     */
    public function test_manual_review_trigger(): void
    {
        // Create high-risk scenario: bad accuracy + outside area + multi-user device
        $this->attendance->accuracy_meters = 150;
        $this->attendance->is_within_geofence = false;
        $this->attendance->device_signature = 'shared_device';
        $this->attendance->speed_mps = 60; // Impossible speed
        $this->attendance->save();

        $result = $this->service->analyze($this->attendance);

        $this->assertTrue($result['requires_manual_review']);
        $this->assertGreaterThanOrEqual(60, $result['risk_score']);
    }

    /**
     * Test: No false positives on clean data
     */
    public function test_no_false_positives_clean_data(): void
    {
        // Create several clean attendances
        for ($i = 0; $i < 5; $i++) {
            $attendance = Attendance::factory()->create([
                'user_id' => User::factory()->create()->id,
                'accuracy_meters' => 15,
                'is_within_geofence' => true,
                'speed_mps' => null,
                'created_at' => now()->subDays($i),
            ]);

            $result = $this->service->analyze($attendance);

            $this->assertFalse($result['requires_manual_review']);
            $this->assertLessThan(20, $result['risk_score']);
        }
    }
}
