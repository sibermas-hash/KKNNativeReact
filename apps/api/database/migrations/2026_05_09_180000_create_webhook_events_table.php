<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Webhook idempotency store (audit finding R-004).
 *
 * `Cache::add`-based deduplication (the prior implementation) could not
 * distinguish a retry-during-processing from a true duplicate. DB-backed
 * state machine resolves that:
 *
 *   processing  → return 503 + Retry-After so SIAKAD retries later
 *   done        → return 200 { duplicate_ignored } silently
 *   failed      → re-process on the next delivery
 *
 * `updated_at` doubles as a staleness indicator: rows stuck in `processing`
 * for longer than the configured timeout are treated as crashed and
 * recycled, so a dead PHP worker can't block retries forever.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('webhook_id')->unique();
            $table->string('event')->index();
            $table->enum('state', ['processing', 'done', 'failed'])->default('processing')->index();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            // Supports cleanup query: `WHERE state = 'done' AND processed_at < ?`
            $table->index(['state', 'processed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
