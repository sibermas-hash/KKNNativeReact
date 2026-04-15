<?php

namespace Database\Seeders;

use App\Models\KKN\Fakultas as Faculty;
use App\Models\KKN\Periode as Period;
use App\Models\KKN\Prodi as Program;
use App\Models\KKN\TahunAkademik as AcademicYear;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $faculties = [
            [
                'code' => 'F01',
                'name' => 'Fakultas 1',
                'programs' => [
                    ['code' => 'P01', 'name' => 'Program 1'],
                    ['code' => 'P02', 'name' => 'Program 2'],
                ],
            ],
            [
                'code' => 'F02',
                'name' => 'Fakultas 2',
                'programs' => [
                    ['code' => 'P03', 'name' => 'Program 3'],
                    ['code' => 'P04', 'name' => 'Program 4'],
                ],
            ],
        ];

        foreach ($faculties as $facultyData) {
            $programs = $facultyData['programs'];
            unset($facultyData['programs']);

            $faculty = Faculty::firstOrCreate(
                ['code' => $facultyData['code']],
                ['nama' => $facultyData['name']]
            );

            foreach ($programs as $programData) {
                Program::firstOrCreate(
                    ['code' => $programData['code']],
                    [
                        'faculty_id' => $faculty->id,
                        'nama' => $programData['name'],
                    ]
                );
            }
        }

        $currentYear = Carbon::now()->year;
        $academicYear = AcademicYear::firstOrCreate(
            ['year' => $currentYear.'/'.($currentYear + 1)],
            ['is_active' => true]
        );

        Period::firstOrCreate(
            [
                'academic_year_id' => $academicYear->id,
                'name' => 'KKN Reguler',
            ],
            [
                'start_date' => Carbon::now()->addMonth()->toDateString(),
                'end_date' => Carbon::now()->addMonths(3)->toDateString(),
                'registration_start' => Carbon::now()->subWeeks(2)->toDateString(),
                'registration_end' => Carbon::now()->addWeeks(2)->toDateString(),
                'is_active' => true,
            ]
        );
    }
}
