<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix 1: Pascasarjana sudah ada (id=11) tapi migration sebelumnya
        // mencoba insert tanpa 'code' → NOT NULL violation.
        // Pastikan code terisi.
        DB::table('fakultas')
            ->where('master_id', 'Pasca')
            ->whereNull('code')
            ->orWhere('code', '')
            ->update(['code' => 'Pasca']);

        // Fix 2: Prodi yang masih pakai fakultas_id=1 (sudah dihapus) → pindah ke
        // fakultas default yang valid (id terkecil yang ada).
        $defaultFacultyId = DB::table('fakultas')->orderBy('id')->value('id');
        if ($defaultFacultyId) {
            DB::table('prodi')
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('fakultas')
                        ->whereColumn('fakultas.id', 'prodi.fakultas_id');
                })
                ->update(['fakultas_id' => $defaultFacultyId]);
        }

        // Fix 3: Users mahasiswa yang punya email duplikat → rename ke NIM@kkn.local
        // Temukan email yang dipakai lebih dari 1 user, lalu rename yang bukan dosen
        DB::statement("
            UPDATE users u
            SET email = u.username || '@kkn.local'
            WHERE u.id IN (
                SELECT u2.id
                FROM users u2
                INNER JOIN (
                    SELECT email FROM users
                    WHERE email NOT LIKE '%@kkn.local'
                    GROUP BY email HAVING COUNT(*) > 1
                ) dup ON u2.email = dup.email
                -- Pertahankan user pertama (id terkecil), rename sisanya
                WHERE u2.id != (
                    SELECT MIN(id) FROM users u3 WHERE u3.email = u2.email
                )
            )
        ");
    }

    public function down(): void {}
};
