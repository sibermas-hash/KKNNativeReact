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
        Schema::connection('kkn')->table('evaluasi', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('evaluasi', 'evaluator_id')) {
                $table->foreignId('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::connection('kkn')->hasColumn('evaluasi', 'evaluator_type')) {
                $table->string('evaluator_type', 20)->nullable(); // dpl, lppm
            }
            if (! Schema::connection('kkn')->hasColumn('evaluasi', 'notes')) {
                $table->text('notes')->nullable();
            }
            if (! Schema::connection('kkn')->hasColumn('evaluasi', 'grade')) {
                $table->string('grade', 5)->nullable();
            }
            if (! Schema::connection('kkn')->hasColumn('evaluasi', 'evaluated_at')) {
                $table->timestamp('evaluated_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('evaluasi', function (Blueprint $table) {
            $table->dropColumn(['evaluator_id', 'evaluator_type', 'notes', 'grade', 'evaluated_at']);
        });
    }
};
