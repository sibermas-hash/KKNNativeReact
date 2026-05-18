<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kkn_statement_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mahasiswa_id')->constrained('mahasiswa')->cascadeOnDelete();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->foreignId('jenis_kkn_id')->nullable()->constrained('jenis_kkn')->nullOnDelete();
            $table->string('statement_version', 40)->default('2026-05-v1');
            $table->json('checklist');
            $table->string('signature_name');
            $table->string('signature_nim');
            $table->timestamp('agreed_at');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['mahasiswa_id', 'periode_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kkn_statement_agreements');
    }
};
