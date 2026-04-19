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
        Schema::table('program_kerja', function (Blueprint $table) {
            if (! Schema::hasColumn('program_kerja', 'objectives')) {
                $table->text('objectives')->nullable();
            }
            if (! Schema::hasColumn('program_kerja', 'target_participants')) {
                $table->integer('target_participants')->default(0);
            }
            if (! Schema::hasColumn('program_kerja', 'budget')) {
                $table->decimal('budget', 15, 2)->default(0);
            }
            if (! Schema::hasColumn('program_kerja', 'status')) {
                $table->string('status', 20)->default('draft');
            }
            if (! Schema::hasColumn('program_kerja', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable();
            }
            if (! Schema::hasColumn('program_kerja', 'approved_at')) {
                $table->timestamp('approved_at')->nullable();
            }
            if (! Schema::hasColumn('program_kerja', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('program_kerja', 'approval_notes')) {
                $table->text('approval_notes')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('program_kerja', function (Blueprint $table) {
            $table->dropColumn(['objectives', 'target_participants', 'budget', 'status', 'submitted_at', 'approved_at', 'approved_by', 'approval_notes']);
        });
    }
};
