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
        Schema::table('faculties', function (Blueprint $table) {
            $table->unsignedBigInteger('master_id')->nullable();
            $table->timestamp('master_synced_at')->nullable();
        });

        Schema::table('lecturers', function (Blueprint $table) {
            $table->unsignedBigInteger('master_id')->nullable();
            $table->timestamp('master_synced_at')->nullable();
        });

        Schema::table('students', function (Blueprint $table) {
            $table->unsignedBigInteger('master_id')->nullable();
            $table->timestamp('master_synced_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('faculties', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });

        Schema::table('lecturers', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });
    }
};
