<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            if (! Schema::hasColumn('lokasi', 'is_selected_for_kkn')) {
                $table->boolean('is_selected_for_kkn')->default(false)->after('capacity');
                $table->index('is_selected_for_kkn');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lokasi', function (Blueprint $table) {
            if (Schema::hasColumn('lokasi', 'is_selected_for_kkn')) {
                $table->dropIndex(['is_selected_for_kkn']);
                $table->dropColumn('is_selected_for_kkn');
            }
        });
    }
};
