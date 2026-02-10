<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance optimization: Add critical indexes for frequently queried columns.
 * 
 * These indexes target:
 * - Dashboard aggregate queries (student/report counts by status)
 * - Grading lookups (student + group composite)
 * - Daily report filtering (group + status for DPL approval workflow)
 * - Registration filtering (student + period, status)
 */
return new class extends Migration
{
    public function up(): void
    {
        // KKN Scores - critical for grade lookups
        Schema::table('kkn_scores', function (Blueprint $table) {
            $table->index(['student_id', 'group_id'], 'idx_kkn_scores_student_group');
            $table->index('is_finalized', 'idx_kkn_scores_finalized');
        });

        // Daily Reports - DPL approval workflow
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->index(['group_id', 'status'], 'idx_daily_reports_group_status');
            $table->index(['student_id', 'status'], 'idx_daily_reports_student_status');
            $table->index('date', 'idx_daily_reports_date');
        });

        // Registrations - student period lookups  
        Schema::table('registrations', function (Blueprint $table) {
            $table->index(['student_id', 'period_id'], 'idx_registrations_student_period');
            $table->index('status', 'idx_registrations_status');
        });

        // Evaluations - student group lookups
        Schema::table('evaluations', function (Blueprint $table) {
            $table->index(['student_id', 'group_id'], 'idx_evaluations_student_group');
        });

        // Groups - period lookups for filtered views
        Schema::table('groups', function (Blueprint $table) {
            $table->index(['period_id', 'status'], 'idx_groups_period_status');
        });
    }

    public function down(): void
    {
        Schema::table('kkn_scores', function (Blueprint $table) {
            $table->dropIndex('idx_kkn_scores_student_group');
            $table->dropIndex('idx_kkn_scores_finalized');
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropIndex('idx_daily_reports_group_status');
            $table->dropIndex('idx_daily_reports_student_status');
            $table->dropIndex('idx_daily_reports_date');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex('idx_registrations_student_period');
            $table->dropIndex('idx_registrations_status');
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropIndex('idx_evaluations_student_group');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropIndex('idx_groups_period_status');
        });
    }
};
