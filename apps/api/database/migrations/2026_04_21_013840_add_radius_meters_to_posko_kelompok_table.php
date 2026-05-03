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
        Schema::table('posko_kelompok', function (Blueprint $table) {
            if (! Schema::hasColumn('posko_kelompok', 'radius_meters')) {
                $table->integer('radius_meters')->default(100)->after('longitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posko_kelompok', function (Blueprint $table) {
            if (Schema::hasColumn('posko_kelompok', 'radius_meters')) {
                $table->dropColumn('radius_meters');
            }
        });
    }
};
