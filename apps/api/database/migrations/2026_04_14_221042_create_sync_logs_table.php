<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('sync_type', ['full', 'delta', 'manual', 'partial']);
            $table->enum('entity_type', ['mahasiswa', 'dosen', 'all', 'fakultas']);
            $table->enum('status', ['running', 'success', 'partial_success', 'failed']);
            $table->integer('total_fetched')->default(0);
            $table->integer('total_created')->default(0);
            $table->integer('total_updated')->default(0);
            $table->integer('total_skipped')->default(0);
            $table->integer('total_errors')->default(0);
            $table->json('error_details')->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->enum('triggered_by', ['scheduler', 'artisan', 'admin_ui', 'api']);
            $table->foreignId('triggered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
    }
};
