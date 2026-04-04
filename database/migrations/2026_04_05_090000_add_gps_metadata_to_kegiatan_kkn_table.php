<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('kkn')->hasTable('kegiatan_kkn')) {
            return;
        }

        Schema::connection('kkn')->table('kegiatan_kkn', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('kegiatan_kkn', 'gps_accuracy')) {
                $table->decimal('gps_accuracy', 8, 2)->nullable()->after('longitude');
            }

            if (! Schema::connection('kkn')->hasColumn('kegiatan_kkn', 'captured_at')) {
                $table->timestamp('captured_at')->nullable()->after('gps_accuracy');
            }

            if (! Schema::connection('kkn')->hasColumn('kegiatan_kkn', 'location_source')) {
                $table->string('location_source', 20)->nullable()->after('captured_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::connection('kkn')->hasTable('kegiatan_kkn')) {
            return;
        }

        Schema::connection('kkn')->table('kegiatan_kkn', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::connection('kkn')->hasColumn('kegiatan_kkn', 'gps_accuracy') ? 'gps_accuracy' : null,
                Schema::connection('kkn')->hasColumn('kegiatan_kkn', 'captured_at') ? 'captured_at' : null,
                Schema::connection('kkn')->hasColumn('kegiatan_kkn', 'location_source') ? 'location_source' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
