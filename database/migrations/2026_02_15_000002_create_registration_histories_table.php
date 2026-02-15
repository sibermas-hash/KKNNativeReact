<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create registration_histories table for audit trail.
     * Tracks student transfers between KKN periods/groups.
     */
    public function up(): void
    {
        Schema::create('registration_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('peserta_kkn_id')->constrained('peserta_kkn')->onDelete('cascade');
            $table->foreignId('from_period_id')->nullable()->constrained('periode');
            $table->foreignId('to_period_id')->constrained('periode');
            $table->foreignId('from_group_id')->nullable()->constrained('kelompok_kkn');
            $table->foreignId('to_group_id')->nullable()->constrained('kelompok_kkn');
            $table->string('reason');
            $table->foreignId('processed_by')->constrained('users');
            $table->timestamp('processed_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_histories');
    }
};
