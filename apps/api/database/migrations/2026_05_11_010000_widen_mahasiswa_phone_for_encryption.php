<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * R11 fix — widen mahasiswa.phone dari VARCHAR ke TEXT supaya
     * AES-256-GCM ciphertext (~200 chars) muat.
     *
     * Context: auditor R11 menemukan phone di fillable tapi TIDAK di $casts
     * encrypted, sementara User/Dosen/ProfilUser sudah encrypted. Inkonstisten.
     */
    public function up(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->text('phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->string('phone', 32)->nullable()->change();
        });
    }
};
