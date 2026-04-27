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
        Schema::table('todos', function (Blueprint $table) {
            $table->index('status', 'idx_todos_status');
        });

        Schema::table('todo_deps', function (Blueprint $table) {
            $table->index('depends_on', 'idx_tododeps_depends');
        });

        Schema::table('inbox_entries', function (Blueprint $table) {
            $table->index(['recipient_session_id', 'sent_at'], 'idx_inbox_recipient_sent_at');
            $table->index('unread', 'idx_inbox_unread');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            $table->dropIndex('idx_todos_status');
        });

        Schema::table('todo_deps', function (Blueprint $table) {
            $table->dropIndex('idx_tododeps_depends');
        });

        Schema::table('inbox_entries', function (Blueprint $table) {
            $table->dropIndex('idx_inbox_recipient_sent_at');
            $table->dropIndex('idx_inbox_unread');
        });
    }
};
