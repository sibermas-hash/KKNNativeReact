<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan kolom anti-spoof untuk kegiatan_kkn (R10-002).
     *
     * - gps_is_mock: boolean (dari Android Location.isFromMockProvider)
     * - gps_spoof_score: smallInt (0-100, output GpsAntiSpoofService)
     * - gps_spoof_details: JSON (array of suspicions dengan code + message + severity)
     *
     * Nullable semua agar backward-compatible dengan data lama.
     */
    public function up(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('kegiatan_kkn', 'gps_is_mock')) {
                $table->boolean('gps_is_mock')->nullable()->after('gps_accuracy');
            }
            if (! Schema::hasColumn('kegiatan_kkn', 'gps_spoof_score')) {
                $table->unsignedSmallInteger('gps_spoof_score')->nullable()->after('gps_is_mock');
            }
            if (! Schema::hasColumn('kegiatan_kkn', 'gps_spoof_details')) {
                $table->json('gps_spoof_details')->nullable()->after('gps_spoof_score');
            }
        });
    }

    public function down(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropColumn(['gps_is_mock', 'gps_spoof_score', 'gps_spoof_details']);
        });
    }
};
