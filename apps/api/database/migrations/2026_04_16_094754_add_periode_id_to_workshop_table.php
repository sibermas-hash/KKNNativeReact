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
        Schema::table('workshop', function (Blueprint $table) {
            if (! Schema::hasColumn('workshop', 'periode_id')) {
                $table->foreignId('periode_id')->nullable()->after('id')->constrained('periode')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workshop', function (Blueprint $table) {
            $table->dropForeign(['periode_id']);
            $table->dropColumn('periode_id');
        });
    }
};
