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
        Schema::table('evaluasi', function (Blueprint $table) {
            if (! Schema::hasColumn('evaluasi', 'evaluator_id')) {
                $table->foreignId('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('evaluasi', 'evaluator_type')) {
                $table->string('evaluator_type', 20)->nullable(); // dpl, lppm
            }
            if (! Schema::hasColumn('evaluasi', 'notes')) {
                $table->text('notes')->nullable();
            }
            if (! Schema::hasColumn('evaluasi', 'grade')) {
                $table->string('grade', 5)->nullable();
            }
            if (! Schema::hasColumn('evaluasi', 'evaluated_at')) {
                $table->timestamp('evaluated_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evaluasi', function (Blueprint $table) {
            $table->dropColumn(['evaluator_id', 'evaluator_type', 'notes', 'grade', 'evaluated_at']);
        });
    }
};
