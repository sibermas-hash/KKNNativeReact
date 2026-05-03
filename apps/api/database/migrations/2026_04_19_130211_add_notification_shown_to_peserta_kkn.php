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
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->boolean('notification_shown')->default(true)->after('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropColumn('notification_shown');
        });
    }
};
