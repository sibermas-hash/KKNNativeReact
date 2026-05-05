<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monitoring_dpl', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('catatan_tambahan');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->string('photo_path')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        Schema::table('monitoring_dpl', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'photo_path']);
        });
    }
};
