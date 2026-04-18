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
        if (! Schema::connection('kkn')->hasTable('file_kegiatan_kkn')) {
            Schema::connection('kkn')->create('file_kegiatan_kkn', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kegiatan_kkn_id')->constrained('kegiatan_kkn')->cascadeOnDelete();
                $table->string('file_path');
                $table->string('file_name');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->dropIfExists('file_kegiatan_kkn');
    }
};
