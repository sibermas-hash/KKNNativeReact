<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('kkn')->table('lokasi', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('lokasi', 'faculty_id')) {
                $table->foreignId('faculty_id')
                    ->nullable()
                    ->constrained('fakultas')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::connection('kkn')->table('lokasi', function (Blueprint $table) {
            if (Schema::connection('kkn')->hasColumn('lokasi', 'faculty_id')) {
                $table->dropConstrainedForeignId('faculty_id');
            }
        });
    }
};
