<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the dpl_periode pivot table.
     * Allows a single Dosen (DPL) to be assigned to multiple KKN periode
     * with a configurable maximum number of kelompok_kkn per period.
     */
    public function up(): void
    {
        Schema::create('dpl_periode', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosen')->onDelete('cascade');
            $table->foreignId('periode_id')->constrained('periode')->onDelete('cascade');
            $table->integer('max_kelompok_kkn')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['dosen_id', 'periode_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dpl_periode');
    }
};
