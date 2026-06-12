<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_leader_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelompok_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('voter_peserta_id')->constrained('peserta_kkn')->cascadeOnDelete();
            $table->foreignId('candidate_peserta_id')->constrained('peserta_kkn')->cascadeOnDelete();
            $table->timestamp('voted_at');
            $table->timestamps();

            $table->unique(['kelompok_id', 'voter_peserta_id'], 'uq_group_leader_vote_once');
            $table->index(['kelompok_id', 'candidate_peserta_id'], 'idx_group_leader_vote_candidate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_leader_votes');
    }
};
