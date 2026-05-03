<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('peserta_kkn') || Schema::hasColumn('peserta_kkn', 'role')) {
            return;
        }

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->string('role')->default('Anggota')->after('status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('peserta_kkn') || ! Schema::hasColumn('peserta_kkn', 'role')) {
            return;
        }

        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
