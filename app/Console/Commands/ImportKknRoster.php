<?php

namespace App\Console\Commands;

use App\Models\Group;
use App\Models\Lecturer;
use App\Models\Location;
use App\Models\Period;
use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Schema;

class ImportKknRoster extends Command
{
    protected $signature = 'kkn:import-roster 
        {file : Path to Excel file (Database Nilai KKN *.xlsx)}
        {--period= : Period ID (wajib diisi)}
        {--faculty= : Default faculty_id (fallback)}
        {--program= : Default program_id (fallback)}
        {--password= : Default password for new users (default: random 12 chars)}';

    protected $description = 'Import roster KKN (kelompok, lokasi, DPL, mahasiswa) dari Excel';

    public function handle(): int
    {
        $path = $this->argument('file');
        if (! file_exists($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getSheet(0); // first sheet
        $rows = $sheet->toArray(null, true, true, true);

        // Header mapping (hardcoded sesuai file)
        // NO | KELOMPOK | DESA | KECAMATAN | KABUPATEN | NAMA | NIM | L/P | No. Hp | DPL | PT
        $header = array_map('strtoupper', $rows[1] ?? []);
        if (! in_array('NIM', $header)) {
            $this->error('Header tidak sesuai, pastikan kolom NIM ada.');
            return self::FAILURE;
        }

        DB::beginTransaction();
        try {
            $roleStudent = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
            $roleDpl = Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);

            $periodId = $this->option('period');
            if (! $periodId) {
                throw new \RuntimeException('Opsi --period=ID wajib diisi.');
            }

            $defaultFaculty = (int) ($this->option('faculty') ?: 1);
            $defaultProgram = (int) ($this->option('program') ?: 1);
            $defaultPassword = $this->option('password') ?: Str::random(12);

            for ($i = 2; $i <= count($rows); $i++) {
                $row = $rows[$i];
                if (empty($row['G'])) {
                    continue; // skip tanpa NIM
                }

                $kelompok = trim((string) $row['B']);
                $desa = trim((string) $row['C']);
                $kec = trim((string) $row['D']);
                $kab = trim((string) $row['E']);
                $nama = trim((string) $row['F']);
                $nim = trim((string) $row['G']);
                $gender = strtoupper(trim((string) $row['H'])) === 'L' ? 'L' : 'P';
                $hp = trim((string) $row['I']);
                $dplName = trim((string) $row['J']);
                $pt = trim((string) $row['K']);

                // Location
                $location = Location::firstOrCreate(
                    ['village_name' => $desa, 'district_id' => null, 'regency_id' => null, 'province_id' => null],
                    ['address' => implode(', ', array_filter([$desa, $kec, $kab]))]
                );

                // Group
                $group = Group::firstOrCreate(
                    ['code' => 'G'.$kelompok],
                    [
                        'name' => 'Kelompok '.$kelompok,
                        'period_id' => $periodId,
                        'location_id' => $location->id,
                        'status' => 'draft',
                    ]
                );

                // DPL user+lecturer
                $dplUsername = strtolower(preg_replace('/\s+/', '', $dplName));
                $dplUser = User::updateOrCreate(
                    ['username' => $dplUsername],
                    [
                        'email' => strtolower(str_replace(' ', '.', $dplName)).'@dpl.local',
                        'name' => $dplName,
                        'password' => bcrypt($defaultPassword),
                        'is_active' => true,
                    ]
                );
                $dplUser->assignRole($roleDpl);

                $lecturer = Lecturer::updateOrCreate(
                    ['user_id' => $dplUser->id],
                    [
                        'nip' => 'DPL'.$dplUser->id,
                        'name' => $dplName,
                        'faculty_id' => $defaultFaculty,
                    ]
                );

                // attach dpl to group if empty
                if (! $group->lecturer_id) {
                    $group->lecturer_id = $lecturer->id;
                    $group->save();
                }

                // Student user+student
                $studentUser = User::updateOrCreate(
                    ['username' => $nim],
                    [
                        'email' => $nim.'@student.local',
                        'name' => $nama,
                        'password' => bcrypt($defaultPassword),
                        'is_active' => true,
                    ]
                );
                $studentUser->assignRole($roleStudent);

                $student = Student::updateOrCreate(
                    ['nim' => $nim],
                    [
                        'user_id' => $studentUser->id,
                        'name' => $nama,
                        'faculty_id' => $defaultFaculty,
                        'program_id' => $defaultProgram,
                        'batch_year' => 2026,
                        'gender' => $gender,
                        'university' => $pt,
                    ]
                );

                // Group membership (if table exists)
                if (Schema::hasTable('group_members')) {
                    DB::table('group_members')->updateOrInsert(
                        ['group_id' => $group->id, 'student_id' => $student->id],
                        ['role_in_group' => 'member', 'joined_at' => now()]
                    );
                }
            }

            DB::commit();
            $this->info('Import roster selesai. Password default: '.$defaultPassword);
            return self::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }
}
