<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_kkn_batches', function (Blueprint $table) {
            if (! Schema::hasColumn('external_kkn_batches', 'external_university_id')) {
                $table->foreignId('external_university_id')
                    ->nullable()
                    ->after('periode_id')
                    ->constrained('external_universities')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('external_kkn_batches', function (Blueprint $table) {
            if (Schema::hasColumn('external_kkn_batches', 'external_university_id')) {
                $table->dropConstrainedForeignId('external_university_id');
            }
        });
    }
};
