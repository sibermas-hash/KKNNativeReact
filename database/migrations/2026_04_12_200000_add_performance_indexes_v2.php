<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // activities_kkn indexes
        Schema::connection('kkn')->table('activities_kkn', function (Blueprint $table) {
            $table->index('abcd_stage');
            $table->index('status');
            $table->index(['abcd_stage', 'status']);
        });

        // participants (peserta_kkn) indexes
        Schema::connection('kkn')->table('participants', function (Blueprint $table) {
            $table->index('period_id');
            $table->index('group_id');
            $table->index(['period_id', 'status']);
            $table->index(['period_id', 'group_id']);
        });

        // daily_reports indexes for common queries
        Schema::connection('kkn')->table('daily_reports', function (Blueprint $table) {
            $table->index('date');
            $table->index(['student_id', 'date']);
            $table->index(['group_id', 'date']);
        });

        // registrations indexes
        Schema::connection('kkn')->table('registrations', function (Blueprint $table) {
            $table->index(['period_id', 'status']);
            $table->index(['student_id', 'period_id']);
        });

        // nilai_kkn indexes
        Schema::connection('kkn')->table('nilai_kkn', function (Blueprint $table) {
            $table->index('total_score');
            $table->index('letter_grade');
        });

        // groups indexes
        Schema::connection('kkn')->table('groups', function (Blueprint $table) {
            $table->index('status');
            $table->index(['period_id', 'status']);
        });

        // work_programs indexes
        Schema::connection('kkn')->table('work_programs', function (Blueprint $table) {
            $table->index('abcd_stage');
            $table->index('status');
            $table->index(['abcd_stage', 'status']);
        });

        // notifications indexes
        Schema::connection('kkn')->table('notifications', function (Blueprint $table) {
            $table->index('read_at');
            $table->index(['notifiable_type', 'notifiable_id', 'read_at']);
        });

        // audit_logs indexes for common queries
        Schema::connection('kkn')->table('audit_logs', function (Blueprint $table) {
            $table->index('event');
            $table->index('created_at');
        });

        // lecturers indexes
        Schema::connection('kkn')->table('lecturers', function (Blueprint $table) {
            $table->index('nip');
            $table->index('faculty_id');
        });

        // students indexes
        Schema::connection('kkn')->table('students', function (Blueprint $table) {
            $table->index('nim');
            $table->index('faculty_id');
            $table->index('program_id');
            $table->index('batch_year');
        });

        // locations indexes
        Schema::connection('kkn')->table('locations', function (Blueprint $table) {
            $table->index('district_id');
            $table->index('regency_id');
        });
    }

    public function down(): void
    {
        Schema::connection('kkn')->table('activities_kkn', function (Blueprint $table) {
            $table->dropIndex(['abcd_stage']);
            $table->dropIndex(['status']);
            $table->dropIndex(['abcd_stage_status']);
        });

        Schema::connection('kkn')->table('participants', function (Blueprint $table) {
            $table->dropIndex(['period_id']);
            $table->dropIndex(['group_id']);
            $table->dropIndex(['period_id_status']);
            $table->dropIndex(['period_id_group_id']);
        });

        Schema::connection('kkn')->table('daily_reports', function (Blueprint $table) {
            $table->dropIndex(['date']);
            $table->dropIndex(['student_id_date']);
            $table->dropIndex(['group_id_date']);
        });

        Schema::connection('kkn')->table('registrations', function (Blueprint $table) {
            $table->dropIndex(['period_id_status']);
            $table->dropIndex(['student_id_period_id']);
        });

        Schema::connection('kkn')->table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex(['total_score']);
            $table->dropIndex(['letter_grade']);
        });

        Schema::connection('kkn')->table('groups', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['period_id_status']);
        });

        Schema::connection('kkn')->table('work_programs', function (Blueprint $table) {
            $table->dropIndex(['abcd_stage']);
            $table->dropIndex(['status']);
            $table->dropIndex(['abcd_stage_status']);
        });

        Schema::connection('kkn')->table('notifications', function (Blueprint $table) {
            $table->dropIndex(['read_at']);
            $table->dropIndex(['notifiable_type_notifiable_id_read_at']);
        });

        Schema::connection('kkn')->table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['event']);
            $table->dropIndex(['created_at']);
        });

        Schema::connection('kkn')->table('lecturers', function (Blueprint $table) {
            $table->dropIndex(['nip']);
            $table->dropIndex(['faculty_id']);
        });

        Schema::connection('kkn')->table('students', function (Blueprint $table) {
            $table->dropIndex(['nim']);
            $table->dropIndex(['faculty_id']);
            $table->dropIndex(['program_id']);
            $table->dropIndex(['batch_year']);
        });

        Schema::connection('kkn')->table('locations', function (Blueprint $table) {
            $table->dropIndex(['district_id']);
            $table->dropIndex(['regency_id']);
        });
    }
};
