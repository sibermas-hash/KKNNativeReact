<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KonfigurasiSertifikatSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'config_key' => 'cert_title',
                'label' => 'Judul Sertifikat',
                'value' => 'SERTIFIKAT PENGHARGAAN',
                'type' => 'text',
            ],
            [
                'config_key' => 'cert_body',
                'label' => 'Isi Sertifikat',
                'value' => 'Diberikan kepada [StudentName] (NIM: [NIM]) atas partisipasi dan keberhasilannya dalam melaksanakan Kuliah Kerja Nyata (KKN) di [LOKASI] pada [PERIODE] dengan hasil sangat memuaskan.',
                'type' => 'longtext',
            ],
            [
                'config_key' => 'cert_signer_left_name',
                'label' => 'Nama Penandatangan Kiri',
                'value' => 'Prof. Dr. H. Roqib, M.Ag.',
                'type' => 'text',
            ],
            [
                'config_key' => 'cert_signer_left_title',
                'label' => 'Jabatan Penandatangan Kiri',
                'value' => 'Rektor UIN Saizu Purwokerto',
                'type' => 'text',
            ],
            [
                'config_key' => 'cert_signer_right_name',
                'label' => 'Nama Penandatangan Kanan',
                'value' => 'Dr. H. Ansori, M.Ag.',
                'type' => 'text',
            ],
            [
                'config_key' => 'cert_signer_right_title',
                'label' => 'Jabatan Penandatangan Kanan',
                'value' => 'Ketua LPPM',
                'type' => 'text',
            ],
            [
                'config_key' => 'cert_background',
                'label' => 'Background Sertifikat',
                'value' => null,
                'type' => 'image',
            ],
        ];

        foreach ($configs as $config) {
            DB::connection('kkn')->table('konfigurasi_sertifikat')->updateOrInsert(
                ['config_key' => $config['config_key']],
                $config
            );
        }
    }
}
