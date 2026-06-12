<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop unique constraint on prodi.code — master_id is the true unique key
        Schema::table('prodi', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->string('code', 20)->nullable()->change(); // widen + allow null
        });

        // 2. Set code = master_id for all prodi (master_id is already unique)
        DB::statement('UPDATE prodi SET code = master_id WHERE master_id IS NOT NULL');

        // 3. Add unique constraint on master_id instead
        Schema::table('prodi', function (Blueprint $table) {
            // master_id already has no unique constraint — add it
            $table->unique('master_id', 'prodi_master_id_unique');
        });

        // 4. Fix user-mahasiswa gap: link users to their mahasiswa records by NIM=username
        DB::statement('
            UPDATE mahasiswa m
            SET user_id = u.id
            FROM users u
            WHERE u.username = m.nim
              AND m.user_id IS NULL
        ');

        // Also fix cases where user exists but mahasiswa.user_id points to wrong user
        DB::statement('
            UPDATE mahasiswa m
            SET user_id = u.id
            FROM users u
            WHERE u.username = m.nim
              AND m.user_id != u.id
        ');
    }

    public function down(): void
    {
        Schema::table('prodi', function (Blueprint $table) {
            $table->dropUnique('prodi_master_id_unique');
            $table->unique('code');
        });
    }
};
