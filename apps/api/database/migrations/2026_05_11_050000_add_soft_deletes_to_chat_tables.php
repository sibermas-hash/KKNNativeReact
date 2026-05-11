<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit R12-D2-014/015 fix: tambahkan soft delete ke chat_conversations
 * dan chat_messages. Percakapan + pesan konsultasi adalah data
 * audit-sensitive yang tidak boleh hard-delete (ada potensi rujukan
 * hukum/akademik di masa depan).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('chat_conversations') && ! Schema::hasColumn('chat_conversations', 'deleted_at')) {
            Schema::table('chat_conversations', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('chat_messages') && ! Schema::hasColumn('chat_messages', 'deleted_at')) {
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('chat_conversations') && Schema::hasColumn('chat_conversations', 'deleted_at')) {
            Schema::table('chat_conversations', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('chat_messages') && Schema::hasColumn('chat_messages', 'deleted_at')) {
            Schema::table('chat_messages', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
