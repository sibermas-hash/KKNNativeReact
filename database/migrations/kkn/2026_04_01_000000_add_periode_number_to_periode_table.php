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
        Schema::connection('kkn')->table('periode', function (Blueprint $table) {
            // Tambah kolom periode (angka periode KKN: 78, 79, 80, dst)
            $table->integer('periode')->nullable()->after('academic_year_id');

            // Ubah kolom angkatan menjadi jenis (KKN REGULER, KKN INTERNASIONAL, dll)
            $table->string('jenis', 100)->nullable()->change();

            // Tambah index untuk periode
            $table->index('periode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('periode', function (Blueprint $table) {
            $table->dropIndex(['periode']);
            $table->dropColumn('periode');
        });
    }
};
