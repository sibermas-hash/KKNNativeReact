<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds avatar moderation workflow columns to users table.
 *
 * Context: PRD_AVATAR_VALIDATION.md defines a 4-layer validation system.
 * Layer 3 (AI vision) may fail or return ambiguous results, requiring
 * Layer 4 (human admin review). These columns track the moderation state.
 *
 * Status values:
 *   - 'approved' — Foto lolos validasi (AI/auto atau admin)
 *   - 'pending'  — Menunggu review admin (AI gagal atau requires_manual_review)
 *   - 'rejected' — Ditolak admin (foto akan dihapus, user harus upload ulang)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('avatar_moderation_status', 16)->nullable()->after('avatar');
            $t->string('avatar_moderation_reason', 500)->nullable()->after('avatar_moderation_status');
            $t->timestamp('avatar_moderation_reviewed_at')->nullable()->after('avatar_moderation_reason');
            $t->foreignId('avatar_moderation_reviewed_by')->nullable()->constrained('users')->nullOnDelete()->after('avatar_moderation_reviewed_at');

            $t->index('avatar_moderation_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropForeign(['avatar_moderation_reviewed_by']);
            $t->dropIndex(['avatar_moderation_status']);
            $t->dropColumn([
                'avatar_moderation_status',
                'avatar_moderation_reason',
                'avatar_moderation_reviewed_at',
                'avatar_moderation_reviewed_by',
            ]);
        });
    }
};
