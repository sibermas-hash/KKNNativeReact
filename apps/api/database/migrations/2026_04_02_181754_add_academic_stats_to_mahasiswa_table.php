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
            if (! Schema::hasColumn('mahasiswa', 'sks_completed')) {
                $table->integer('sks_completed')->default(0)->after('prodi_id');
            }

            if (! Schema::hasColumn('mahasiswa', 'gpa')) {
                $table->decimal('gpa', 3, 2)->default(0.00)->after('sks_completed');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('mahasiswa', 'sks_completed')) {
                $columnsToDrop[] = 'sks_completed';
            }

            if (Schema::hasColumn('mahasiswa', 'gpa')) {
                $columnsToDrop[] = 'gpa';
            }

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
