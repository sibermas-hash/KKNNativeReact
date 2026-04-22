<?php

namespace Database\Seeders;

use App\Models\KKN\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Site Information
            [
                'config_key' => 'site_about',
                'label' => 'Tentang LPPM',
                'value' => 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Prof. K.H. Saifuddin Zuhri Purwokerto merupakan unit kerja yang mengoordinasikan kegiatan penelitian dan pengabdian masyarakat. Di bawah kepemimpinan Prof. Ansori, LPPM berkomitmen menjadi pusat unggulan riset yang inovatif dan transformatif.',
                'type' => 'textarea',
                'group' => 'general',
            ],
            [
                'config_key' => 'site_visi',
                'label' => 'Visi LPPM',
                'value' => 'Menjadi Lembaga Penelitian dan Pengabdian kepada Masyarakat yang unggul dan kompetitif dalam pengembangan ilmu pengetahuan, teknologi, dan seni yang berbasis pada nilai-nilai moderasi Islam dan kearifan lokal.',
                'type' => 'textarea',
                'group' => 'general',
            ],
            [
                'config_key' => 'site_misi',
                'label' => 'Misi LPPM',
                'value' => "1. Menyelenggarakan penelitian dan pengabdian kepada Masyarakat yang inovatif dalam pengembangan ilmu pengetahuan, teknologi, dan seni.\n2. Menyelenggarakan penelitian dan pengabdian kepada Masyarakat yang integratif berbasis nilai moderasi Islam, gender, lokalitas, dan keindonesiaan.\n3. Menyelenggarakan penelitian dan pengabdian kepada Masyarakat yang kolaboratif dengan berbagai lembaga Nasional dan Internasional.\n4. Meningkatkan publikasi ilmiah hasil penelitian dan pengabdian kepada Masyarakat pada tingkat Nasional dan Internasional.",
                'type' => 'textarea',
                'group' => 'general',
            ],
            
            // Contact Information
            [
                'config_key' => 'contact_address',
                'label' => 'Alamat Kantor',
                'value' => 'Gedung Rektorat Lantai 4, Jl. Jend. A. Yani No. 40, Purwokerto, Jawa Tengah 53126',
                'type' => 'text',
                'group' => 'contact',
            ],
            [
                'config_key' => 'contact_phone',
                'label' => 'Nomor Telepon',
                'value' => '(0281) 635624',
                'type' => 'text',
                'group' => 'contact',
            ],
            [
                'config_key' => 'contact_email',
                'label' => 'Email Resmi',
                'value' => 'lppm@uinsaizu.ac.id',
                'type' => 'text',
                'group' => 'contact',
            ],
            // Map Configuration
            [
                'config_key' => 'map_center_lat',
                'label' => 'Latitude Pusat Peta',
                'value' => '-7.4243',
                'type' => 'text',
                'group' => 'map',
            ],
            [
                'config_key' => 'map_center_lng',
                'label' => 'Longitude Pusat Peta',
                'value' => '109.2302',
                'type' => 'text',
                'group' => 'map',
            ],
            [
                'config_key' => 'map_default_zoom',
                'label' => 'Zoom Default Peta',
                'value' => '11',
                'type' => 'text',
                'group' => 'map',
            ],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['config_key' => $setting['config_key']],
                $setting
            );
        }
    }
}
