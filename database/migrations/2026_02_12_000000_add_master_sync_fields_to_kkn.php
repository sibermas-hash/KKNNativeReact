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
        Schema::table('fakultas', function (Blueprint $table) {
            $table->unsignedBigInteger('master_id')->nullable();
            $table->timestamp('master_synced_at')->nullable();
        });

        Schema::table('dosen', function (Blueprint $table) {
            $table->unsignedBigInteger('master_id')->nullable();
            $table->timestamp('master_synced_at')->nullable();
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->unsignedBigInteger('master_id')->nullable();
            $table->timestamp('master_synced_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fakultas', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });

        Schema::table('dosen', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });
    }
};
