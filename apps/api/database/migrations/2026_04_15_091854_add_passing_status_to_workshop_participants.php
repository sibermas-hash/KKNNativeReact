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
        Schema::table('peserta_workshop', function (Blueprint $table) {
            $table->boolean('is_passed')->default(false)->after('attendance_status');
            $table->text('passing_notes')->nullable()->after('is_passed');
        });
    }

    public function down(): void
    {
        Schema::table('peserta_workshop', function (Blueprint $table) {
            $table->dropColumn(['is_passed', 'passing_notes']);
        });
    }
};
