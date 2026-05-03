<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->dropUserForeignKeyIfExists('dosen');

        Schema::table('dosen', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        Schema::table('dosen', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->timestamp('password_changed_at')->nullable()->after('must_change_password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['must_change_password', 'password_changed_at']);
        });

        $this->dropUserForeignKeyIfExists('dosen');

        DB::statement('UPDATE dosen SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1) WHERE user_id IS NULL');

        Schema::table('dosen', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });

        Schema::table('dosen', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    private function dropUserForeignKeyIfExists(string $table): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $constraintName = DB::table('information_schema.table_constraints as tc')
                ->join('information_schema.key_column_usage as kcu', function ($join) {
                    $join->on('tc.constraint_name', '=', 'kcu.constraint_name')
                        ->on('tc.table_schema', '=', 'kcu.table_schema');
                })
                ->where('tc.constraint_type', 'FOREIGN KEY')
                ->where('tc.table_name', $table)
                ->where('kcu.column_name', 'user_id')
                ->value('tc.constraint_name');

            if ($constraintName) {
                DB::statement(sprintf('ALTER TABLE "%s" DROP CONSTRAINT "%s"', $table, $constraintName));
            }

            return;
        }

        try {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['user_id']);
            });
        } catch (Throwable) {
            // Ignore when SQLite/local schema has no named FK to drop.
        }
    }
};
