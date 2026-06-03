<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collaboration_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_university_id')->constrained('external_universities')->cascadeOnDelete();
            $table->string('letter_number', 100)->nullable();
            $table->date('letter_date')->nullable();
            $table->string('subject', 200)->nullable();
            $table->string('sender_name', 150)->nullable();
            $table->string('sender_position', 150)->nullable();
            $table->string('file_path')->nullable();
            $table->string('status', 30)->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['external_university_id', 'status']);
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            if (! Schema::hasColumn('mahasiswa', 'origin_type')) {
                $table->string('origin_type', 20)->default('internal')->after('user_id');
                $table->foreignId('external_university_id')->nullable()->after('origin_type')->constrained('external_universities')->nullOnDelete();
                $table->string('external_nim', 100)->nullable()->after('external_university_id');
                $table->string('external_faculty_name', 150)->nullable()->after('external_nim');
                $table->string('external_prodi_name', 150)->nullable()->after('external_faculty_name');
                $table->index(['origin_type', 'external_university_id']);
                $table->unique(['external_university_id', 'external_nim'], 'unique_external_university_nim');
            }
        });

        Schema::table('peserta_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('peserta_kkn', 'entry_scheme')) {
                $table->string('entry_scheme', 30)->default('regular')->after('status');
                $table->foreignId('collaboration_letter_id')->nullable()->after('entry_scheme')->constrained('collaboration_letters')->nullOnDelete();
                $table->index('entry_scheme');
            }
        });
    }

    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            if (Schema::hasColumn('peserta_kkn', 'entry_scheme')) {
                $table->dropConstrainedForeignId('collaboration_letter_id');
                $table->dropColumn('entry_scheme');
            }
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            if (Schema::hasColumn('mahasiswa', 'origin_type')) {
                $table->dropUnique('unique_external_university_nim');
                $table->dropConstrainedForeignId('external_university_id');
                $table->dropColumn(['origin_type', 'external_nim', 'external_faculty_name', 'external_prodi_name']);
            }
        });

        Schema::dropIfExists('collaboration_letters');
    }
};
