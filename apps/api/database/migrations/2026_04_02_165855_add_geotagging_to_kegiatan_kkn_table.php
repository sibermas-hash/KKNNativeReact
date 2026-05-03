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
        if (! Schema::hasTable('kegiatan_kkn')) {
            return;
        }

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('kegiatan_kkn', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('output');
            }

            if (! Schema::hasColumn('kegiatan_kkn', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }

            if (! Schema::hasColumn('kegiatan_kkn', 'location_name')) {
                $table->string('location_name')->nullable()->after('longitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('kegiatan_kkn')) {
            return;
        }

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $columns = collect(['latitude', 'longitude', 'location_name'])
                ->filter(fn (string $column) => Schema::hasColumn('kegiatan_kkn', $column))
                ->values()
                ->all();

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
