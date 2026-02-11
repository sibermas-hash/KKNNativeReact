<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_index ON audit_logs (action, created_at)');
            DB::statement('CREATE INDEX IF NOT EXISTS audit_logs_user_id_created_at_index ON audit_logs (user_id, created_at)');
            DB::statement('CREATE INDEX IF NOT EXISTS audit_logs_ip_address_index ON audit_logs (ip_address)');
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['action', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('ip_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS audit_logs_action_created_at_index');
            DB::statement('DROP INDEX IF EXISTS audit_logs_user_id_created_at_index');
            DB::statement('DROP INDEX IF EXISTS audit_logs_ip_address_index');
            return;
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex('ip_address');
        });
    }
};
