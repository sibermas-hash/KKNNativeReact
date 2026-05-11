<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * User Activity Log — PRD_USER_ACTIVITY_LOG.md
 *
 * Mencatat aksi pengguna (login, logout, ganti password, update profil, dll)
 * untuk keperluan monitoring keamanan + analitik dashboard superadmin.
 *
 * Melengkapi `LogAudit` yang fokus di perubahan data model, bukan aksi user.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_activity_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('action', 50);
            $t->string('status', 20)->default('success'); // success | failed
            $t->json('metadata')->nullable();
            $t->string('ip_address', 45)->nullable();
            $t->string('user_agent', 500)->nullable();
            $t->timestamp('created_at')->useCurrent();

            $t->index(['action', 'created_at']);
            $t->index(['user_id', 'action']);
            $t->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activity_logs');
    }
};
