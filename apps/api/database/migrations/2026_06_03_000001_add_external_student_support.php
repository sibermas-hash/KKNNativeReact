<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            if (! Schema::hasColumn('mahasiswa', 'origin_type')) {
                $table->string('origin_type', 20)->default('internal')->index();
            }
        });
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('kelompok_kkn', 'internal_capacity')) {
                $table->integer('internal_capacity')->nullable();
            }
            if (! Schema::hasColumn('kelompok_kkn', 'external_capacity')) {
                $table->integer('external_capacity')->nullable();
            }
        });
        if (! Schema::hasTable('external_kkn_batches')) {
            Schema::create('external_kkn_batches', function (Blueprint $table) {
                $table->id();
                $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
                $table->string('home_university', 150);
                $table->string('program_name', 150)->default('KKN Kolaborasi PTKIN');
                $table->string('letter_number', 120)->nullable();
                $table->date('letter_date')->nullable();
                $table->string('letter_file_path')->nullable();
                $table->integer('expected_participants')->nullable();
                $table->string('target_regency', 100)->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
        if (! Schema::hasTable('external_student_profiles')) {
            Schema::create('external_student_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mahasiswa_id')->unique()->constrained('mahasiswa')->cascadeOnDelete();
                $table->foreignId('batch_id')->constrained('external_kkn_batches')->cascadeOnDelete();
                $table->string('external_nim', 50);
                $table->string('home_university', 150);
                $table->string('external_faculty', 150)->nullable();
                $table->string('external_study_program', 150)->nullable();
                $table->integer('source_row_number')->nullable();
                $table->timestamps();
                $table->unique(['batch_id', 'external_nim']);
            });
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('external_student_profiles');
        Schema::dropIfExists('external_kkn_batches');
        Schema::table('kelompok_kkn', function (Blueprint $table) {
            if (Schema::hasColumn('kelompok_kkn', 'internal_capacity')) $table->dropColumn('internal_capacity');
            if (Schema::hasColumn('kelompok_kkn', 'external_capacity')) $table->dropColumn('external_capacity');
        });
        Schema::table('mahasiswa', function (Blueprint $table) {
            if (Schema::hasColumn('mahasiswa', 'origin_type')) $table->dropColumn('origin_type');
        });
    }
};
