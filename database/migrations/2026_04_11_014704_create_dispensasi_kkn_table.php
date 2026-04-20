<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispensasi_kkn', function (Blueprint $table) {
            $table->id();
            $table->string('nim', 20)->index();
            $table->foreignId('periode_id')->nullable()->constrained('periode')->nullOnDelete();
            $table->string('alasan')->comment('Alasan diberikan dispensasi');
            $table->json('bypassed_requirements')->nullable()->comment('Syarat yang di-bypass: sks, gpa, bta_ppi, etc.');
            $table->foreignId('granted_by')->nullable()->comment('User ID admin yang memberikan dispensasi');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['nim', 'periode_id'], 'dispensasi_nim_period_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispensasi_kkn');
    }
};
