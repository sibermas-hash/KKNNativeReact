<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mahasiswa')
            || Schema::hasColumn('mahasiswa', 'parent_permission_path')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            $column = $table->string('parent_permission_path')->nullable();

            if (Schema::hasColumn('mahasiswa', 'health_certificate_path')) {
                $column->after('health_certificate_path');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('mahasiswa')
            || ! Schema::hasColumn('mahasiswa', 'parent_permission_path')) {
            return;
        }

        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->dropColumn('parent_permission_path');
        });
    }
};
