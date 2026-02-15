<?php

namespace Database\Seeders;

use App\Models\KKN\KonfigurasiPenilaian;
use Illuminate\Database\Seeder;

class KonfigurasiPenilaianSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            // Main Weights
            [
                'config_key' => 'weight_main_dpl',
                'label' => 'Bobot Komponen DPL (A)',
                'percentage' => 40.00,
                'group' => 'main',
                'description' => 'Kontribusi nilai dari Dosen Pembimbing Lapangan terhadap Nilai Akhir.'
            ],
            [
                'config_key' => 'weight_main_village',
                'label' => 'Bobot Komponen Mitra/Desa (B)',
                'percentage' => 40.00,
                'group' => 'main',
                'description' => 'Kontribusi nilai dari Kepala Desa/Mitra terhadap Nilai Akhir.'
            ],
            [
                'config_key' => 'weight_main_lppm',
                'label' => 'Bobot Komponen LPPM (C)',
                'percentage' => 20.00,
                'group' => 'main',
                'description' => 'Kontribusi nilai administratif dan workshop LPPM terhadap Nilai Akhir.'
            ],

            // DPL Sub-components
            [
                'config_key' => 'weight_dpl_report',
                'label' => 'Laporan Akhir (A1)',
                'percentage' => 30.00,
                'group' => 'dpl',
                'description' => 'Kualitas laporan akhir kelompok.'
            ],
            [
                'config_key' => 'weight_dpl_execution',
                'label' => 'Pelaksanaan Program (A2)',
                'percentage' => 40.00,
                'group' => 'dpl',
                'description' => 'Kesesuaian pelaksanaan program kerja di lapangan.'
            ],
            [
                'config_key' => 'weight_dpl_article',
                'label' => 'Artikel Ilmiah (A3)',
                'percentage' => 30.00,
                'group' => 'dpl',
                'description' => 'Kualitas artikel hasil kegiatan KKN.'
            ],

            // Village Sub-components
            [
                'config_key' => 'weight_village_attitude',
                'label' => 'Sikap & Perilaku (B1)',
                'percentage' => 50.00,
                'group' => 'village',
                'description' => 'Etika dan kesantunan mahasiswa selama di lokasi.'
            ],
            [
                'config_key' => 'weight_village_discipline',
                'label' => 'Kedisiplinan (B2)',
                'percentage' => 50.00,
                'group' => 'village',
                'description' => 'Kehadiran dan kepatuhan terhadap aturan desa.'
            ],

            // LPPM Sub-components
            [
                'config_key' => 'weight_admin_workshop',
                'label' => 'Pembekalan/Workshop (C1)',
                'percentage' => 50.00,
                'group' => 'lppm',
                'description' => 'Keaktifan dan hasil tes pembekalan.'
            ],
            [
                'config_key' => 'weight_admin_administration',
                'label' => 'Administrasi (C2)',
                'percentage' => 50.00,
                'group' => 'lppm',
                'description' => 'Kelengkapan dokumen pendaftaran dan pelaporan.'
            ],
        ];

        foreach ($configs as $config) {
            KonfigurasiPenilaian::updateOrCreate(
            ['config_key' => $config['config_key']],
                $config
            );
        }
    }
}