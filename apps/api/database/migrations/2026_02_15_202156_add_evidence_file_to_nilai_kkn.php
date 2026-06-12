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
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->string('evidence_file')->nullable()->after('village_graded_at');
        });
    }

    public function down(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropColumn('evidence_file');
        });
    }
};
