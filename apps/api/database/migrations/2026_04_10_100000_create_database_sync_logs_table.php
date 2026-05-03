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
        Schema::create('database_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 50); // 'master_api', 'kkn_db'
            $table->string('target', 50); // 'kkn_db', 'master_api'
            $table->string('entity_type', 50); // 'mahasiswa', 'dosen', 'faculty', etc.
            $table->string('entity_id')->nullable(); // ID entity yang di-sync
            $table->string('action', 20); // 'create', 'update', 'delete', 'sync'
            $table->enum('status', ['success', 'failed', 'pending']);
            $table->json('request_data')->nullable(); // Request payload
            $table->json('response_data')->nullable(); // Response payload
            $table->text('error_message')->nullable(); // Error message jika gagal
            $table->timestamp('synced_at')->nullable(); // Kapan di-sync
            $table->foreignId('synced_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes untuk performance
            $table->index(['entity_type', 'status']);
            $table->index(['source', 'target']);
            $table->index('synced_at');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('database_sync_logs');
    }
};
