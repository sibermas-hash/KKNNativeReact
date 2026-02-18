<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('kkn')->table('prodi', function (Blueprint $table) {
            if (!Schema::connection('kkn')->hasColumn('prodi', 'master_id')) {
                $table->unsignedBigInteger('master_id')->nullable()->after('nama');
            }
            if (!Schema::connection('kkn')->hasColumn('prodi', 'master_synced_at')) {
                $table->timestamp('master_synced_at')->nullable()->after('master_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('prodi', function (Blueprint $table) {
            $table->dropColumn(['master_id', 'master_synced_at']);
        });
    }
};