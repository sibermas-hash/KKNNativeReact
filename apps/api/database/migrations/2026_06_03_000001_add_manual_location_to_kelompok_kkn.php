<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kelompok_kkn', function (Blueprint $table): void {
            if (! Schema::hasColumn('kelompok_kkn', 'lokasi_manual')) {
                $table->string('lokasi_manual')->nullable()->after('location_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('kelompok_kkn', function (Blueprint $table): void {
            if (Schema::hasColumn('kelompok_kkn', 'lokasi_manual')) {
                $table->dropColumn('lokasi_manual');
            }
        });
    }
};
