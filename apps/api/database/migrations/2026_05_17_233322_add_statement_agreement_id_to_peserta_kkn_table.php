<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->foreignId('statement_agreement_id')
                ->nullable()
                ->after('periode_id')
                ->constrained('kkn_statement_agreements')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table) {
            $table->dropConstrainedForeignId('statement_agreement_id');
        });
    }
};
