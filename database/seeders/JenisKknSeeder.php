<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JenisKknSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'code' => 'REGULER',
                'name' => 'KKN Reguler',
                'description' => 'KKN wajib (Gasal/Genap, minimal 100 SKS, durasi 40 hari).',
                'registration_mode' => 'open',
                'placement_mode' => 'automatic_after_approval',
                'min_sks' => 100,
                'min_gpa' => 0.00,
                'color' => 'emerald',
                'sort_order' => 1,
            ],
            [
                'code' => 'NUSANTARA',
                'name' => 'KKN Nusantara',
                'description' => 'KKN tingkat nasional berbasis Asta Protas Kemenag RI (Min 85 SKS, IPK 3.25).',
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'min_sks' => 85,
                'min_gpa' => 3.25,
                'color' => 'blue',
                'sort_order' => 2,
            ],
            [
                'code' => 'INTERNASIONAL',
                'name' => 'KKN Terpadu Internasional Mandiri',
                'description' => 'KKN di wilayah Asia Tenggara dengan masa tinggal minimal 1 bulan (Min 100 SKS, IPK 3.25).',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'min_sks' => 100,
                'min_gpa' => 3.25,
                'color' => 'purple',
                'sort_order' => 3,
            ],
            [
                'code' => 'TEMATIK',
                'name' => 'KKN Tematik',
                'description' => 'KKN dengan tema khusus berdasarkan usulan dosen atau kebutuhan LPPM.',
                'registration_mode' => 'proposal_based',
                'placement_mode' => 'proposal_defined',
                'min_sks' => 100,
                'min_gpa' => 0.00,
                'color' => 'orange',
                'sort_order' => 4,
            ],
            [
                'code' => 'KOLABORASI_PTKIN',
                'name' => 'KKN Kolaborasi PTKIN',
                'description' => 'KKN hasil kolaborasi antar PTKIN se-Indonesia.',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'min_sks' => 100,
                'min_gpa' => 0.00,
                'color' => 'indigo',
                'sort_order' => 5,
            ],
        ];

        foreach ($types as $type) {
            DB::connection('kkn')->table('jenis_kkn')->updateOrInsert(
                ['code' => $type['code']],
                array_merge($type, [
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
