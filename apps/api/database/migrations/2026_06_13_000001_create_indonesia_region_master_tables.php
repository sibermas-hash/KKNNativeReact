<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indonesia_provinces', function (Blueprint $table) {
            $table->string('code', 2)->primary();
            $table->string('name', 100)->index();
            $table->timestamps();
        });

        Schema::create('indonesia_regencies', function (Blueprint $table) {
            $table->string('code', 5)->primary();
            $table->string('province_code', 2)->index();
            $table->string('name', 150)->index();
            $table->timestamps();
            $table->foreign('province_code')->references('code')->on('indonesia_provinces')->cascadeOnDelete();
        });

        Schema::create('indonesia_districts', function (Blueprint $table) {
            $table->string('code', 8)->primary();
            $table->string('regency_code', 5)->index();
            $table->string('name', 150)->index();
            $table->timestamps();
            $table->foreign('regency_code')->references('code')->on('indonesia_regencies')->cascadeOnDelete();
        });

        Schema::create('indonesia_villages', function (Blueprint $table) {
            $table->string('code', 13)->primary();
            $table->string('district_code', 8)->index();
            $table->string('name', 150)->index();
            $table->timestamps();
            $table->foreign('district_code')->references('code')->on('indonesia_districts')->cascadeOnDelete();
        });

        Schema::table('lokasi', function (Blueprint $table) {
            if (! Schema::hasColumn('lokasi', 'province_code')) {
                $table->string('province_code', 2)->nullable()->after('province_id')->index();
            }
            if (! Schema::hasColumn('lokasi', 'regency_code')) {
                $table->string('regency_code', 5)->nullable()->after('regency_id')->index();
            }
            if (! Schema::hasColumn('lokasi', 'district_code')) {
                $table->string('district_code', 8)->nullable()->after('district_id')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            foreach (['province_code', 'regency_code', 'district_code'] as $column) {
                if (Schema::hasColumn('lokasi', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('indonesia_villages');
        Schema::dropIfExists('indonesia_districts');
        Schema::dropIfExists('indonesia_regencies');
        Schema::dropIfExists('indonesia_provinces');
    }
};
