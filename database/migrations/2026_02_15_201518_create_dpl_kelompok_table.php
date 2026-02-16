<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dpl_kelompok', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kelompok_kkn_id')->constrained('kelompok_kkn')->cascadeOnDelete();
            $table->foreignId('dosen_id')->constrained('dosen')->cascadeOnDelete();
            $table->string('role')->default('Anggota'); // Ketua, Anggota (Ketua = Admin)
            $table->timestamps();

            $table->unique(['kelompok_kkn_id', 'dosen_id']);
        });

        // MIGRATE EXISTING DATA: Move data from kelompok_kkn.dpl_id to new pivot table
        $groups = DB::table('kelompok_kkn')->whereNotNull('dpl_id')->get();
        foreach ($groups as $group) {
            DB::table('dpl_kelompok')->insert([
                'kelompok_kkn_id' => $group->id,
                'dosen_id' => $group->dpl_id,
                'role' => 'Ketua', // Assume existing DPLs are the main ones (Admins)
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

    // Optional: Drop the old column later, but keep for now for backward compatibility
    // Schema::table('kelompok_kkn', function (Blueprint $table) {
    //     $table->dropForeign(['dpl_id']);
    //     $table->dropColumn('dpl_id');
    // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dpl_kelompok');
    }
};