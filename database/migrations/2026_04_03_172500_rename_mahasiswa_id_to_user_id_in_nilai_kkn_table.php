<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Bug #5 Fix: Rename mahasiswa_id to user_id to reflect actual data stored.
     * The column was confusing because it stores users.id, not mahasiswa.id.
     */
    public function up(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->renameColumn('mahasiswa_id', 'user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->renameColumn('user_id', 'mahasiswa_id');
        });
    }
};
