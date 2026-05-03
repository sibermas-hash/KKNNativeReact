<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('workshop')) {
            return;
        }

        Schema::table('workshop', function (Blueprint $table) {
            if (! Schema::hasColumn('workshop', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable();
            }

            if (! Schema::hasColumn('workshop', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable();
            }

            if (! Schema::hasColumn('workshop', 'radius_meters')) {
                $table->integer('radius_meters')->default(100);
            }

            if (! Schema::hasColumn('workshop', 'active_token')) {
                $table->string('active_token', 10)->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('workshop')) {
            return;
        }

        Schema::table('workshop', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('workshop', 'latitude') ? 'latitude' : null,
                Schema::hasColumn('workshop', 'longitude') ? 'longitude' : null,
                Schema::hasColumn('workshop', 'radius_meters') ? 'radius_meters' : null,
                Schema::hasColumn('workshop', 'active_token') ? 'active_token' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
