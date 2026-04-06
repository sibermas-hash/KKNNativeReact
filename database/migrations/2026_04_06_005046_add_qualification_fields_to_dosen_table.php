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
        if (! Schema::connection('kkn')->hasTable('dosen')) {
            return;
        }

        Schema::connection('kkn')->table('dosen', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('dosen', 'is_cpns')) {
                $table->boolean('is_cpns')->default(false)->after('gender');
            }

            if (! Schema::connection('kkn')->hasColumn('dosen', 'is_tugas_belajar')) {
                $table->boolean('is_tugas_belajar')->default(false)->after('is_cpns');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::connection('kkn')->hasTable('dosen')) {
            return;
        }

        Schema::connection('kkn')->table('dosen', function (Blueprint $table) {
            $columnsToDrop = array_values(array_filter([
                Schema::connection('kkn')->hasColumn('dosen', 'is_cpns') ? 'is_cpns' : null,
                Schema::connection('kkn')->hasColumn('dosen', 'is_tugas_belajar') ? 'is_tugas_belajar' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
