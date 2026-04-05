<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::connection('kkn')->hasTable('mahasiswa')) {
            return;
        }

        Schema::connection('kkn')->table('mahasiswa', function (Blueprint $table) {
            if (! Schema::connection('kkn')->hasColumn('mahasiswa', 'nik')) {
                $table->string('nik', 32)->nullable()->after('nim');
            }

            if (! Schema::connection('kkn')->hasColumn('mahasiswa', 'mother_name')) {
                $table->string('mother_name', 150)->nullable()->after('nama');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::connection('kkn')->hasTable('mahasiswa')) {
            return;
        }

        Schema::connection('kkn')->table('mahasiswa', function (Blueprint $table) {
            $columnsToDrop = array_values(array_filter([
                Schema::connection('kkn')->hasColumn('mahasiswa', 'nik') ? 'nik' : null,
                Schema::connection('kkn')->hasColumn('mahasiswa', 'mother_name') ? 'mother_name' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
