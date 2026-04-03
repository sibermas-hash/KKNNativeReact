<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('periode')) {
            return;
        }

        if (! Schema::hasColumn('periode', 'periode')) {
            Schema::table('periode', function (Blueprint $table) {
                $table->integer('periode')->nullable()->after('academic_year_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('periode')) {
            return;
        }

        if (Schema::hasColumn('periode', 'periode')) {
            Schema::table('periode', function (Blueprint $table) {
                $table->dropColumn('periode');
            });
        }
    }
};
