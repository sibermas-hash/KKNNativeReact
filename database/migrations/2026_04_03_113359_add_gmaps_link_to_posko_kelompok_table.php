<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('kkn')->hasTable('posko_kelompok')) {
            return;
        }

        if (Schema::connection('kkn')->hasColumn('posko_kelompok', 'gmaps_link')) {
            return;
        }

        Schema::connection('kkn')->table('posko_kelompok', function (Blueprint $table) {
            $table->string('gmaps_link')->nullable()->after('longitude');
        });
    }

    public function down(): void
    {
        if (! Schema::connection('kkn')->hasTable('posko_kelompok')) {
            return;
        }

        if (! Schema::connection('kkn')->hasColumn('posko_kelompok', 'gmaps_link')) {
            return;
        }

        Schema::connection('kkn')->table('posko_kelompok', function (Blueprint $table) {
            $table->dropColumn('gmaps_link');
        });
    }
};
