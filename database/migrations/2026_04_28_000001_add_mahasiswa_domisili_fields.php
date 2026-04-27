<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->decimal('domisili_lat', 10, 8)->nullable()->after('is_paid_ukt');
            $table->decimal('domisili_lng', 11, 8)->nullable()->after('domisili_lat');
            $table->string('domisili_address', 500)->nullable()->after('domisili_lng');
            $table->string('domisili_village', 100)->nullable()->after('domisili_address');
            $table->string('domisili_district', 100)->nullable()->after('domisili_village');
            $table->string('domisili_regency', 100)->nullable()->after('domisili_district');
            $table->string('domisili_province', 100)->nullable()->after('domisili_regency');
            $table->string('domisili_postal_code', 10)->nullable()->after('domisili_province');
            $table->timestamp('domisili_registered_at')->nullable()->after('domisili_postal_code');
        });
    }

    public function down(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->dropColumns([
                'domisili_lat',
                'domisili_lng',
                'domisili_address',
                'domisili_village',
                'domisili_district',
                'domisili_regency',
                'domisili_province',
                'domisili_postal_code',
                'domisili_registered_at',
            ]);
        });
    }
};