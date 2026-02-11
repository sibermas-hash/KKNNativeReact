<?php

namespace Database\Seeders;

use App\Models\GradingConfig;
use Illuminate\Database\Seeder;

class GradingConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            // Main Groups (Weights)
            [
                'config_key' => 'weight_main_dpl',
                'label' => 'Bobot Nilai DPL',
                'percentage' => 50.00,
                'group' => 'main',
                'description' => 'Persentase total nilai dari Dosen Pembimbing Lapangan (DPL)'
            ],
            [
                'config_key' => 'weight_main_village',
                'label' => 'Bobot Nilai Mitra/Desa',
                'percentage' => 30.00,
                'group' => 'main',
                'description' => 'Persentase total nilai dari Kepala Desa/Mitra'
            ],
            [
                'config_key' => 'weight_main_lppm',
                'label' => 'Bobot Nilai LPPM',
                'percentage' => 20.00,
                'group' => 'main',
                'description' => 'Persentase total nilai dari LPPM (Workshop & Administrasi)'
            ],
            [
                'config_key' => 'workshop_attendance_score',
                'label' => 'Nilai Kehadiran Workshop',
                'percentage' => 100.00, // Assuming this is a direct score, not a weight component
                'group' => 'lppm', // Placing it under lppm group as it's related to workshop
                'description' => 'Nilai default untuk kehadiran workshop'
            ],

            // DPL Sub-weights
            [
                'config_key' => 'weight_dpl_report',
                'label' => 'Laporan Akhir (DPL)',
                'percentage' => 30.00,
                'group' => 'dpl',
                'description' => 'Bobot laporan akhir dalam penilaian DPL'
            ],
            [
                'config_key' => 'weight_dpl_execution',
                'label' => 'Pelaksanaan Program (DPL)',
                'percentage' => 40.00,
                'group' => 'dpl',
                'description' => 'Bobot pelaksanaan program dalam penilaian DPL'
            ],
            [
                'config_key' => 'weight_dpl_article',
                'label' => 'Artikel Kampelmas (DPL)',
                'percentage' => 30.00,
                'group' => 'dpl',
                'description' => 'Bobot artikel ilmiah kampelmas dalam penilaian DPL'
            ],

            // Village Sub-weights
            [
                'config_key' => 'weight_village_attitude',
                'label' => 'Sikap / Sosial (Desa)',
                'percentage' => 50.00,
                'group' => 'village',
                'description' => 'Bobot penilaian sikap oleh Kepala Desa'
            ],
            [
                'config_key' => 'weight_village_discipline',
                'label' => 'Kedisiplinan (Desa)',
                'percentage' => 50.00,
                'group' => 'village',
                'description' => 'Bobot penilaian kedisiplinan oleh Kepala Desa'
            ],

            // LPPM Sub-weights
            [
                'config_key' => 'weight_admin_workshop',
                'label' => 'Kehadiran Workshop',
                'percentage' => 50.00,
                'group' => 'lppm',
                'description' => 'Bobot kehadiran workshop dalam penilaian LPPM'
            ],
            [
                'config_key' => 'weight_admin_administration',
                'label' => 'Kelengkapan Administrasi',
                'percentage' => 50.00,
                'group' => 'lppm',
                'description' => 'Bobot kelengkapan berkas administrasi'
            ],
        ];

        foreach ($configs as $config) {
            GradingConfig::updateOrCreate(
                ['config_key' => $config['config_key']],
                $config
            );
        }
    }
}
