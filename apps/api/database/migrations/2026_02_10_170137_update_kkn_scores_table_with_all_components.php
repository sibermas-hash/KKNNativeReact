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
            // Komponen A - DPL (50%)
            $table->decimal('final_report_score', 5, 2)->nullable()->after('kelompok_id');
            // execution_score and article_score already exist

            // Komponen C - LPPM/Admin (20%)
            $table->decimal('workshop_score', 5, 2)->nullable()->after('attitude_score');
            $table->decimal('administration_score', 5, 2)->nullable()->after('workshop_score');

            // Evaluator for Admin component
            $table->foreignId('admin_graded_by')->nullable()->after('village_graded_by')->constrained('users');
            $table->timestamp('admin_graded_at')->nullable()->after('village_graded_at');

            $table->boolean('is_finalized')->default(false)->after('letter_grade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropColumn([
                'final_report_score',
                'workshop_score',
                'administration_score',
                'admin_graded_by',
                'admin_graded_at',
                'is_finalized',
            ]);
        });
    }
};
