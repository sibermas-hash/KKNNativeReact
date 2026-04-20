<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_dispensations', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('attendance_id')->nullable()->constrained('attendances')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('peserta_kkn_id')->constrained('peserta_kkn')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();

            // Dispensation Details
            $table->enum('type', [
                'accuracy_poor',
                'signal_lost',
                'sick',
                'family_emergency',
                'technical_issue',
                'other',
            ])->comment('Reason for dispensation');

            $table->text('reason_description')->comment('Detailed explanation from student');
            $table->text('dpl_notes')->nullable()->comment('Notes from DPL during review');

            // Evidence
            $table->string('evidence_file_path')->nullable()->comment('Supporting document (medical cert, etc)');

            // Status & Approval Flow
            $table->enum('status', [
                'pending_dpl_review',
                'pending_lppm_review',
                'approved',
                'rejected',
                'needs_clarification',
            ])->default('pending_dpl_review');

            // DPL Approval (First Level)
            $table->unsignedBigInteger('dpl_user_id')->nullable()->comment('DPL who reviewed');
            $table->datetime('dpl_reviewed_at')->nullable();
            $table->enum('dpl_decision', ['approve', 'reject', 'escalate'])->nullable();

            // LPPM Approval (Second Level - if needed)
            $table->unsignedBigInteger('lppm_user_id')->nullable()->comment('LPPM staff who reviewed');
            $table->datetime('lppm_reviewed_at')->nullable();
            $table->enum('lppm_decision', ['approve', 'reject'])->nullable();

            // Effective Period
            $table->date('dispensation_date')->comment('Date the dispensation applies to');
            $table->dateTime('valid_from')->comment('When dispensation becomes effective');
            $table->dateTime('valid_until')->nullable()->comment('When dispensation expires (if temporary)');

            // Alternative Verification Method
            $table->enum('alternative_verification', [
                'manual_qr_scan',
                'photo_with_witness',
                'dpl_field_visit_confirmation',
                'none',
            ])->default('none');

            $table->text('verification_method_notes')->nullable();

            // Audit
            $table->unsignedBigInteger('created_by_user_id')->comment('Student who submitted');
            $table->softDeletes();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'periode_id']);
            $table->index(['status', 'dispensation_date']);
            $table->index(['kelompok_id', 'dispensation_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_dispensations');
    }
};
