<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $blueprint) {
            $blueprint->json('custom_requirements')->nullable()->after('require_bta_ppi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $blueprint) {
            $blueprint->dropColumn('custom_requirements');
        });
    }
};
