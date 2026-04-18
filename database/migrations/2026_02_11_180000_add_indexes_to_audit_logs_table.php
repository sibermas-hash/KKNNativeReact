<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE INDEX IF NOT EXISTS log_audit_action_created_at_index ON log_audit (action, created_at)');
            DB::statement('CREATE INDEX IF NOT EXISTS log_audit_user_id_created_at_index ON log_audit (user_id, created_at)');
            DB::statement('CREATE INDEX IF NOT EXISTS log_audit_ip_address_index ON log_audit (ip_address)');

            return;
        }

        Schema::table('log_audit', function (Blueprint $table) {
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
            DB::statement('DROP INDEX IF EXISTS log_audit_action_created_at_index');
            DB::statement('DROP INDEX IF EXISTS log_audit_user_id_created_at_index');
            DB::statement('DROP INDEX IF EXISTS log_audit_ip_address_index');

            return;
        }

        Schema::table('log_audit', function (Blueprint $table) {
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex('ip_address');
        });
    }
};
