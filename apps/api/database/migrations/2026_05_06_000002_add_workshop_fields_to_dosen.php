<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dosen', function (Blueprint $table) {
            if (!Schema::hasColumn('dosen', 'has_workshop')) {
                $table->boolean('has_workshop')->default(false)->after('is_tugas_belajar');
            }
            if (!Schema::hasColumn('dosen', 'workshop_date')) {
                $table->date('workshop_date')->nullable()->after('has_workshop');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dosen', function (Blueprint $table) {
            $table->dropColumn(['has_workshop', 'workshop_date']);
        });
    }
};