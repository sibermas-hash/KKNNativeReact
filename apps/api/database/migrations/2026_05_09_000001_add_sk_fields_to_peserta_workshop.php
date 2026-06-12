<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peserta_workshop', function (Blueprint $table) {
            $table->string('jabatan_sk', 100)->nullable()->after('user_id')
                ->comment('Jabatan dalam SK: Peserta, Narasumber, Moderator, dll');
            $table->string('nomor_dokumen', 255)->nullable()->after('jabatan_sk')
                ->comment('Nomor SK/Surat Tugas terkait workshop');
        });
    }

    public function down(): void
    {
        Schema::table('peserta_workshop', function (Blueprint $table) {
            $table->dropColumn(['jabatan_sk', 'nomor_dokumen']);
        });
    }
};
