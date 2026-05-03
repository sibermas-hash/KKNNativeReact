<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('peserta_kkn_id')->constrained('peserta_kkn')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();

            // GPS Data
            $table->decimal('latitude', 11, 8);
            $table->decimal('longitude', 11, 8);
            $table->decimal('accuracy_meters', 8, 2)->nullable();
            $table->decimal('altitude_meters', 8, 2)->nullable();
            $table->decimal('heading_degrees', 6, 2)->nullable()->comment('Direction in degrees (0-360)');
            $table->decimal('speed_mps', 6, 2)->nullable()->comment('Speed in meters per second');

            // Timestamps (Multi-layer validation)
            $table->datetime('timestamp_client')->comment('When user captured GPS (client timezone)');
            $table->datetime('timestamp_server')->comment('When server received the data');
            $table->datetime('timestamp_gps')->nullable()->comment('GPS timestamp from device');

            // Activity Classification
            $table->enum('activity_type', [
                'absen_masuk',
                'absen_keluar',
                'logbook_activity',
                'workshop_attendance',
                'meeting_attendance',
            ])->default('absen_masuk');

            // Status & Verification
            $table->enum('status', [
                'pending_verification',
                'verified',
                'rejected',
                'flagged_anomaly',
                'dispensation_approved',
            ])->default('pending_verification');

            // Validation Details
            $table->boolean('is_within_geofence')->default(false);
            $table->decimal('distance_from_posko', 8, 2)->nullable()->comment('Distance in meters from expected location');
            $table->json('validation_flags')->nullable()->comment('Array of detected issues: velocity_anomaly, accuracy_poor, timezone_mismatch, etc');

            // Device & Network
            $table->string('device_signature')->nullable()->comment('Device fingerprint for fraud detection');
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();

            // Soft Verification
            $table->unsignedTinyInteger('attempts')->default(1)->comment('Number of sync attempts for offline records');
            $table->text('sync_error')->nullable()->comment('Last sync error message if any');

            // Audit Trail
            $table->unsignedBigInteger('verified_by_user_id')->nullable()->comment('DPL who verified this record');
            $table->datetime('verified_at')->nullable();
            $table->text('verification_notes')->nullable();

            $table->softDeletes();
            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'periode_id', 'created_at']);
            $table->index(['peserta_kkn_id', 'activity_type']);
            $table->index(['kelompok_id', 'timestamp_client']);
            $table->index(['status', 'created_at']);
            $table->index(['timestamp_client', 'timestamp_server']);
            $table->unique(['user_id', 'activity_type', 'timestamp_client'])->comment('Prevent duplicate submissions');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
