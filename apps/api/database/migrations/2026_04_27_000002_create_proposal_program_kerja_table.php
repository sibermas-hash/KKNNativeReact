<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposal_program_kerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_kerja_id')->constrained('program_kerja')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('version')->default(1);
            $table->timestamp('uploaded_at')->useCurrent();

            $table->index('program_kerja_id', 'proposal_program_kerja_program_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_program_kerja');
    }
};
