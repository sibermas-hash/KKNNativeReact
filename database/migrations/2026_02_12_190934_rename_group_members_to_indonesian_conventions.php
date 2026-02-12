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
        Schema::rename('group_members', 'anggota_kelompok');
        Schema::table('anggota_kelompok', function (Blueprint $table) {
            $table->renameColumn('group_id', 'kelompok_id');
            $table->renameColumn('student_id', 'mahasiswa_id');
        });
    }

    public function down(): void
    {
        Schema::table('anggota_kelompok', function (Blueprint $table) {
            $table->renameColumn('mahasiswa_id', 'student_id');
            $table->renameColumn('kelompok_id', 'group_id');
        });
        Schema::rename('anggota_kelompok', 'group_members');
    }
};
