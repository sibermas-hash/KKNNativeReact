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
        Schema::table('dokumen_peserta_kkn', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->after('status');
            $table->boolean('is_archived')->default(false)->after('is_verified');
            $table->timestamp('verified_at')->nullable()->after('is_archived');
            $table->timestamp('archived_at')->nullable()->after('verified_at');
            $table->integer('verified_by')->nullable()->unsigned()->after('archived_at');
            $table->integer('archived_by')->nullable()->unsigned()->after('verified_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dokumen_peserta_kkn', function (Blueprint $table) {
            $table->dropColumn([
                'is_verified',
                'is_archived',
                'verified_at',
                'archived_at',
                'verified_by',
                'archived_by',
            ]);
        });
    }
};
