<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->timestamps();
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained()->cascadeOnDelete();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->timestamps();
        });

        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('year', 9);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->integer('periode')->nullable();
            $table->string('jenis', 100)->nullable();
            $table->string('name', 100);
            $table->date('start_date');
            $table->date('end_date');
            $table->date('registration_start');
            $table->date('registration_end');
            $table->integer('kuota')->default(2000);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('lecturers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nip', 20)->unique();
            $table->string('name', 100);
            $table->foreignId('faculty_id')->constrained()->cascadeOnDelete();
            $table->string('phone', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('nim', 20)->unique();
            $table->string('name', 100);
            $table->foreignId('faculty_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->year('batch_year');
            $table->integer('sks_completed')->default(0);
            $table->decimal('gpa', 3, 2)->default(0.00);
            $table->enum('gender', ['L', 'P']);
            $table->string('university', 100)->nullable();
            $table->string('birth_place', 100)->nullable();
            $table->date('birth_date')->nullable();
            $table->timestamps();
        });

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('profileable_type');
            $table->unsignedBigInteger('profileable_id');
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamps();
            $table->index(['profileable_type', 'profileable_id']);
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->integer('province_id')->nullable();
            $table->integer('regency_id')->nullable();
            $table->integer('district_id')->nullable();
            $table->string('village_code', 20)->nullable();
            $table->string('village_name', 100);
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('capacity')->default(0);
            $table->timestamps();
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lecturer_id')->nullable()->constrained('lecturers')->nullOnDelete();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->string('token', 10)->nullable()->unique();
            $table->integer('capacity')->default(10);
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->timestamps();
        });

        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['pending', 'document_submitted', 'approved', 'rejected', 'completed'])
                ->default('pending');
            $table->timestamp('registration_date')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('registration_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->enum('document_type', ['ktp', 'ktm', 'foto', 'cv', 'health_cert', 'other']);
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('file_size')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
        });

        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('title', 200);
            $table->text('activity');
            $table->text('output')->nullable();
            $table->enum('status', ['draft', 'submitted', 'approved', 'revision'])->default('draft');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('daily_report_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type', 50)->nullable();
            $table->integer('file_size')->nullable();
            $table->timestamps();
        });

        Schema::create('work_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->text('objectives')->nullable();
            $table->integer('target_participants')->nullable();
            $table->decimal('budget', 15, 2)->default(0);
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'completed'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('approval_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('work_program_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_program_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('version')->default(1);
            $table->timestamp('uploaded_at')->useCurrent();
        });

        Schema::create('final_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('abstract')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->enum('status', ['draft', 'submitted', 'reviewed', 'approved', 'revision'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_notes')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->enum('evaluator_type', ['dpl', 'peer', 'community']);
            $table->foreignId('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->string('grade', 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('evaluation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->string('criterion', 100);
            $table->decimal('score', 5, 2);
            $table->decimal('weight', 5, 2)->default(1.00);
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_items');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('final_reports');
        Schema::dropIfExists('work_program_proposals');
        Schema::dropIfExists('work_programs');
        Schema::dropIfExists('daily_report_files');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('registration_documents');
        Schema::dropIfExists('registrations');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('user_profiles');
        Schema::dropIfExists('students');
        Schema::dropIfExists('lecturers');
        Schema::dropIfExists('periods');
        Schema::dropIfExists('academic_years');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('faculties');
    }
};
