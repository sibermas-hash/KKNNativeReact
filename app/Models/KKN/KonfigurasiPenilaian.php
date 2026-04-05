<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class KonfigurasiPenilaian extends Model
{
    protected $table = 'konfigurasi_penilaian';

    protected static function booted()
    {
        static::saved(fn() => Cache::forget('grading_configs'));
        static::deleted(fn() => Cache::forget('grading_configs'));
    }

    public const DEFAULT_CONFIGS = [
        [
            'config_key' => 'weight_main_dpl',
            'label' => 'Bobot Nilai DPL',
            'percentage' => 50.00,
            'group' => 'main',
            'description' => 'Persentase total nilai dari Dosen Pembimbing Lapangan (DPL).',
        ],
        [
            'config_key' => 'weight_main_village',
            'label' => 'Bobot Nilai Mitra/Desa',
            'percentage' => 30.00,
            'group' => 'main',
            'description' => 'Persentase total nilai dari Kepala Desa atau mitra lapangan.',
        ],
        [
            'config_key' => 'weight_main_lppm',
            'label' => 'Bobot Nilai LPPM',
            'percentage' => 20.00,
            'group' => 'main',
            'description' => 'Persentase total nilai dari LPPM, pembekalan, dan administrasi.',
        ],
        [
            'config_key' => 'weight_dpl_report',
            'label' => 'Laporan Akhir (DPL)',
            'percentage' => 30.00,
            'group' => 'dpl',
            'description' => 'Bobot laporan akhir pada komponen penilaian DPL.',
        ],
        [
            'config_key' => 'weight_dpl_execution',
            'label' => 'Pelaksanaan Program (DPL)',
            'percentage' => 40.00,
            'group' => 'dpl',
            'description' => 'Bobot pelaksanaan program kerja pada penilaian DPL.',
        ],
        [
            'config_key' => 'weight_dpl_article',
            'label' => 'Artikel Ilmiah (DPL)',
            'percentage' => 30.00,
            'group' => 'dpl',
            'description' => 'Bobot artikel ilmiah atau luaran akademik pada penilaian DPL.',
        ],
        [
            'config_key' => 'weight_village_attitude',
            'label' => 'Sikap / Sosial (Desa)',
            'percentage' => 50.00,
            'group' => 'village',
            'description' => 'Bobot penilaian sikap mahasiswa oleh desa atau mitra.',
        ],
        [
            'config_key' => 'weight_village_discipline',
            'label' => 'Kedisiplinan (Desa)',
            'percentage' => 50.00,
            'group' => 'village',
            'description' => 'Bobot penilaian kedisiplinan mahasiswa oleh desa atau mitra.',
        ],
        [
            'config_key' => 'weight_admin_workshop',
            'label' => 'Kehadiran Pembekalan',
            'percentage' => 50.00,
            'group' => 'lppm',
            'description' => 'Bobot kehadiran pembekalan dalam komponen penilaian LPPM.',
        ],
        [
            'config_key' => 'weight_admin_administration',
            'label' => 'Kelengkapan Administrasi',
            'percentage' => 50.00,
            'group' => 'lppm',
            'description' => 'Bobot kelengkapan administrasi dalam komponen penilaian LPPM.',
        ],
        [
            'config_key' => 'workshop_attendance_score',
            'label' => 'Nilai Kehadiran Pembekalan',
            'percentage' => 100.00,
            'group' => 'extras',
            'description' => 'Nilai default yang diberikan untuk kehadiran pembekalan.',
        ],
    ];

    protected $fillable = [
        'config_key',
        'label',
        'percentage',
        'group',
        'description'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
    ];

    public static function ensureDefaults(): void
    {
        foreach (self::DEFAULT_CONFIGS as $config) {
            self::updateOrCreate(
                ['config_key' => $config['config_key']],
                $config,
            );
        }
    }
}
