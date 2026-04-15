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
        // Workshops Table
        Schema::create('workshops', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('methodology')->nullable(); // e.g., "ABCD", "Participatory"
            $table->date('workshop_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->integer('max_participants')->nullable();
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamps();
        });

        // Workshop Participants Table
        Schema::create('workshop_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workshop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('registered_at')->useCurrent();
            $table->enum('attendance_status', ['registered', 'attended', 'absent', 'excused'])->default('registered');
            $table->timestamp('checked_in_at')->nullable();
            $table->boolean('certificate_generated')->default(false);
            $table->string('certificate_path')->nullable();
            $table->timestamp('certificate_issued_at')->nullable();
            $table->timestamps();
            $table->unique(['workshop_id', 'user_id']);
        });

        // KKN Scores Table (Tiered Grading)
        Schema::create('kkn_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');

            // DPL Scores (70% total weight usually)
            $table->decimal('execution_score', 5, 2)->nullable(); // 40%
            $table->decimal('article_score', 5, 2)->nullable();   // 30%

            // Village Head Scores (30% total weight usually)
            $table->decimal('discipline_score', 5, 2)->nullable(); // 15%
            $table->decimal('attitude_score', 5, 2)->nullable();   // 15%

            // Calculated Fields
            $table->decimal('dpl_weighted_score', 5, 2)->nullable();
            $table->decimal('village_weighted_score', 5, 2)->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->char('letter_grade', 2)->nullable();

            // Metadata
            $table->foreignId('dpl_graded_by')->nullable()->constrained('users');
            $table->foreignId('village_graded_by')->nullable()->constrained('users');
            $table->timestamp('dpl_graded_at')->nullable();
            $table->timestamp('village_graded_at')->nullable();

            $table->timestamps();
            $table->unique(['student_id', 'group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kkn_scores');
        Schema::dropIfExists('workshop_participants');
        Schema::dropIfExists('workshops');
    }
};
