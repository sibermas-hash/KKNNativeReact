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
        if (! Schema::connection('kkn')->hasTable('mahasiswa')) {
            return;
        }

        Schema::connection('kkn')->table('mahasiswa', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('mahasiswa', 'total_sks')) {
                $table->integer('total_sks')->default(0)->after('nim');
            }

            if (! Schema::connection('kkn')->hasColumn('mahasiswa', 'status_bta_ppi')) {
                $table->string('status_bta_ppi', 32)->default('BELUM_LULUS')->after('total_sks');
            }

            if (! Schema::connection('kkn')->hasColumn('mahasiswa', 'semester')) {
                $table->integer('semester')->nullable()->after('status_bta_ppi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::connection('kkn')->hasTable('mahasiswa')) {
            return;
        }

        Schema::connection('kkn')->table('mahasiswa', function (Blueprint $table) {
            $columnsToDrop = array_values(array_filter([
                Schema::connection('kkn')->hasColumn('mahasiswa', 'total_sks') ? 'total_sks' : null,
                Schema::connection('kkn')->hasColumn('mahasiswa', 'status_bta_ppi') ? 'status_bta_ppi' : null,
                Schema::connection('kkn')->hasColumn('mahasiswa', 'semester') ? 'semester' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
