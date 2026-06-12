<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            if (! Schema::hasColumn('lokasi', 'district_name')) {
                $table->string('district_name', 100)->nullable()->after('district_id');
            }
            if (! Schema::hasColumn('lokasi', 'regency_name')) {
                $table->string('regency_name', 100)->nullable()->after('regency_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            $columnsToDrop = array_filter([
                Schema::hasColumn('lokasi', 'district_name') ? 'district_name' : null,
                Schema::hasColumn('lokasi', 'regency_name') ? 'regency_name' : null,
            ]);
            if ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
