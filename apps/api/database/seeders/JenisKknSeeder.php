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
                // Audit REGULER-001 fix: min_gpa dari 0.00 → 2.00 (policy minimum kelulusan UIN SAIZU).
                // 0.00 artinya mahasiswa IPK 0 bisa daftar — ini bug, bukan design.
                'requirements_config' => json_encode(['min_sks' => 100, 'min_gpa' => 2.00, 'require_bta_ppi' => true]),
                // Audit REGULER-006/008 fix: attendance config eksplisit per jenis.
                // Reguler: posko fix di desa, radius 500m cukup untuk aktivitas harian.
                'attendance_config' => json_encode([
                    'geofence_enabled' => true,
                    'radius_meters' => 500,
                    'location_source' => 'posko',
                    'require_photo' => true,
                    'allow_offline_sync' => true,
                ]),
                'color' => 'emerald',
                'sort_order' => 1,
            ],
            [
                'code' => 'NUSANTARA',
                'name' => 'KKN Nusantara',
                'description' => 'KKN tingkat nasional berbasis Asta Protas Kemenag RI (Min 85 SKS, IPK 3.25).',
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'requirements_config' => json_encode([
                    'min_sks' => 85,
                    'min_gpa' => 3.25,
                    'require_bta_ppi' => true,
                    'require_not_married' => true,
                ]),
                // Nusantara: lintas daerah, radius lebih longgar, offline wajib
                // karena jaringan di daerah terpencil tidak stabil.
                'attendance_config' => json_encode([
                    'geofence_enabled' => true,
                    'radius_meters' => 1000,
                    'location_source' => 'posko',
                    'require_photo' => true,
                    'allow_offline_sync' => true,
                ]),
                'color' => 'blue',
                'sort_order' => 2,
            ],
            [
                'code' => 'INTERNASIONAL',
                'name' => 'KKN Terpadu Internasional Mandiri',
                'description' => 'KKN di wilayah Asia Tenggara dengan masa tinggal minimal 1 bulan (Min 100 SKS, IPK 3.25).',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'requirements_config' => json_encode([
                    'min_sks' => 100,
                    'min_gpa' => 3.25,
                    'require_bta_ppi' => true,
                    'require_not_married' => true,
                    'require_parent_permission' => true,
                ]),
                // Internasional: lokasi posko tidak terdefinisi (kadang hosting
                // family/university), radius lebih besar + geofence opsional
                // off kalau host tidak beri koordinat. Offline sync default off
                // karena di luar negeri biasanya jaringan baik.
                'attendance_config' => json_encode([
                    'geofence_enabled' => false,
                    'radius_meters' => 5000,
                    'location_source' => 'host',
                    'require_photo' => true,
                    'allow_offline_sync' => false,
                ]),
                'color' => 'purple',
                'sort_order' => 3,
            ],
            [
                'code' => 'TEMATIK',
                'name' => 'KKN Tematik',
                'description' => 'KKN dengan tema khusus berdasarkan usulan dosen atau kebutuhan LPPM.',
                'registration_mode' => 'proposal_based',
                'placement_mode' => 'proposal_defined',
                // Audit REGULER-001 fix: min_gpa 2.00 (sama dengan Reguler).
                'requirements_config' => json_encode(['min_sks' => 100, 'min_gpa' => 2.00, 'require_bta_ppi' => true]),
                // Tematik: area kerja bisa urban atau rural, radius menengah.
                'attendance_config' => json_encode([
                    'geofence_enabled' => true,
                    'radius_meters' => 1000,
                    'location_source' => 'posko',
                    'require_photo' => true,
                    'allow_offline_sync' => true,
                ]),
                'color' => 'orange',
                'sort_order' => 4,
            ],
            [
                'code' => 'KOLABORASI_PTKIN',
                'name' => 'KKN Kolaborasi PTKIN',
                'description' => 'KKN hasil kolaborasi antar PTKIN se-Indonesia.',
                'registration_mode' => 'selective',
                'placement_mode' => 'host_defined',
                'requirements_config' => json_encode(['min_sks' => 100, 'min_gpa' => 3.00, 'require_bta_ppi' => true]),
                // Kolaborasi PTKIN: mirip Nusantara dalam hal lintas daerah.
                'attendance_config' => json_encode([
                    'geofence_enabled' => true,
                    'radius_meters' => 1000,
                    'location_source' => 'posko',
                    'require_photo' => true,
                    'allow_offline_sync' => true,
                ]),
                'color' => 'indigo',
                'sort_order' => 5,
            ],
        ];

        foreach ($types as $type) {
            DB::table('jenis_kkn')->updateOrInsert(
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
