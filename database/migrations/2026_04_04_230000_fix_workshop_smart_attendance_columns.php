<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('kkn')->hasTable('workshop')) {
            return;
        }

        Schema::connection('kkn')->table('workshop', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('workshop', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable();
            }

            if (! Schema::connection('kkn')->hasColumn('workshop', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable();
            }

            if (! Schema::connection('kkn')->hasColumn('workshop', 'radius_meters')) {
                $table->integer('radius_meters')->default(100);
            }

            if (! Schema::connection('kkn')->hasColumn('workshop', 'active_token')) {
                $table->string('active_token', 10)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::connection('kkn')->hasTable('workshop')) {
            return;
        }

        Schema::connection('kkn')->table('workshop', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::connection('kkn')->hasColumn('workshop', 'latitude') ? 'latitude' : null,
                Schema::connection('kkn')->hasColumn('workshop', 'longitude') ? 'longitude' : null,
                Schema::connection('kkn')->hasColumn('workshop', 'radius_meters') ? 'radius_meters' : null,
                Schema::connection('kkn')->hasColumn('workshop', 'active_token') ? 'active_token' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
