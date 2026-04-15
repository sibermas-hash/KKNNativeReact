<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $workshopTable = Schema::connection('kkn')->hasTable('workshop')
            ? 'workshop'
            : (Schema::connection('kkn')->hasTable('workshops') ? 'workshops' : null);

        if ($workshopTable) {
            Schema::connection('kkn')->table($workshopTable, function (Blueprint $table) use ($workshopTable) {
                if (! Schema::connection('kkn')->hasColumn($workshopTable, 'latitude')) {
                    $table->decimal('latitude', 10, 8)->nullable();
                }
                if (! Schema::connection('kkn')->hasColumn($workshopTable, 'longitude')) {
                    $table->decimal('longitude', 11, 8)->nullable();
                }
                if (! Schema::connection('kkn')->hasColumn($workshopTable, 'radius_meters')) {
                    $table->integer('radius_meters')->default(100);
                }
                if (! Schema::connection('kkn')->hasColumn($workshopTable, 'active_token')) {
                    $table->string('active_token', 10)->nullable();
                }
            });
        }

        if (Schema::connection('kkn')->hasTable('peserta_workshop')) {
            Schema::connection('kkn')->table('peserta_workshop', function (Blueprint $table) {
                if (! Schema::connection('kkn')->hasColumn('peserta_workshop', 'device_signature')) {
                    $table->string('device_signature')->nullable();
                }
                if (! Schema::connection('kkn')->hasColumn('peserta_workshop', 'ip_address')) {
                    $table->string('ip_address')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        $workshopTable = Schema::connection('kkn')->hasTable('workshop')
            ? 'workshop'
            : (Schema::connection('kkn')->hasTable('workshops') ? 'workshops' : null);

        if ($workshopTable) {
            Schema::connection('kkn')->table($workshopTable, function (Blueprint $table) use ($workshopTable) {
                $columns = array_values(array_filter([
                    Schema::connection('kkn')->hasColumn($workshopTable, 'latitude') ? 'latitude' : null,
                    Schema::connection('kkn')->hasColumn($workshopTable, 'longitude') ? 'longitude' : null,
                    Schema::connection('kkn')->hasColumn($workshopTable, 'radius_meters') ? 'radius_meters' : null,
                    Schema::connection('kkn')->hasColumn($workshopTable, 'active_token') ? 'active_token' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::connection('kkn')->hasTable('peserta_workshop')) {
            Schema::connection('kkn')->table('peserta_workshop', function (Blueprint $table) {
                $columns = array_values(array_filter([
                    Schema::connection('kkn')->hasColumn('peserta_workshop', 'device_signature') ? 'device_signature' : null,
                    Schema::connection('kkn')->hasColumn('peserta_workshop', 'ip_address') ? 'ip_address' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
