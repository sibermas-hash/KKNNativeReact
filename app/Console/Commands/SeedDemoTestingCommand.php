<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\KknType;
use App\Models\KKN\Announcement;
use App\Models\KKN\Dosen;
use App\Models\KKN\Download;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Evaluasi;
use App\Models\KKN\Fakultas;
use App\Models\KKN\ItemEvaluasi;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Laporan;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\LogAudit;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use App\Models\KKN\Prodi;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\SystemSetting;
use App\Models\KKN\TahunAkademik;
use App\Models\User;
use App\Services\GradingService;
use App\Services\WorkshopService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class SeedDemoTestingCommand extends Command
{
    protected $signature = 'kkn:seed-demo-testing';

    protected $description = 'Menyusun dataset demo komprehensif untuk pengujian seluruh role dan alur utama.';

    public function __construct(
        private readonly GradingService $gradingService,
        private readonly WorkshopService $workshopService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->components->info('Menyiapkan dataset demo testing KKN...');

        $this->ensureRoles();
        $this->ensureDemoFiles();
        $this->seedPublicContent();

        [$facultyA, $facultyB] = $this->seedFacultiesAndPrograms();
        [$activeYear, $archiveYear] = $this->seedAcademicYears();
        [$activePeriod, $archivePeriod] = $this->seedPeriods($activeYear, $archiveYear);
        [$locationA, $locationB, $locationArchive] = $this->seedLocations();

        $superadmin = $this->seedSuperadmin();
        $facultyAdmin = $this->seedFacultyAdmin($facultyA);

        $dplA = $this->seedDplUser(
            username: 'dpl',
            name: 'DPL Demo Utama',
            email: 'dpl.demo@local.test',
            nip: '198001012026040001',
            faculty: $facultyA['faculty'],
        );
        $dplB = $this->seedDplUser(
            username: 'demo_dpl_b',
            name: 'DPL Demo Fakultas B',
            email: 'dpl.demo.b@local.test',
            nip: '198001012026040002',
            faculty: $facultyB['faculty'],
        );

        $dplPeriodActiveA = $this->seedDplPeriod($dplA, $activePeriod);
        $dplPeriodActiveB = $this->seedDplPeriod($dplB, $activePeriod);
        $dplPeriodArchiveA = $this->seedDplPeriod($dplA, $archivePeriod);

        $groupA = $this->seedGroup(
            code: 'KKN-DEMO-AKTIF-A',
            name: 'Kelompok Demo Aktif A',
            period: $activePeriod,
            location: $locationA,
            dosen: $dplA,
            dplPeriod: $dplPeriodActiveA,
        );
        $groupB = $this->seedGroup(
            code: 'KKN-DEMO-AKTIF-B',
            name: 'Kelompok Demo Aktif B',
            period: $activePeriod,
            location: $locationB,
            dosen: $dplB,
            dplPeriod: $dplPeriodActiveB,
        );
        $archiveGroup = $this->seedGroup(
            code: 'KKN-DEMO-ARSIP-A',
            name: 'Kelompok Demo Arsip A',
            period: $archivePeriod,
            location: $locationArchive,
            dosen: $dplA,
            dplPeriod: $dplPeriodArchiveA,
            status: 'closed',
        );

        $leaderA = $this->seedStudent(
            username: 'demo_student_ketua',
            name: 'Mahasiswa Ketua Demo',
            email: 'student.ketua.demo@local.test',
            nim: '2026000101',
            faculty: $facultyA['faculty'],
            program: $facultyA['program'],
            gender: 'L',
        );
        $memberA = $this->seedStudent(
            username: 'student_dpl_demo',
            name: 'Mahasiswa Anggota Demo',
            email: 'student.dpl.demo@local.test',
            nim: '2026000001',
            faculty: $facultyA['faculty'],
            program: $facultyA['program'],
            gender: 'P',
        );
        $registrationStudent = $this->seedStudent(
            username: 'demo_student_reg',
            name: 'Mahasiswa Demo Registrasi',
            email: 'student.reg.demo@local.test',
            nim: '2026000102',
            faculty: $facultyA['faculty'],
            program: $facultyA['program'],
            gender: 'L',
        );
        $leaderB = $this->seedStudent(
            username: 'demo_student_b',
            name: 'Mahasiswa Demo Fakultas B',
            email: 'student.b.demo@local.test',
            nim: '2026000201',
            faculty: $facultyB['faculty'],
            program: $facultyB['program'],
            gender: 'L',
        );
        $archiveLeader = $this->seedStudent(
            username: 'demo_student_arsip',
            name: 'Mahasiswa Demo Arsip',
            email: 'student.arsip.demo@local.test',
            nim: '2025000101',
            faculty: $facultyA['faculty'],
            program: $facultyA['program'],
            gender: 'L',
            batchYear: 2022,
        );

        $this->seedParticipant($leaderA['student'], $activePeriod, $groupA, 'Ketua');
        $this->seedParticipant($memberA['student'], $activePeriod, $groupA, 'Anggota');
        $this->seedParticipant($leaderB['student'], $activePeriod, $groupB, 'Ketua');
        $this->seedParticipant($archiveLeader['student'], $archivePeriod, $archiveGroup, 'Ketua');

        $this->seedPosko($groupA, $leaderA['user']);
        $this->seedPosko($groupB, $leaderB['user'], -7.421210, 109.244110, 'posko-demo-b.png');

        $this->seedWorkPrograms($groupA, $superadmin);
        $this->seedWorkPrograms($groupB, $superadmin, 'submitted');

        $this->seedDailyReports($groupA, $leaderA['student'], $memberA['student'], $dplA['user']);
        $this->seedDailyReports($groupB, $leaderB['student'], null, $dplB['user']);

        $currentFinalReport = $this->seedFinalReport(
            student: $leaderA['student'],
            group: $groupA,
            status: 'submitted',
            title: 'Laporan Akhir Demo Kelompok A',
            filename: 'laporan-akhir-demo-a.pdf',
        );
        $archiveFinalReport = $this->seedFinalReport(
            student: $archiveLeader['student'],
            group: $archiveGroup,
            status: 'approved',
            title: 'Laporan Akhir Demo Arsip',
            filename: 'laporan-akhir-demo-arsip.pdf',
            reviewedBy: $dplA['user'],
        );

        $this->seedGeneralReports($leaderA['user'], $groupA);

        $this->seedAuditLogs($superadmin, $facultyAdmin, $dplA['user']);

        $this->outputSummary([
            'superadmin' => $superadmin,
            'faculty_admin' => $facultyAdmin,
            'dpl_primary' => $dplA['user'],
            'dpl_secondary' => $dplB['user'],
            'student_leader' => $leaderA['user'],
            'student_member' => $memberA['user'],
            'student_registration' => $registrationStudent['user'],
            'student_leader_b' => $leaderB['user'],
            'student_archive' => $archiveLeader['user'],
        ]);

        return self::SUCCESS;
    }

    private function ensureRoles(): void
    {
        foreach (['superadmin', 'faculty_admin', 'dpl', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    private function ensureDemoFiles(): void
    {
        Storage::disk('public')->put(
            'final-reports/laporan-akhir-demo-a.pdf',
            $this->demoPdf('Laporan Akhir Demo A')
        );
        Storage::disk('public')->put(
            'final-reports/laporan-akhir-demo-arsip.pdf',
            $this->demoPdf('Laporan Akhir Demo Arsip')
        );
        Storage::disk('public')->put(
            'downloads/panduan-operasional-kkn-demo.pdf',
            $this->demoPdf('Panduan Operasional KKN Demo')
        );
        Storage::disk('public')->put(
            'downloads/template-laporan-harian-demo.docx',
            'Dokumen contoh template laporan harian untuk pengujian repositori publik.'
        );
        Storage::disk('local')->put(
            'reports/demo/evaluation-report-demo.pdf',
            $this->demoPdf('Laporan Evaluasi Demo')
        );
        Storage::disk('local')->put(
            'reports/demo/photo-documentation-demo.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnXlMsAAAAASUVORK5CYII=')
        );
        Storage::disk('local')->put(
            'posko-photos/posko-demo-a.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnXlMsAAAAASUVORK5CYII=')
        );
        Storage::disk('local')->put(
            'posko-photos/posko-demo-b.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnXlMsAAAAASUVORK5CYII=')
        );
    }

    private function demoPdf(string $title): string
    {
        return <<<PDF
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 160] /Contents 4 0 R /Font << /F1 5 0 R >> >>
endobj
4 0 obj
<< /Length 80 >>
stream
BT
/F1 18 Tf
36 100 Td
({$title}) Tj
0 -24 Td
(Berkas contoh untuk pengujian sistem KKN.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
0000000352 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
422
%%EOF
PDF;
    }

    private function seedPublicContent(): void
    {
        SystemSetting::set('site_about', 'LPPM UIN Prof. K.H. Saifuddin Zuhri menghubungkan riset, pengabdian, dan kerja kolaboratif kampus agar hadir sebagai solusi nyata di tengah masyarakat.');
        SystemSetting::set('site_visi', 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat yang kolaboratif, terukur, dan berdampak.');
        SystemSetting::set('site_misi', 'Mengembangkan riset aplikatif, memperkuat kemitraan masyarakat, dan memastikan program pengabdian berjalan tertata.');
        SystemSetting::set('site_schemes_title', 'Skema KKN yang fleksibel dan kontekstual.');
        SystemSetting::set('site_schemes_intro', 'Pilihan skema ini disiapkan sebagai contoh isi halaman publik dan sekaligus bisa langsung dipakai sebagai draf awal konten resmi kampus.');
        SystemSetting::set('site_schemes_items', json_encode([
            [
                'title' => 'KKN Reguler',
                'description' => 'Skema umum untuk penempatan mahasiswa pada desa dampingan dengan fokus pemberdayaan berbasis kebutuhan lokal.',
                'color' => 'emerald',
            ],
            [
                'title' => 'KKN Tematik',
                'description' => 'Skema berbasis isu prioritas seperti literasi, stunting, ekonomi desa, atau transformasi digital masyarakat.',
                'color' => 'blue',
            ],
            [
                'title' => 'KKN Kolaboratif',
                'description' => 'Skema yang memungkinkan kerja lintas mitra, lintas disiplin, dan dukungan program institusi atau pemerintah daerah.',
                'color' => 'amber',
            ],
            [
                'title' => 'KKN Mandiri',
                'description' => 'Skema pengabdian yang memberi ruang bagi kelompok untuk membawa rancangan program spesifik dengan pengawalan sistematis.',
                'color' => 'slate',
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        Announcement::updateOrCreate(
            ['title' => 'Pembukaan Pendaftaran KKN Semester Ganjil 2026'],
            [
                'category' => 'PENDAFTARAN',
                'content' => 'Pendaftaran KKN resmi dibuka. Mahasiswa diminta melengkapi dokumen, memantau periode aktif, dan memilih kelompok sesuai jadwal yang ditetapkan.',
                'is_active' => true,
                'published_at' => now()->subDays(3),
            ]
        );

        Announcement::updateOrCreate(
            ['title' => 'Sosialisasi Teknis Kelompok dan Penugasan DPL'],
            [
                'category' => 'PENGUMUMAN',
                'content' => 'LPPM akan menyelenggarakan sosialisasi teknis mengenai pengelompokan mahasiswa, penugasan DPL, dan standar pelaporan selama masa KKN.',
                'is_active' => true,
                'published_at' => now()->subDays(6),
            ]
        );

        Announcement::updateOrCreate(
            ['title' => 'Rilis Pedoman Laporan Harian dan Laporan Akhir'],
            [
                'category' => 'PEDOMAN',
                'content' => 'Pedoman terbaru untuk pelaporan harian, laporan akhir, dan unggah dokumen pendukung telah tersedia untuk dijadikan acuan seluruh peserta.',
                'is_active' => true,
                'published_at' => now()->subDays(8),
            ]
        );

        Download::updateOrCreate(
            ['title' => 'Panduan Operasional KKN 2026'],
            [
                'file_name' => 'panduan-operasional-kkn-demo.pdf',
                'file_path' => Storage::url('public/downloads/panduan-operasional-kkn-demo.pdf'),
                'external_url' => null,
                'file_type' => 'pdf',
                'is_active' => true,
            ]
        );

        Download::updateOrCreate(
            ['title' => 'Template Laporan Harian Kelompok'],
            [
                'file_name' => 'template-laporan-harian-demo.docx',
                'file_path' => Storage::url('public/downloads/template-laporan-harian-demo.docx'),
                'external_url' => null,
                'file_type' => 'docx',
                'is_active' => true,
            ]
        );

        Download::updateOrCreate(
            ['title' => 'Akses Folder Repositori KKN'],
            [
                'file_name' => null,
                'file_path' => null,
                'external_url' => 'https://example.test/repositori-kkn-demo',
                'file_type' => null,
                'is_active' => true,
            ]
        );
    }

    private function seedFacultiesAndPrograms(): array
    {
        $facultyA = Fakultas::firstOrCreate(
            ['code' => 'FDEMOA'],
            ['nama' => 'Fakultas Demo A']
        );
        $programA = Prodi::firstOrCreate(
            ['code' => 'PDEMOA'],
            ['fakultas_id' => $facultyA->id, 'nama' => 'Program Demo A']
        );

        $facultyB = Fakultas::firstOrCreate(
            ['code' => 'FDEMOB'],
            ['nama' => 'Fakultas Demo B']
        );
        $programB = Prodi::firstOrCreate(
            ['code' => 'PDEMOB'],
            ['fakultas_id' => $facultyB->id, 'nama' => 'Program Demo B']
        );

        return [
            ['faculty' => $facultyA, 'program' => $programA],
            ['faculty' => $facultyB, 'program' => $programB],
        ];
    }

    private function seedAcademicYears(): array
    {
        $active = TahunAkademik::updateOrCreate(
            ['year' => '2026/2027'],
            ['is_active' => true]
        );
        $archive = TahunAkademik::updateOrCreate(
            ['year' => '2025/2026'],
            ['is_active' => false]
        );

        return [$active, $archive];
    }

    private function seedPeriods(TahunAkademik $activeYear, TahunAkademik $archiveYear): array
    {
        $active = Periode::updateOrCreate(
            ['name' => 'Periode Demo Aktif'],
            [
                'academic_year_id' => $activeYear->id,
                'periode' => 1,
                'jenis' => KknType::REGULER,
                'program_type' => Periode::PROGRAM_TYPE_REGULER,
                'angkatan' => '2026',
                'start_date' => now()->addWeeks(2)->toDateString(),
                'end_date' => now()->addWeeks(10)->toDateString(),
                'registration_start' => now()->subWeek()->toDateString(),
                'registration_end' => now()->addWeek()->toDateString(),
                'grading_start' => now()->subDays(3)->toDateString(),
                'grading_end' => now()->addWeeks(3)->toDateString(),
                'kuota' => 2000,
                'is_active' => true,
            ]
        );

        $archive = Periode::updateOrCreate(
            ['name' => 'Periode Demo Arsip'],
            [
                'academic_year_id' => $archiveYear->id,
                'periode' => 2,
                'jenis' => KknType::REGULER,
                'program_type' => Periode::PROGRAM_TYPE_REGULER,
                'angkatan' => '2025',
                'start_date' => now()->subMonths(8)->toDateString(),
                'end_date' => now()->subMonths(6)->toDateString(),
                'registration_start' => now()->subMonths(9)->toDateString(),
                'registration_end' => now()->subMonths(8)->toDateString(),
                'grading_start' => now()->subMonths(6)->toDateString(),
                'grading_end' => now()->subMonths(5)->toDateString(),
                'kuota' => 1800,
                'is_active' => false,
            ]
        );

        return [$active, $archive];
    }

    private function seedLocations(): array
    {
        $locationA = Lokasi::updateOrCreate(
            ['village_code' => '3374011001'],
            [
                'province_id' => '33',
                'regency_id' => '3374',
                'district_id' => '3374011',
                'regency_name' => 'Kabupaten Demo A',
                'district_name' => 'Kecamatan Demo A',
                'village_name' => 'Desa Demo A',
                'address' => 'Balai Desa Demo A',
                'capacity' => 12,
            ]
        );
        $locationB = Lokasi::updateOrCreate(
            ['village_code' => '3374011002'],
            [
                'province_id' => '33',
                'regency_id' => '3374',
                'district_id' => '3374012',
                'regency_name' => 'Kabupaten Demo B',
                'district_name' => 'Kecamatan Demo B',
                'village_name' => 'Desa Demo B',
                'address' => 'Balai Desa Demo B',
                'capacity' => 12,
            ]
        );
        $archive = Lokasi::updateOrCreate(
            ['village_code' => '3374011999'],
            [
                'province_id' => '33',
                'regency_id' => '3374',
                'district_id' => '3374099',
                'regency_name' => 'Kabupaten Demo Arsip',
                'district_name' => 'Kecamatan Demo Arsip',
                'village_name' => 'Desa Demo Arsip',
                'address' => 'Balai Desa Demo Arsip',
                'capacity' => 10,
            ]
        );

        return [$locationA, $locationB, $archive];
    }

    private function seedSuperadmin(): User
    {
        $user = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator Demo',
                'email' => 'admin.demo@local.test',
                'is_active' => true,
                'password' => Hash::make('Password#123'),
                'fakultas_id' => null,
            ]
        );

        $user->syncRoles(['superadmin']);

        return $user;
    }

    private function seedFacultyAdmin(array $facultyData): User
    {
        $user = User::updateOrCreate(
            ['username' => 'demo_faculty_admin'],
            [
                'name' => 'Admin Fakultas Demo',
                'email' => 'faculty.admin.demo@local.test',
                'is_active' => true,
                'password' => Hash::make('Password#123'),
                'fakultas_id' => $facultyData['faculty']->id,
            ]
        );

        $user->syncRoles(['faculty_admin']);

        return $user;
    }

    private function seedDplUser(
        string $username,
        string $name,
        string $email,
        string $nip,
        Fakultas $faculty,
    ): array {
        $user = User::updateOrCreate(
            ['username' => $username],
            [
                'name' => $name,
                'email' => $email,
                'is_active' => true,
                'password' => Hash::make('Password#123'),
                'fakultas_id' => $faculty->id,
            ]
        );
        $user->syncRoles(['dpl']);

        $dosen = Dosen::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nip' => $nip,
                'nama' => $name,
                'fakultas_id' => $faculty->id,
            ]
        );

        return ['user' => $user, 'dosen' => $dosen];
    }

    private function seedDplPeriod(array $dplData, Periode $period): DplPeriod
    {
        return DplPeriod::updateOrCreate(
            [
                'dosen_id' => $dplData['dosen']->id,
                'periode_id' => $period->id,
            ],
            [
                'max_groups' => 5,
                'is_active' => true,
            ]
        );
    }

    private function seedGroup(
        string $code,
        string $name,
        Periode $period,
        Lokasi $location,
        array $dosen,
        DplPeriod $dplPeriod,
        string $status = 'active',
    ): KelompokKkn {
        $group = KelompokKkn::updateOrCreate(
            ['code' => $code],
            [
                'periode_id' => $period->id,
                'location_id' => $location->id,
                'nama_kelompok' => $name,
                'token' => strtoupper(substr(md5($code), 0, 10)),
                'capacity' => 10,
                'status' => $status,
                'dpl_id' => $dosen['dosen']->id,
                'dpl_periode_id' => $dplPeriod->id,
            ]
        );

        $group->dosen()->syncWithoutDetaching([$dosen['dosen']->id => ['role' => 'Ketua']]);
        $group->dosen()->updateExistingPivot($dosen['dosen']->id, ['role' => 'Ketua']);
        $group->syncKetuaFlatColumns();

        return $group->fresh();
    }

    private function seedStudent(
        string $username,
        string $name,
        string $email,
        string $nim,
        Fakultas $faculty,
        Prodi $program,
        string $gender,
        int $batchYear = 2023,
    ): array {
        $user = User::updateOrCreate(
            ['username' => $username],
            [
                'name' => $name,
                'email' => $email,
                'is_active' => true,
                'password' => Hash::make('Password#123'),
                'fakultas_id' => $faculty->id,
            ]
        );
        $user->syncRoles(['student']);

        $student = Mahasiswa::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nim' => $nim,
                'nama' => $name,
                'fakultas_id' => $faculty->id,
                'prodi_id' => $program->id,
                'batch_year' => $batchYear,
                'sks_completed' => 130,
                'gpa' => 3.45,
                'is_bta_ppi_passed' => true,
                'health_certificate_path' => 'health-certificates/default.pdf',
                'parent_permission_path' => 'parent-permissions/default.pdf',
                'gender' => $gender,
                'birth_place' => 'Purwokerto',
                'birth_date' => '2003-01-15',
            ]
        );

        return ['user' => $user, 'student' => $student];
    }

    private function seedParticipant(
        Mahasiswa $student,
        Periode $period,
        KelompokKkn $group,
        string $role,
    ): PesertaKkn {
        return PesertaKkn::updateOrCreate(
            [
                'mahasiswa_id' => $student->id,
                'periode_id' => $period->id,
            ],
            [
                'kelompok_id' => $group->id,
                'status' => 'approved',
                'role' => $role,
                'notes' => 'Data demo untuk pengujian aplikasi.',
                'registration_date' => now(),
                'approved_at' => now(),
                'joined_group_at' => now(),
            ]
        );
    }

    private function seedPosko(
        KelompokKkn $group,
        User $uploadedBy,
        float $latitude = -7.424120,
        float $longitude = 109.239630,
        string $photoName = 'posko-demo-a.png',
    ): PoskoKelompok {
        return PoskoKelompok::updateOrCreate(
            ['kelompok_id' => $group->id],
            [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'gmaps_link' => "https://maps.google.com/?q={$latitude},{$longitude}",
                'photo_path' => "posko-photos/{$photoName}",
                'photo_name' => $photoName,
                'photo_size' => Storage::disk('local')->size("posko-photos/{$photoName}"),
                'uploaded_by' => $uploadedBy->id,
            ]
        );
    }

    private function seedWorkPrograms(KelompokKkn $group, User $approver, string $status = 'approved'): void
    {
        ProgramKerja::updateOrCreate(
            ['kelompok_id' => $group->id, 'title' => "Program Kerja {$group->code} 1"],
            [
                'description' => 'Program kerja contoh untuk pengujian monitoring kelompok.',
                'objectives' => 'Menguji alur pengajuan dan monitoring program kerja.',
                'target_participants' => 30,
                'budget' => 1500000,
                'status' => $status,
                'submitted_at' => now()->subDays(3),
                'approved_at' => $status === 'approved' ? now()->subDays(2) : null,
                'approved_by' => $status === 'approved' ? $approver->id : null,
                'approval_notes' => $status === 'approved' ? 'Program kerja demo disetujui.' : null,
            ]
        );

        ProgramKerja::updateOrCreate(
            ['kelompok_id' => $group->id, 'title' => "Program Kerja {$group->code} 2"],
            [
                'description' => 'Program kerja lanjutan untuk kebutuhan tampilan daftar.',
                'objectives' => 'Menambah variasi data pengujian.',
                'target_participants' => 20,
                'budget' => 750000,
                'status' => 'submitted',
                'submitted_at' => now()->subDay(),
                'approved_at' => null,
                'approved_by' => null,
                'approval_notes' => null,
            ]
        );
    }

    private function seedDailyReports(
        KelompokKkn $group,
        Mahasiswa $primaryStudent,
        ?Mahasiswa $secondaryStudent,
        User $reviewer,
    ): void {
        KegiatanKkn::updateOrCreate(
            [
                'mahasiswa_id' => $primaryStudent->id,
                'kelompok_id' => $group->id,
                'title' => "Laporan Harian Submitted {$group->code}",
            ],
            [
                'date' => today()->toDateString(),
                'activity' => 'Koordinasi awal dengan perangkat desa dan penyusunan agenda kerja.',
                'reflection' => 'Tim memahami target mingguan dan pembagian peran.',
                'output' => 'Draft agenda kerja minggu pertama.',
                'location_name' => $group->lokasi?->address,
                'status' => 'submitted',
            ]
        );

        if ($secondaryStudent) {
            KegiatanKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $secondaryStudent->id,
                    'kelompok_id' => $group->id,
                    'title' => "Laporan Harian Approved {$group->code}",
                ],
                [
                    'date' => today()->subDay()->toDateString(),
                    'activity' => 'Pendataan warga dan observasi kebutuhan prioritas.',
                    'reflection' => 'Data awal warga cukup membantu pemetaan program.',
                    'output' => 'Daftar kebutuhan prioritas warga.',
                    'location_name' => $group->lokasi?->address,
                    'status' => 'approved',
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now()->subHours(12),
                ]
            );
        }

        KegiatanKkn::updateOrCreate(
            [
                'mahasiswa_id' => $primaryStudent->id,
                'kelompok_id' => $group->id,
                'title' => "Laporan Harian Revision {$group->code}",
            ],
            [
                'date' => today()->subDays(2)->toDateString(),
                'activity' => 'Penyusunan draft program pendampingan UMKM.',
                'reflection' => 'Butuh data tambahan untuk memfinalkan target peserta.',
                'output' => 'Draft rancangan kegiatan UMKM.',
                'location_name' => $group->lokasi?->address,
                'status' => 'revision',
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now()->subDay(),
                'review_notes' => 'Lengkapi target peserta dan indikator keberhasilan.',
            ]
        );
    }

    private function seedFinalReport(
        Mahasiswa $student,
        KelompokKkn $group,
        string $status,
        string $title,
        string $filename,
        ?User $reviewedBy = null,
    ): LaporanAkhir {
        return LaporanAkhir::updateOrCreate(
            [
                'kelompok_id' => $group->id,
                'title' => $title,
            ],
            [
                'mahasiswa_id' => $student->id,
                'abstract' => 'Laporan akhir contoh untuk pengujian alur review DPL dan finalisasi nilai.',
                'file_path' => "final-reports/{$filename}",
                'file_name' => $filename,
                'status' => $status,
                'submitted_at' => now()->subHours(2),
                'reviewed_at' => $status === 'approved' ? now()->subHour() : null,
                'reviewed_by' => $status === 'approved' ? $reviewedBy?->id : null,
                'review_notes' => $status === 'approved' ? 'Laporan demo disetujui.' : null,
            ]
        );
    }

    private function seedGeneralReports(User $student, KelompokKkn $group): void
    {
        Laporan::updateOrCreate(
            [
                'user_id' => $student->id,
                'kelompok_id' => $group->id,
                'type' => 'evaluation_report',
            ],
            [
                'title' => 'Laporan Evaluasi Demo',
                'description' => 'Laporan evaluasi contoh untuk pusat laporan admin.',
                'file_path' => 'reports/demo/evaluation-report-demo.pdf',
                'file_name' => 'evaluation-report-demo.pdf',
                'mime_type' => 'application/pdf',
                'file_size' => Storage::disk('local')->size('reports/demo/evaluation-report-demo.pdf'),
                'status' => 'submitted',
                'submitted_at' => now()->subHours(4),
            ]
        );

        Laporan::updateOrCreate(
            [
                'user_id' => $student->id,
                'kelompok_id' => $group->id,
                'type' => 'photo_documentation',
            ],
            [
                'title' => 'Foto Dokumentasi Demo',
                'description' => 'Foto dokumentasi contoh untuk pengujian daftar laporan.',
                'file_path' => 'reports/demo/photo-documentation-demo.png',
                'file_name' => 'photo-documentation-demo.png',
                'mime_type' => 'image/png',
                'file_size' => Storage::disk('local')->size('reports/demo/photo-documentation-demo.png'),
                'status' => 'approved',
                'submitted_at' => now()->subDay(),
            ]
        );
    }

    private function seedDplEvaluation(
        array $student,
        KelompokKkn $group,
        User $evaluator,
        float $reportScore,
        float $executionScore,
        float $articleScore,
        float $disciplineScore,
        float $attitudeScore,
        float $workshopScore,
        float $administrationScore,
        bool $finalize,
    ): NilaiKkn {
        $evaluation = Evaluasi::updateOrCreate(
            [
                'mahasiswa_id' => $student['student']->id,
                'kelompok_id' => $group->id,
                'evaluator_type' => 'dpl',
                'evaluator_id' => $evaluator->id,
            ],
            [
                'total_score' => round(($reportScore + $executionScore + $articleScore) / 3, 2),
                'grade' => 'A',
                'notes' => 'Evaluasi demo untuk kebutuhan pengujian modul DPL.',
                'evaluated_at' => now(),
            ]
        );

        ItemEvaluasi::where('evaluasi_id', $evaluation->id)->delete();
        ItemEvaluasi::create([
            'evaluasi_id' => $evaluation->id,
            'criterion' => 'Kualitas Laporan',
            'score' => $reportScore,
            'weight' => 40,
            'notes' => 'Dokumen rapi dan konsisten.',
        ]);
        ItemEvaluasi::create([
            'evaluasi_id' => $evaluation->id,
            'criterion' => 'Pelaksanaan Program',
            'score' => $executionScore,
            'weight' => 35,
            'notes' => 'Pelaksanaan kegiatan berjalan baik.',
        ]);
        ItemEvaluasi::create([
            'evaluasi_id' => $evaluation->id,
            'criterion' => 'Artikel Publikasi',
            'score' => $articleScore,
            'weight' => 25,
            'notes' => 'Artikel informatif dan mudah dipahami.',
        ]);

        $this->gradingService->submitDPLScores(
            $student['user']->id,
            $group->id,
            [
                'relevansi' => $reportScore,
                'ketercapaian' => $executionScore,
                'inovasi' => $articleScore,
                'administrasi' => $reportScore, // mapped from report for demo
                'artikel' => $articleScore,
            ],
            $evaluator->id,
        );
        $this->gradingService->submitVillageHeadScores(
            $student['user']->id,
            $group->id,
            [
                'interaksi' => $attitudeScore,
                'disiplin' => $disciplineScore,
                'kinerja' => $attitudeScore, // mapped for demo
            ],
            $evaluator->id,
        );
        $this->gradingService->updateUnifiedScore(
            $student['user']->id,
            $group->id,
            [
                'administration_score' => $workshopScore,
            ],
            $evaluator->id,
        );

        $score = NilaiKkn::where('user_id', $student['user']->id)
            ->where('kelompok_id', $group->id)
            ->firstOrFail();

        if ($finalize) {
            $score->update(['is_finalized' => true]);
        }

        return $score->fresh();
    }

    private function seedAuditLogs(User $admin, User $facultyAdmin, User $dpl): void
    {
        LogAudit::updateOrCreate(
            ['action' => 'SEED_DEMO_TESTING', 'description' => 'Dataset demo testing diperbarui.'],
            [
                'user_id' => $admin->id,
                'model_type' => 'system',
                'model_id' => 1,
                'new_values' => ['status' => 'ok'],
                'severity' => 'info',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Codex Demo Seeder',
            ]
        );

        LogAudit::updateOrCreate(
            ['action' => 'FACULTY_ACCESS_CHECK', 'description' => 'Admin fakultas demo membuka rekap nilai.'],
            [
                'user_id' => $facultyAdmin->id,
                'model_type' => 'nilai_kkn',
                'model_id' => 1,
                'new_values' => ['faculty_admin' => true],
                'severity' => 'info',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Codex Demo Seeder',
            ]
        );

        LogAudit::updateOrCreate(
            ['action' => 'DPL_REVIEW_READY', 'description' => 'Data demo DPL siap untuk direview.'],
            [
                'user_id' => $dpl->id,
                'model_type' => 'kegiatan_kkn',
                'model_id' => 1,
                'new_values' => ['pending' => true],
                'severity' => 'info',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Codex Demo Seeder',
            ]
        );
    }

    private function outputSummary(array $users): void
    {
        $this->newLine();
        $this->components->info('Dataset demo testing siap digunakan.');

        $this->table(
            ['Akun', 'Username', 'Password'],
            [
                ['Superadmin', $users['superadmin']->username, 'Password#123'],
                ['Admin Fakultas', $users['faculty_admin']->username, 'Password#123'],
                ['DPL Utama', $users['dpl_primary']->username, 'Password#123'],
                ['DPL Kedua', $users['dpl_secondary']->username, 'Password#123'],
                ['Mahasiswa Ketua', $users['student_leader']->username, 'Password#123'],
                ['Mahasiswa Anggota', $users['student_member']->username, 'Password#123'],
                ['Mahasiswa Registrasi', $users['student_registration']->username, 'Password#123'],
                ['Mahasiswa Fakultas B', $users['student_leader_b']->username, 'Password#123'],
                ['Mahasiswa Arsip', $users['student_archive']->username, 'Password#123'],
            ]
        );
    }
}
