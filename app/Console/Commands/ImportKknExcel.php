<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Faculty;
use App\Models\Group;
use App\Models\Lecturer;
use App\Models\Location;
use App\Models\Period;
use App\Models\Program;
use App\Models\Registration;
use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportKknExcel extends Command
{
    protected $signature = 'kkn:import-excel {path} {--dry-run}';
    protected $description = 'Clear existing KKN data and import from Excel file';

    public function handle()
    {
        $path = $this->argument('path');

        if (!file_exists($path)) {
            $this->error("File not found: {$path}");
            return 1;
        }

        $this->info("Starting KKN data import...");

        if (!$this->option('dry-run')) {
            $this->clearData();
        } else {
            $this->info("Dry run: Skipping data clearing.");
        }

        try {
            $spreadsheet = IOFactory::load($path);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            
            // Remove header row
            $header = array_shift($rows);
            
            $this->info("Found " . count($rows) . " rows in Excel.");
            
            $bar = $this->output->createProgressBar(count($rows));
            $bar->start();

            $period = Period::where('is_active', true)->first();
            if (!$period) {
                $academicYear = AcademicYear::firstOrCreate(
                    ['year' => '2024/2025'],
                    ['is_active' => true]
                );

                $period = Period::create([
                    'academic_year_id' => $academicYear->id,
                    'name' => 'KKN Angkatan 57',
                    'start_date' => now(),
                    'end_date' => now()->addMonths(2),
                    'registration_start' => now()->subMonth(),
                    'registration_end' => now(),
                    'is_active' => true,
                ]);
                $this->warn("\nNo active period found. Created default: {$period->name}");
            }

            foreach ($rows as $row) {
                if (empty($row[6])) continue; // Skip if NIM is empty

                $kelompokCode = $row[1];
                $desa = $row[2];
                $kecamatan = $row[3];
                $kabupaten = $row[4];
                $nama = $row[5];
                $nim = $row[6];
                $gender = ($row[7] === 'P') ? 'P' : 'L';
                $phone = $row[8];
                $dplName = $row[9];
                $pt = $row[10] ?? 'UIN SAIZU';

                // 1. Faculty & Program (Defaults)
                $faculty = Faculty::firstOrCreate(['code' => 'FTIK'], ['name' => 'Fakultas Tarbiyah dan Ilmu Keguruan']);
                $program = Program::firstOrCreate(
                    ['code' => 'PBA'], 
                    ['name' => 'Pendidikan Bahasa Arab', 'faculty_id' => $faculty->id]
                );

                // 2. Location
                $location = Location::firstOrCreate(
                    ['village_name' => $desa],
                    [
                        'address' => "{$kecamatan}, {$kabupaten}",
                        'capacity' => 20
                    ]
                );

                // 3. Lecturer (DPL)
                $nip = substr('dpl_' . str_replace([' ', "'"], ['_', ''], strtolower($dplName)), 0, 20);
                $lecturerUser = User::firstOrCreate(
                    ['username' => $nip],
                    [
                        'name' => $dplName,
                        'email' => str_replace([' ', "'"], ['.', ''], strtolower($dplName)) . '@uinsaizu.ac.id',
                        'password' => Hash::make('password'),
                    ]
                );
                
                if (!$lecturerUser->hasRole('dpl')) {
                    $lecturerUser->assignRole('dpl');
                }

                $lecturer = Lecturer::firstOrCreate(
                    ['name' => $dplName],
                    [
                        'user_id' => $lecturerUser->id,
                        'nip' => $lecturerUser->username,
                        'faculty_id' => $faculty->id,
                    ]
                );

                // 4. Group
                $group = Group::firstOrCreate(
                    ['code' => 'K' . $kelompokCode],
                    [
                        'period_id' => $period->id,
                        'location_id' => $location->id,
                        'lecturer_id' => $lecturer->id,
                        'name' => "Kelompok {$kelompokCode}",
                        'capacity' => 15,
                        'status' => 'active'
                    ]
                );

                // 5. User & Student
                $user = User::updateOrCreate(
                    ['username' => $nim],
                    [
                        'name' => $nama,
                        'email' => $nim . '@student.uinsaizu.ac.id',
                        'password' => Hash::make($nim),
                        'phone' => $phone,
                    ]
                );
                
                if (!$user->hasRole('student')) {
                    $user->assignRole('student');
                }

                $student = Student::updateOrCreate(
                    ['nim' => $nim],
                    [
                        'user_id' => $user->id,
                        'name' => $nama,
                        'faculty_id' => $faculty->id,
                        'program_id' => $program->id,
                        'gender' => $gender,
                        'batch_year' => 2022,
                    ]
                );

                // 6. Registration & Group Member
                Registration::updateOrCreate(
                    ['student_id' => $student->id, 'period_id' => $period->id],
                    [
                        'group_id' => $group->id,
                        'status' => 'approved',
                        'registration_date' => now(),
                    ]
                );

                DB::table('group_members')->updateOrInsert(
                    ['group_id' => $group->id, 'student_id' => $student->id],
                    ['joined_at' => now()]
                );

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Import completed successfully.");

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }

        return 0;
    }

    protected function clearData()
    {
        $this->warn("Clearing existing data...");

        // Disable foreign key checks
        DB::statement('SET CONSTRAINTS ALL DEFERRED'); 

        // Tables to truncate
        $tables = [
            'evaluations',
            'evaluation_items',
            'kkn_scores',
            'final_reports',
            'work_programs',
            'daily_reports',
            'daily_report_files',
            'proposals',
            'registration_documents',
            'registrations',
            'group_members',
            'groups',
            'locations',
            'students',
            'lecturers',
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        // Delete users except superadmin
        User::where('email', '!=', 'superadmin@uinsaizu.ac.id')->delete();

        $this->info("Database cleared.");
    }
}
