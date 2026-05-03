<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_photos', function (Blueprint $table) {
            $table->id();

            // Relationship
            $table->foreignId('attendance_id')->constrained('attendances')->cascadeOnDelete();

            // Photo Storage
            $table->string('path')->comment('Storage path: attendance/{id}_{timestamp}.jpg');
            $table->string('filename')->comment('Original filename');
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('mime_type')->default('image/jpeg');

            // Photo Metadata (EXIF)
            $table->json('exif_data')->nullable()->comment('Extracted EXIF metadata: GPS, timestamp, camera, orientation, etc');
            $table->decimal('exif_latitude', 11, 8)->nullable();
            $table->decimal('exif_longitude', 11, 8)->nullable();
            $table->datetime('exif_timestamp')->nullable();

            // Photo Processing
            $table->enum('photo_type', [
                'selfie',
                'posko_entrance',
                'location_proof',
                'activity_proof',
                'dispensation_evidence',
            ])->default('selfie');

            $table->text('watermark_text')->nullable()->comment('Text applied to photo: NIM, timestamp, location');
            $table->json('facial_features')->nullable()->comment('Face detection metadata if available');

            // QR Code (if embedded)
            $table->string('qr_data')->nullable()->comment('QR code content if scanned');

            // Verification Status
            $table->enum('status', [
                'pending_review',
                'verified',
                'rejected',
                'requires_manual_review',
            ])->default('pending_review');

            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('reviewed_by_user_id')->nullable();
            $table->datetime('reviewed_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['attendance_id']);
            $table->index(['photo_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_photos');
    }
};
