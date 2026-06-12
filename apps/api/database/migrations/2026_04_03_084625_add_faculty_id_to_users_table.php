<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'fakultas_id')) {
                $table->foreignId('fakultas_id')
                    ->nullable()
                    ->after('address')
                    ->constrained('fakultas')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'fakultas_id')) {
                $table->dropConstrainedForeignId('fakultas_id');
            }
        });
    }
};
