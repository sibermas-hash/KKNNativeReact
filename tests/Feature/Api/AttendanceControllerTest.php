<?php

namespace Tests\Feature\Api;

use App\Models\KKN\Attendance;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Tests\Concerns\RefreshPostgresDatabase;
use Tests\TestCase;

class AttendanceControllerTest extends TestCase
{
    use RefreshPostgresDatabase;

    private User $user;

    private PesertaKkn $pesertaKkn;

    private Periode $periode;

    private KelompokKkn $kelompok;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup test data
        $this->periode = Periode::factory()->create();
        $this->kelompok = KelompokKkn::factory()->create(['periode_id' => $this->periode->id]);
        $this->user = User::factory()->create();
        $this->pesertaKkn = PesertaKkn::factory()->create([
            'user_id' => $this->user->id,
            'periode_id' => $this->periode->id,
            'kelompok_id' => $this->kelompok->id,
            'status' => 'accepted',
        ]);
    }

    /**
     * Test: Create attendance record (basic)
     */
    public function test_create_attendance_success(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/attendance', [
                'latitude' => -7.2575,
                'longitude' => 110.4268,
                'accuracy_meters' => 25,
                'timestamp_client' => now()->toIso8601String(),
                'timestamp_gps' => now()->toIso8601String(),
                'activity_type' => 'absen_masuk',
                'device_signature' => 'test_device_123',
                'user_agent' => 'Test Agent',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'attendance_id',
                    'status',
                    'is_within_geofence',
                    'distance_from_posko',
                    'validation_message',
                    'requires_manual_review',
                    'fraud_risk_score',
                ],
            ]);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->user->id,
            'activity_type' => 'absen_masuk',
        ]);
    }

    /**
     * Test: Invalid GPS coordinates should be rejected
     */
    public function test_create_attendance_invalid_coordinates(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/attendance', [
                'latitude' => 91, // Invalid: > 90
                'longitude' => 110.4268,
                'accuracy_meters' => 25,
                'timestamp_client' => now()->toIso8601String(),
                'activity_type' => 'absen_masuk',
            ]);

        $response->assertStatus(422);
    }

    /**
     * Test: User must be registered participant
     */
    public function test_create_attendance_not_participant(): void
    {
        $otherUser = User::factory()->create();

        $response = $this->actingAs($otherUser)
            ->postJson('/api/attendance', [
                'latitude' => -7.2575,
                'longitude' => 110.4268,
                'accuracy_meters' => 25,
                'timestamp_client' => now()->toIso8601String(),
                'activity_type' => 'absen_masuk',
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test: List user's attendance records
     */
    public function test_list_attendance(): void
    {
        Attendance::factory(5)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/attendance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => ['id', 'latitude', 'longitude', 'activity_type', 'status'],
                    ],
                    'pagination',
                ],
            ]);
    }

    /**
     * Test: Get single attendance record
     */
    public function test_show_attendance(): void
    {
        $attendance = Attendance::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/attendance/{$attendance->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $attendance->id);
    }

    /**
     * Test: Cannot view other user's attendance
     */
    public function test_show_attendance_unauthorized(): void
    {
        $otherUser = User::factory()->create();
        $attendance = Attendance::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/attendance/{$attendance->id}");

        $response->assertStatus(403);
    }

    /**
     * Test: Get sync status
     */
    public function test_get_sync_status(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/attendance/sync-status');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'sync_stats' => [
                    'total',
                    'successful',
                    'failed',
                    'pending_retry',
                    'needs_manual',
                ],
                'pending_retries_count',
                'pending_retries',
            ]);
    }

    /**
     * Test: Create attendance with photo
     */
    public function test_create_attendance_with_photo(): void
    {
        // Create a simple test image
        $photoData = 'data:image/jpeg;base64,'.base64_encode(file_get_contents(
            resource_path('images/test-image.jpg')
        ));

        $response = $this->actingAs($this->user)
            ->postJson('/api/attendance', [
                'latitude' => -7.2575,
                'longitude' => 110.4268,
                'accuracy_meters' => 25,
                'timestamp_client' => now()->toIso8601String(),
                'activity_type' => 'absen_masuk',
                'proof_photo_base64' => $photoData,
            ]);

        $response->assertStatus(201);

        // Verify photo was saved
        $attendanceId = $response->json('data.attendance_id');
        $this->assertDatabaseHas('attendance_photos', [
            'attendance_id' => $attendanceId,
            'photo_type' => 'selfie',
        ]);
    }

    /**
     * Test: Multiple activity types
     */
    public function test_create_attendance_different_activity_types(): void
    {
        $types = ['absen_masuk', 'absen_keluar', 'logbook_activity', 'workshop_attendance'];

        foreach ($types as $type) {
            $response = $this->actingAs($this->user)
                ->postJson('/api/attendance', [
                    'latitude' => -7.2575,
                    'longitude' => 110.4268,
                    'accuracy_meters' => 25,
                    'timestamp_client' => now()->toIso8601String(),
                    'activity_type' => $type,
                ]);

            $response->assertStatus(201);
        }

        $this->assertDatabaseCount('attendances', 4);
    }

    /**
     * Test: Filter by activity type
     */
    public function test_list_attendance_filter_by_activity(): void
    {
        Attendance::factory(3)->create([
            'user_id' => $this->user->id,
            'activity_type' => 'absen_masuk',
        ]);
        Attendance::factory(2)->create([
            'user_id' => $this->user->id,
            'activity_type' => 'absen_keluar',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/attendance?activity_type=absen_masuk');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.data'));
    }

    /**
     * Test: Duplicate submission detection
     */
    public function test_duplicate_attendance_detection(): void
    {
        // First submission
        $this->actingAs($this->user)
            ->postJson('/api/attendance', [
                'latitude' => -7.2575,
                'longitude' => 110.4268,
                'accuracy_meters' => 25,
                'timestamp_client' => now()->toIso8601String(),
                'activity_type' => 'absen_masuk',
            ]);

        // Duplicate within 60 seconds
        $response = $this->actingAs($this->user)
            ->postJson('/api/attendance', [
                'latitude' => -7.2575,
                'longitude' => 110.4268,
                'accuracy_meters' => 25,
                'timestamp_client' => now()->addSeconds(30)->toIso8601String(),
                'activity_type' => 'absen_masuk',
            ]);

        // Should be flagged as anomaly
        $response->assertStatus(201);
        $this->assertEquals('flagged_anomaly', $response->json('data.status'));
    }
}
