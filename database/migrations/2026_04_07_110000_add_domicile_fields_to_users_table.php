<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('domicile_village_name', 150)->nullable()->after('address');
            $table->string('domicile_district_name', 150)->nullable()->after('domicile_village_name');
            $table->string('domicile_regency_name', 150)->nullable()->after('domicile_district_name');
            $table->timestamp('address_verified_at')->nullable()->after('domicile_regency_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'domicile_village_name',
                'domicile_district_name',
                'domicile_regency_name',
                'address_verified_at',
            ]);
        });
    }
};
