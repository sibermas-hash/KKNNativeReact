<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dpl_kecamatan_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dpl_period_id')->constrained('dpl_periods')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('dosen')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('periode')->cascadeOnDelete();
            $table->string('district_id', 50);
            $table->string('district_name', 150);
            $table->string('regency_name', 150)->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['period_id', 'district_id']);
            $table->index(['dosen_id', 'period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpl_kecamatan_assignments');
    }
};
