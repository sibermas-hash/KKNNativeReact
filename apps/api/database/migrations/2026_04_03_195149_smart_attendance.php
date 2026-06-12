<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $workshopTable = Schema::hasTable('workshop')
            ? 'workshop'
            : (Schema::hasTable('workshop') ? 'workshop' : null);

        if ($workshopTable) {
            Schema::table($workshopTable, function (Blueprint $table) use ($workshopTable) {
                if (! Schema::hasColumn($workshopTable, 'latitude')) {
                    $table->decimal('latitude', 10, 8)->nullable();
                }
                if (! Schema::hasColumn($workshopTable, 'longitude')) {
                    $table->decimal('longitude', 11, 8)->nullable();
                }
                if (! Schema::hasColumn($workshopTable, 'radius_meters')) {
                    $table->integer('radius_meters')->default(100);
                }
                if (! Schema::hasColumn($workshopTable, 'active_token')) {
                    $table->string('active_token', 10)->nullable();
                }
            });
        }

        if (Schema::hasTable('peserta_workshop')) {
            Schema::table('peserta_workshop', function (Blueprint $table) {
                if (! Schema::hasColumn('peserta_workshop', 'device_signature')) {
                    $table->string('device_signature')->nullable();
                }
                if (! Schema::hasColumn('peserta_workshop', 'ip_address')) {
                    $table->string('ip_address')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        $workshopTable = Schema::hasTable('workshop')
            ? 'workshop'
            : (Schema::hasTable('workshop') ? 'workshop' : null);

        if ($workshopTable) {
            Schema::table($workshopTable, function (Blueprint $table) use ($workshopTable) {
                $columns = array_values(array_filter([
                    Schema::hasColumn($workshopTable, 'latitude') ? 'latitude' : null,
                    Schema::hasColumn($workshopTable, 'longitude') ? 'longitude' : null,
                    Schema::hasColumn($workshopTable, 'radius_meters') ? 'radius_meters' : null,
                    Schema::hasColumn($workshopTable, 'active_token') ? 'active_token' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('peserta_workshop')) {
            Schema::table('peserta_workshop', function (Blueprint $table) {
                $columns = array_values(array_filter([
                    Schema::hasColumn('peserta_workshop', 'device_signature') ? 'device_signature' : null,
                    Schema::hasColumn('peserta_workshop', 'ip_address') ? 'ip_address' : null,
                ]));

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
