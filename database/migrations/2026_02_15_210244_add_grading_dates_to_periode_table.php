<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $table->date('grading_start')->nullable()->after('end_date');
            $table->date('grading_end')->nullable()->after('grading_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $table->dropColumn(['grading_start', 'grading_end']);
        });
    }
};