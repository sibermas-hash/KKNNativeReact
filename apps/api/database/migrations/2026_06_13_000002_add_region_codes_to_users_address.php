<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'address_province_code')) {
                $table->string('address_province_code', 2)->nullable()->after('address_postal_code')->index();
            }
            if (! Schema::hasColumn('users', 'address_regency_code')) {
                $table->string('address_regency_code', 5)->nullable()->after('address_province_code')->index();
            }
            if (! Schema::hasColumn('users', 'address_district_code')) {
                $table->string('address_district_code', 8)->nullable()->after('address_regency_code')->index();
            }
            if (! Schema::hasColumn('users', 'address_village_code')) {
                $table->string('address_village_code', 13)->nullable()->after('address_district_code')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['address_village_code', 'address_district_code', 'address_regency_code', 'address_province_code'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
