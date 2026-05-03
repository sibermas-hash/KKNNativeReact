<?php

use App\Models\KKN\JenisKkn;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const JENIS_TO_CODE_MAP = [
        'REGULER' => 'REGULER',
        'NUSANTARA' => 'NUSANTARA',
        'INTERNASIONAL' => 'INTERNASIONAL',
        'TEMATIK' => 'TEMATIK',
        'RESPONSIF' => 'TEMATIK',
        'KOLABORASI_PTKIN' => 'KOLABORASI_PTKIN',
        'KAMPUNG_ZAKAT' => 'KAMPUNG_ZAKAT',
        'DESA_KATANA' => 'DESA_KATANA',
    ];

    private const PROGRAM_TYPE_TO_CODE_MAP = [
        'reguler' => 'REGULER',
        'nusantara' => 'NUSANTARA',
        'internasional_mandiri' => 'INTERNASIONAL',
        'kolaborasi_ptkin' => 'KOLABORASI_PTKIN',
        'tematik' => 'TEMATIK',
    ];

    public function up(): void
    {
        $existingJenisKkn = JenisKkn::pluck('id', 'code')->toArray();

        $kknTypes = [
            [
                'code' => 'REGULER',
                'name' => 'KKN Reguler',
                'description' => 'KKN wajib (Gasal/Genap, minimal 100 SKS, durasi 40 hari).',
                'registration_mode' => 'open',
                'placement_mode' => 'automatic_after_approval',
                'min_sks' => 100,
                'min_gpa' => 0.00,
                'color' => 'emerald',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'NUSANTARA',
                'name' => 'KKN Nusantara',
                'description' => 'KKN tingkat nasional berbasis Asta Protas Kemenag RI (Min 85 SKS, IPK 3.25).',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'min_sks' => 85,
                'min_gpa' => 3.25,
                'color' => 'blue',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'INTERNASIONAL',
                'name' => 'KKN Terpadu Internasional',
                'description' => 'KKN di wilayah Asia Tenggara dengan masa tinggal minimal 1 bulan (Min 100 SKS, IPK 3.25).',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'min_sks' => 100,
                'min_gpa' => 3.25,
                'color' => 'indigo',
                'is_active' => true,
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
                'color' => 'amber',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'code' => 'KOLABORASI_PTKIN',
                'name' => 'KKN Kolaborasi PTKIN',
                'description' => 'KKN hasil kolaborasi antar PTKIN se-Indonesia.',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'min_sks' => 100,
                'min_gpa' => 3.00,
                'color' => 'purple',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'code' => 'KAMPUNG_ZAKAT',
                'name' => 'KKN Kampung Zakat',
                'description' => 'KKN tematik khusus mahasiswa Prodi Mazawa untuk pemberdayaan berbasis zakat.',
                'registration_mode' => 'proposal_based',
                'placement_mode' => 'proposal_defined',
                'min_sks' => 100,
                'min_gpa' => 0.00,
                'color' => 'orange',
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'code' => 'DESA_KATANA',
                'name' => 'KKN Desa Katana',
                'description' => 'KKN tematik Desa Tanggap Bencana fokus pada mitigasi dan edukasi.',
                'registration_mode' => 'proposal_based',
                'placement_mode' => 'proposal_defined',
                'min_sks' => 100,
                'min_gpa' => 0.00,
                'color' => 'red',
                'is_active' => true,
                'sort_order' => 7,
            ],
        ];

        foreach ($kknTypes as $kknType) {
            if (! isset($existingJenisKkn[$kknType['code']])) {
                JenisKkn::firstOrCreate(
                    ['code' => $kknType['code']],
                    $kknType
                );
            }
        }

        $jenisKknMap = JenisKkn::pluck('id', 'code')->toArray();

        $periodes = DB::table('periode')
            ->whereNull('jenis_kkn_id')
            ->get();

        foreach ($periodes as $periode) {
            $jenisKknId = null;

            if ($periode->jenis && isset(self::JENIS_TO_CODE_MAP[$periode->jenis])) {
                $code = self::JENIS_TO_CODE_MAP[$periode->jenis];
                $jenisKknId = $jenisKknMap[$code] ?? null;
            }

            if (! $jenisKknId && $periode->program_type && isset(self::PROGRAM_TYPE_TO_CODE_MAP[$periode->program_type])) {
                $code = self::PROGRAM_TYPE_TO_CODE_MAP[$periode->program_type];
                $jenisKknId = $jenisKknMap[$code] ?? null;
            }

            if (! $jenisKknId) {
                $jenisKknId = $jenisKknMap['REGULER'];
            }

            if ($jenisKknId) {
                DB::table('periode')
                    ->where('id', $periode->id)
                    ->update(['jenis_kkn_id' => $jenisKknId]);
            }
        }
    }

    public function down(): void {}
};
