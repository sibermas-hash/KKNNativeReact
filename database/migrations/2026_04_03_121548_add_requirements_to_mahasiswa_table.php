<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            if (! Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
                $table->boolean('is_bta_ppi_passed')->default(false)->after('gpa');
            }

            if (! Schema::hasColumn('mahasiswa', 'health_certificate_path')) {
                $table->string('health_certificate_path')->nullable()->after('is_bta_ppi_passed');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            $columnsToDrop = array_values(array_filter([
                Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed') ? 'is_bta_ppi_passed' : null,
                Schema::hasColumn('mahasiswa', 'health_certificate_path') ? 'health_certificate_path' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
