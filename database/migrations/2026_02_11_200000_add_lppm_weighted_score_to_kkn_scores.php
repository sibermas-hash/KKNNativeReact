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
        Schema::table('kkn_scores', function (Blueprint $table) {
            $table->decimal('lppm_weighted_score', 5, 2)->nullable()->after('village_weighted_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kkn_scores', function (Blueprint $table) {
            $table->dropColumn('lppm_weighted_score');
        });
    }
};
