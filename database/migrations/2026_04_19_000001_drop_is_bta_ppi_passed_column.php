<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        if (Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
            Schema::table('mahasiswa', function ($table) {
                $table->dropColumn('is_bta_ppi_passed');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')) {
            return;
        }

        if (! Schema::hasColumn('mahasiswa', 'is_bta_ppi_passed')) {
            Schema::table('mahasiswa', function ($table) {
                $table->boolean('is_bta_ppi_passed')->default(false)->after('gpa');
            });
        }
    }
};