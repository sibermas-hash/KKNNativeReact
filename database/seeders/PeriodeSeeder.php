<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PeriodeSeeder extends Seeder
{
    public function run(): void
    {
        $periods = [
            [
                'name' => 'Periode 80 - KKN Reguler',
                'jenis_kkn_id' => 1,
                'academic_year_id' => 1,
                'registration_start' => '2026-04-21 00:00:00',
                'registration_end' => '2026-04-29 00:00:00',
                'start_date' => '2026-05-06 00:00:00',
                'end_date' => '2026-06-14 00:00:00',
                'kuota' => 500,
                'current_phase' => 'registration',
                'registration_mode' => 'open',
                'placement_mode' => 'automatic_after_approval',
                'program_type' => 'reguler',
                'is_active' => true,
                'periode' => 80,
            ],
            [
                'name' => 'Periode 81 - KKN Reguler',
                'jenis_kkn_id' => 1,
                'academic_year_id' => 1,
                'registration_start' => '2026-09-01 00:00:00',
                'registration_end' => '2026-09-15 00:00:00',
                'start_date' => '2026-10-01 00:00:00',
                'end_date' => '2026-11-09 00:00:00',
                'kuota' => 500,
                'current_phase' => 'upcoming',
                'registration_mode' => 'open',
                'placement_mode' => 'automatic_after_approval',
                'program_type' => 'reguler',
                'is_active' => true,
                'periode' => 81,
            ],
            [
                'name' => 'Periode 70 - KKN Nusantara',
                'jenis_kkn_id' => 2,
                'academic_year_id' => 1,
                'registration_start' => '2026-06-01 00:00:00',
                'registration_end' => '2026-06-20 00:00:00',
                'start_date' => '2026-07-15 00:00:00',
                'end_date' => '2026-08-30 00:00:00',
                'kuota' => 50,
                'current_phase' => 'upcoming',
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'program_type' => 'nusantara',
                'is_active' => true,
                'periode' => 70,
            ],
        ];

        foreach ($periods as $period) {
            DB::table('periode')->updateOrInsert(
                ['name' => $period['name']],
                array_merge($period, [
                    'academic_year_id' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}