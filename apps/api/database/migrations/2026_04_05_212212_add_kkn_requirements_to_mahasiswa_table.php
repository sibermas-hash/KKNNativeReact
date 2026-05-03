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
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            if (! Schema::hasColumn('mahasiswa', 'total_sks')) {
                $table->integer('total_sks')->default(0)->after('nim');
            }

            if (! Schema::hasColumn('mahasiswa', 'status_bta_ppi')) {
                $table->string('status_bta_ppi', 32)->default('BELUM_LULUS')->after('total_sks');
            }

            if (! Schema::hasColumn('mahasiswa', 'semester')) {
                $table->integer('semester')->nullable()->after('status_bta_ppi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            $columnsToDrop = array_values(array_filter([
                Schema::hasColumn('mahasiswa', 'total_sks') ? 'total_sks' : null,
                Schema::hasColumn('mahasiswa', 'status_bta_ppi') ? 'status_bta_ppi' : null,
                Schema::hasColumn('mahasiswa', 'semester') ? 'semester' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
