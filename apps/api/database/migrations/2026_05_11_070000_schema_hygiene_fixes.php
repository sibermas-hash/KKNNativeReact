<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * R13-DB-006: add (user_id, created_at) composite index to user_activity_logs.
 *   R12 audit flagged that the dashboard's "user X recent activity" query
 *   falls back to a scan because the only user_id-prefixed index is
 *   (user_id, action). Adding (user_id, created_at) lets PostgreSQL use an
 *   index range scan for the common case.
 *
 * R13-DB-008: chat_messages.sender_id was `cascadeOnDelete` → deleting a
 *   user destroyed their sent messages. Swap to SET NULL so the
 *   conversation stays coherent ("[Deleted User]" shown instead).
 *
 * R13-DB-012: dispensasi_kkn.granted_by was a bare bigint — add proper FK
 *   with nullOnDelete so orphan references are prevented.
 *
 * All operations are gated behind schema/column/index existence checks to
 * keep the migration idempotent on existing deployments.
 */
return new class extends Migration
{
    public function up(): void
    {
        // R13-DB-006
        if (Schema::hasTable('user_activity_logs') && Schema::hasColumn('user_activity_logs', 'user_id')) {
            $exists = DB::selectOne(
                "SELECT 1 FROM pg_indexes WHERE tablename = 'user_activity_logs' AND indexname = 'user_activity_logs_user_id_created_at_index'"
            );
            if (! $exists) {
                Schema::table('user_activity_logs', function (Blueprint $t): void {
                    $t->index(['user_id', 'created_at']);
                });
            }
        }

        // R13-DB-008: chat_messages.sender_id → nullable + SET NULL
        if (Schema::hasTable('chat_messages') && Schema::hasColumn('chat_messages', 'sender_id')) {
            Schema::table('chat_messages', function (Blueprint $t): void {
                // Drop prior FK (if any), widen to nullable, then re-add with nullOnDelete.
                try {
                    $t->dropForeign(['sender_id']);
                } catch (Throwable) {
                    // no prior FK — ok
                }
                $t->foreignId('sender_id')->nullable()->change();
                $t->foreign('sender_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        // R13-DB-012: dispensasi_kkn.granted_by → add FK if missing
        if (Schema::hasTable('dispensasi_kkn') && Schema::hasColumn('dispensasi_kkn', 'granted_by')) {
            $hasFk = DB::selectOne(
                "SELECT 1 FROM information_schema.table_constraints
                 WHERE table_name = 'dispensasi_kkn'
                   AND constraint_type = 'FOREIGN KEY'
                   AND constraint_name LIKE '%granted_by%'"
            );
            if (! $hasFk) {
                Schema::table('dispensasi_kkn', function (Blueprint $t): void {
                    $t->foreign('granted_by')->references('id')->on('users')->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('user_activity_logs')) {
            $exists = DB::selectOne(
                "SELECT 1 FROM pg_indexes WHERE tablename = 'user_activity_logs' AND indexname = 'user_activity_logs_user_id_created_at_index'"
            );
            if ($exists) {
                Schema::table('user_activity_logs', function (Blueprint $t): void {
                    $t->dropIndex(['user_id', 'created_at']);
                });
            }
        }

        if (Schema::hasTable('chat_messages') && Schema::hasColumn('chat_messages', 'sender_id')) {
            Schema::table('chat_messages', function (Blueprint $t): void {
                try {
                    $t->dropForeign(['sender_id']);
                } catch (Throwable) {
                }
                // Revert to NOT NULL + cascadeOnDelete to match the original migration.
                $t->foreignId('sender_id')->nullable(false)->change();
                $t->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('dispensasi_kkn')) {
            Schema::table('dispensasi_kkn', function (Blueprint $t): void {
                try {
                    $t->dropForeign(['granted_by']);
                } catch (Throwable) {
                }
            });
        }
    }
};
