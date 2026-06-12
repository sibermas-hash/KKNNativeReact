<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Bug #7 Fix: Add verification_token column for O(1) certificate lookup.
     * Previously, verification required loading ALL finalized scores and iterating.
     * Now we can do direct indexed lookup.
     */
    public function up(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->string('verification_token', 64)
                ->nullable()
                ->after('evidence_file')
                ->comment('HMAC token for public certificate verification');

            $table->index('verification_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nilai_kkn', function (Blueprint $table) {
            $table->dropIndex(['verification_token']);
            $table->dropColumn('verification_token');
        });
    }
};
