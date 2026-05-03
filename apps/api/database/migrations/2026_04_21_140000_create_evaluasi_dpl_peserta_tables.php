<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluasi_dpl_peserta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('dosen')->cascadeOnDelete();
            $table->decimal('total_score', 5, 2);
            $table->string('recommendation', 40);
            $table->text('notes')->nullable();
            $table->boolean('is_anonymous_to_dpl')->default(true);
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(
                ['periode_id', 'kelompok_id', 'mahasiswa_id', 'dosen_id'],
                'evaluasi_dpl_peserta_unique_submission'
            );
            $table->index(['dosen_id', 'periode_id']);
            $table->index(['recommendation', 'submitted_at']);
        });

        Schema::create('item_evaluasi_dpl_peserta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluasi_dpl_peserta_id')
                ->constrained('evaluasi_dpl_peserta')
                ->cascadeOnDelete();
            $table->string('criterion_key', 100);
            $table->string('criterion_label', 150);
            $table->unsignedTinyInteger('score');
            $table->unsignedTinyInteger('weight');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['criterion_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_evaluasi_dpl_peserta');
        Schema::dropIfExists('evaluasi_dpl_peserta');
    }
};
