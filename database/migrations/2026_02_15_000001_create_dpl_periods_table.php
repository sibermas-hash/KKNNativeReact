<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the dpl_periods pivot table.
     * Allows a single Dosen (DPL) to be assigned to multiple KKN periods
     * with a configurable maximum number of groups per period.
     */
    public function up(): void
    {
        Schema::create('dpl_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')->constrained('dosen')->onDelete('cascade');
            $table->foreignId('period_id')->constrained('periode')->onDelete('cascade');
            $table->integer('max_groups')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['dosen_id', 'period_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dpl_periods');
    }
};
