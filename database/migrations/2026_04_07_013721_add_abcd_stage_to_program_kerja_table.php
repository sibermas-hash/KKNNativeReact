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
        Schema::connection('kkn')->table('program_kerja', function (Blueprint $table) {
            if (! Schema::hasColumn('program_kerja', 'abcd_stage')) {
                $table->string('abcd_stage')->default('Discovery')->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('program_kerja', function (Blueprint $table) {
            if (Schema::hasColumn('program_kerja', 'abcd_stage')) {
                $table->dropColumn('abcd_stage');
            }
        });
    }
};
