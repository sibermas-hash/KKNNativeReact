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
        if (! Schema::hasTable('periode')) {
            return;
        }

        $columnsToAdd = [];

        if (! Schema::hasColumn('periode', 'angkatan')) {
            $columnsToAdd['angkatan'] = true;
        }

        if (! Schema::hasColumn('periode', 'jenis')) {
            $columnsToAdd['jenis'] = true;
        }

        if (! Schema::hasColumn('periode', 'kuota')) {
            $columnsToAdd['kuota'] = true;
        }

        if ($columnsToAdd === []) {
            return;
        }

        Schema::table('periode', function (Blueprint $table) use ($columnsToAdd) {
            if (isset($columnsToAdd['angkatan'])) {
                $table->integer('angkatan')->nullable()->after('academic_year_id');
            }

            if (isset($columnsToAdd['jenis'])) {
                $table->string('jenis', 100)->nullable()->after('angkatan');
            }

            if (isset($columnsToAdd['kuota'])) {
                $table->integer('kuota')->nullable()->after('end_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('periode')) {
            return;
        }

        $columnsToDrop = [];

        foreach (['angkatan', 'jenis', 'kuota'] as $column) {
            if (Schema::hasColumn('periode', $column)) {
                $columnsToDrop[] = $column;
            }
        }

        if ($columnsToDrop === []) {
            return;
        }

        Schema::table('periode', function (Blueprint $table) use ($columnsToDrop) {
            $table->dropColumn($columnsToDrop);
        });
    }
};
