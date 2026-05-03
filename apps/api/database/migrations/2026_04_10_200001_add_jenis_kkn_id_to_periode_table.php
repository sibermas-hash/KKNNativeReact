<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $table->foreignId('jenis_kkn_id')->nullable()->after('id')->constrained('jenis_kkn')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $table->dropForeign(['jenis_kkn_id']);
            $table->dropColumn('jenis_kkn_id');
        });
    }
};
