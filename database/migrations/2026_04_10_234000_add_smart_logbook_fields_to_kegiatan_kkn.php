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
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            if (!Schema::hasColumn('kegiatan_kkn', 'category')) {
                $table->string('category')->nullable()->after('date');
            }
            if (!Schema::hasColumn('kegiatan_kkn', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
            }
            if (!Schema::hasColumn('kegiatan_kkn', 'gps_accuracy')) {
                $table->integer('gps_accuracy')->nullable();
            }
            if (!Schema::hasColumn('kegiatan_kkn', 'captured_at')) {
                $table->timestamp('captured_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropColumn(['category', 'latitude', 'longitude', 'gps_accuracy', 'captured_at']);
        });
    }
};
