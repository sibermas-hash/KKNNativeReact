<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('kkn')->table('lokasi', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('lokasi', 'fakultas_id')) {
                $table->foreignId('fakultas_id')
                    ->nullable()
                    ->constrained('fakultas')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::connection('kkn')->table('lokasi', function (Blueprint $table) {
            if (Schema::connection('kkn')->hasColumn('lokasi', 'fakultas_id')) {
                $table->dropConstrainedForeignId('fakultas_id');
            }
        });
    }
};
