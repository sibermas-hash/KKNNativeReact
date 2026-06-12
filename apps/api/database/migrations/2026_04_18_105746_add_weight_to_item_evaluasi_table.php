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
        Schema::table('item_evaluasi', function (Blueprint $table) {
            if (! Schema::hasColumn('item_evaluasi', 'weight')) {
                $table->integer('weight')->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_evaluasi', function (Blueprint $table) {
            $table->dropColumn('weight');
        });
    }
};
