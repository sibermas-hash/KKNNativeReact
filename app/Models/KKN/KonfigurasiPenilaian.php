<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Enums\KknType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class KonfigurasiPenilaian extends Model
{
    protected $connection = 'kkn';

    protected $table = 'konfigurasi_penilaian';

    protected $fillable = [
        'kkn_type',
        'config_key',
        'label',
        'percentage',
        'group',
        'description',
    ];

    protected $casts = [
        'kkn_type' => KknType::class,
        'percentage' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::saved(fn (self $model) => Cache::forget('grading_configs_'.($model->kkn_type?->value ?? 'REGULER')));
        static::deleted(fn (self $model) => Cache::forget('grading_configs_'.($model->kkn_type?->value ?? 'REGULER')));
    }

    public const DEFAULT_COMPONENTS = [
        [
            'config_key' => 'weight_main_dpl',
            'label' => 'Bobot Nilai DPL',
            'percentage' => 40.00,
            'group' => 'main',
            'description' => 'Persentase total nilai dari Dosen Pembimbing Lapangan (DPL).',
        ],
        [
            'config_key' => 'weight_main_village',
            'label' => 'Bobot Nilai Mitra/Desa',
            'percentage' => 20.00,
            'group' => 'main',
            'description' => 'Persentase total nilai dari Kepala Desa atau mitra lapangan.',
        ],
        [
            'config_key' => 'weight_main_lppm',
            'label' => 'Bobot Nilai LPPM',
            'percentage' => 40.00,
            'group' => 'main',
            'description' => 'Persentase total nilai dari LPPM (Pembekalan & Administrasi).',
        ],
        // DPL Detail Weights
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
        // Village/Mitra Detail Weights
        [
            'config_key' => 'weight_village_attitude',
            'label' => 'Sikap & Interaksi (Mitra)',
            'percentage' => 50.00,
            'group' => 'village',
            'description' => 'Bobot penilaian sikap mahasiswa oleh mitra lapangan.',
        ],
        [
            'config_key' => 'weight_village_discipline',
            'label' => 'Kedisiplinan & Kinerja (Mitra)',
            'percentage' => 50.00,
            'group' => 'village',
            'description' => 'Bobot penilaian kedisiplinan mahasiswa oleh mitra lapangan.',
        ],
        // LPPM Detail Weights
        [
            'config_key' => 'weight_admin_workshop',
            'label' => 'Kehadiran Pembekalan',
            'percentage' => 0.00,
            'group' => 'lppm',
            'description' => 'Bobot kehadiran pembekalan dalam komponen penilaian LPPM (Dinonaktifkan).',
        ],
        [
            'config_key' => 'weight_admin_administration',
            'label' => 'Kelengkapan Administrasi',
            'percentage' => 100.00,
            'group' => 'lppm',
            'description' => 'Bobot kelengkapan administrasi dalam komponen penilaian LPPM.',
        ],
        // Additional configuration values used by operational scoring flows
        [
            'config_key' => 'workshop_attendance_score',
            'label' => 'Nilai Kehadiran Pembekalan',
            'percentage' => 100.00,
            'group' => 'extras',
            'description' => 'Nilai mentah yang diberikan ketika mahasiswa dinyatakan hadir pada pembekalan.',
        ],
    ];

    /**
     * Mengambil semua konfigurasi untuk tipe KKN tertentu.
     * Jika belum ada, akan mengambil default (Reguler).
     */
    public static function getForType(KknType $type): Collection
    {
        $configs = self::where('kkn_type', $type)->get();

        if ($configs->isEmpty() && $type !== KknType::REGULER) {
            return self::where('kkn_type', KknType::REGULER)->get();
        }

        return $configs;
    }

    /**
     * Memastikan semua jenis KKN memiliki set komponen penilaian awal.
     */
    public static function ensureDefaults(): void
    {
        foreach (KknType::cases() as $type) {
            foreach (self::DEFAULT_COMPONENTS as $component) {
                self::updateOrCreate(
                    [
                        'kkn_type' => $type,
                        'config_key' => $component['config_key'],
                    ],
                    $component
                );
            }
        }
    }
}
