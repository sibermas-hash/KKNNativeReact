<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KonfigurasiSertifikatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            [
                'config_key' => 'cert_title',
                'label' => 'Judul Sertifikat',
                'value' => 'SERTIFIKAT PENGHARGAAN',
                'type' => 'text'
            ],
            [
                'config_key' => 'cert_body',
                'label' => 'Isi Sertifikat',
                'value' => 'Diberikan kepada mahasiswa tersebut di bawah ini sebagai pengakuan atas dedikasi dan kontribusinya dalam pelaksanaan Kuliah Kerja Nyata (KKN) Semester Genap 2024/2025 yang dilaksanakan di [LOKASI] selama periode [PERIODE].',
                'type' => 'longtext'
            ],
            [
                'config_key' => 'cert_signer_left_name',
                'label' => 'Nama Penandatangan Kiri',
                'value' => 'Dr. H. Ahmad Fauzi, M.Pd.',
                'type' => 'text'
            ],
            [
                'config_key' => 'cert_signer_left_title',
                'label' => 'Jabatan Penandatangan Kiri',
                'value' => 'Ketua LPPM',
                'type' => 'text'
            ],
            [
                'config_key' => 'cert_signer_right_name',
                'label' => 'Nama Penandatangan Kanan',
                'value' => 'Prof. Dr. Ir. H. M. Zainal, M.T.',
                'type' => 'text'
            ],
            [
                'config_key' => 'cert_signer_right_title',
                'label' => 'Jabatan Penandatangan Kanan',
                'value' => 'Rektor',
                'type' => 'text'
            ],
            [
                'config_key' => 'cert_background',
                'label' => 'URL Background Sertifikat',
                'value' => '/images/cert-bg.png',
                'type' => 'image'
            ],
        ];

        foreach ($configs as $config) {
            \App\Models\KKN\KonfigurasiSertifikat::updateOrCreate(
            ['config_key' => $config['config_key']],
                $config
            );
        }
    }
}