<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sync_logs', function (Blueprint $table) {
            $table->id();

            // Relationship
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attendance_id')->nullable()->constrained('attendances')->nullOnDelete();

            // Sync Details
            $table->enum('action', ['create', 'update', 'delete'])->default('create');
            $table->enum('status', [
                'pending',
                'success',
                'failed',
                'retry_pending',
                'manual_intervention_needed',
            ])->default('pending');

            // Network & Device Context
            $table->string('sync_method')->comment('how: manual_button, auto_online_event, scheduled_retry, api_call');
            $table->boolean('was_offline_at_creation')->comment('Was device offline when record created?');
            $table->string('client_ip')->nullable();
            $table->string('device_signature')->nullable();

            // Attempt Tracking
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->datetime('first_attempt_at');
            $table->datetime('last_attempt_at');
            $table->unsignedInteger('total_retry_seconds')->default(0)->comment('Total seconds between retries');

            // Error Details
            $table->integer('last_http_status_code')->nullable();
            $table->text('last_error_message')->nullable();
            $table->json('last_error_details')->nullable()->comment('Full error response from server');

            // Retry Strategy
            $table->enum('retry_strategy', [
                'immediate',
                'exponential_backoff',
                'fixed_interval',
                'manual',
            ])->default('exponential_backoff');
            $table->datetime('next_retry_scheduled_at')->nullable();

            // Client Environment
            $table->string('browser_name')->nullable();
            $table->string('browser_version')->nullable();
            $table->string('os_name')->nullable();
            $table->boolean('is_mobile')->default(false);

            // Metadata
            $table->json('request_payload')->nullable()->comment('What was being synced');
            $table->json('response_payload')->nullable()->comment('Server response (if successful)');

            $table->timestamps();

            // Indexes for analytics
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'sync_method']);
            $table->index(['was_offline_at_creation', 'status']);
            $table->index(['last_attempt_at', 'next_retry_scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sync_logs');
    }
};
