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
        Schema::create('grading_configs', function (Blueprint $table) {
            $table->id();
            $table->string('config_key')->unique(); // e.g., weight_main_dpl
            $table->string('label'); // e.g., Bobot Nilai DPL
            $table->decimal('percentage', 5, 2); // e.g., 50.00
            $table->string('group')->index(); // main, dpl, village, admin
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grading_configs');
    }
};
