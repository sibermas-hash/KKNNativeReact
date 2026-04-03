<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            $table->string('district_name', 100)->nullable()->after('district_id');
            $table->string('regency_name', 100)->nullable()->after('regency_id');
        });
    }

    public function down(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            $table->dropColumn(['district_name', 'regency_name']);
        });
    }
};
