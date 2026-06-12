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
            if (! Schema::hasColumn('mahasiswa', 'nik')) {
                $table->string('nik', 32)->nullable()->after('nim');
            }

            if (! Schema::hasColumn('mahasiswa', 'mother_name')) {
                $table->string('mother_name', 150)->nullable()->after('nama');
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
                Schema::hasColumn('mahasiswa', 'nik') ? 'nik' : null,
                Schema::hasColumn('mahasiswa', 'mother_name') ? 'mother_name' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
