<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('jenis_kkn', 'requires_interview')) {
                $table->boolean('requires_interview')->default(false)->after('placement_mode');
            }
        });

        DB::table('jenis_kkn')->whereIn('code', ['NUSANTARA', 'INTERNASIONAL'])->update(['requires_interview' => true]);
        DB::table('jenis_kkn')->whereIn('code', ['REGULER', 'TEMATIK', 'KOLABORASI_PTKIN'])->update(['requires_interview' => false]);
    }

    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            if (Schema::hasColumn('jenis_kkn', 'requires_interview')) {
                $table->dropColumn('requires_interview');
            }
        });
    }
};
