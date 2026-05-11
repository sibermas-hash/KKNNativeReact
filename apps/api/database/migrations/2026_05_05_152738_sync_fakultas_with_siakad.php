<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Pindahkan referensi dari duplikat ke ID yang benar sebelum hapus
        // id=2 (Dakwah) → id=3 (FDAK) — keduanya Fakultas Dakwah
        DB::table('mahasiswa')->where('fakultas_id', 2)->update(['fakultas_id' => 3]);
        DB::table('users')->where('fakultas_id', 2)->update(['fakultas_id' => 3]);
        DB::table('dosen')->where('fakultas_id', 2)->update(['fakultas_id' => 3]);
        DB::table('lokasi')->where('fakultas_id', 2)->update(['fakultas_id' => 3]);

        // id=9 (Syariah) → id=5 (FSYA) — keduanya Fakultas Syariah
        DB::table('mahasiswa')->where('fakultas_id', 9)->update(['fakultas_id' => 5]);
        DB::table('users')->where('fakultas_id', 9)->update(['fakultas_id' => 5]);
        DB::table('dosen')->where('fakultas_id', 9)->update(['fakultas_id' => 5]);
        DB::table('lokasi')->where('fakultas_id', 9)->update(['fakultas_id' => 5]);

        // id=1 (Default Faculty) — tidak ada referensi, hapus langsung
        DB::table('fakultas')->whereIn('id', [1, 2, 9])->delete();

        // 2. Tambah Pascasarjana yang ada di API tapi belum di DB
        DB::table('fakultas')->insertOrIgnore([
            'master_id' => 'Pasca',
            'code' => 'Pasca',
            'nama' => 'Pascasarjana',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Tidak bisa di-rollback karena data sudah di-merge
    }
};
