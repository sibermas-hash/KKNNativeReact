<?php

namespace App\Console\Commands;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\ProgramKerja;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class GenerateDummyStudent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kkn:generate-dummy {--nim=9988776655 : NIM untuk mahasiswa dummy}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a complete dummy student profile with full KKN lifecycle data (work programs, logs, final reports, and grades).';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $nim = $this->option('nim');

        $this->info("Starting Dummy Student Generation for NIM: {$nim}");

        // 1. Get Active Period
        $periode = Periode::where('is_active', true)->first();
        if (! $periode) {
            // Let's create a dummy period if none exists
            $periode = Periode::create([
                'name' => 'Periode KKN Dummy 2026',
                'is_active' => true,
                'current_phase' => 'finished',
            ]);
            $this->warn('No active period found. Created a dummy period.');
        }

        // 2. Setup Master Data (Faculty & Program)
        $fakultas = Fakultas::first();
        if (! $fakultas) {
            $this->error('Fakultas master data is empty. Please seed master data first.');

            return;
        }
        $prodi = Prodi::where('fakultas_id', $fakultas->id)->first() ?? Prodi::first();
        if (! $prodi) {
            $this->error('Prodi master data is empty. Please seed master data first.');

            return;
        }

        // 3. Setup User & Mahasiswa
        $user = User::firstOrCreate(
            ['username' => $nim],
            [
                'name' => 'Budi Simulasi KKN',
                'email' => "{$nim}@students.uinsaizu.ac.id",
                'password' => Hash::make('password'),
                'is_active' => true,
                'phone' => '081234567890',
            ]
        );

        // Give role if using Spatie Permission
        if (method_exists($user, 'assignRole')) {
            $user->assignRole('student');
        }

        $mahasiswa = Mahasiswa::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nim' => $nim,
                'nik' => '330101'.rand(1000000000, 9999999999),
                'nama' => 'Budi Simulasi KKN',
                'gender' => 'L',
                'fakultas_id' => $fakultas->id,
                'prodi_id' => $prodi->id,
                'batch_year' => 2022,
                'sks_completed' => 120,
                'total_sks' => 144,
                'gpa' => 3.85,
                'is_bta_ppi_passed' => true,
                'status_bta_ppi' => 'Lulus',
                'semester' => 7,
                'shirt_size' => 'L',
            ]
        );

        // 4. Setup DPL, Location, and Group
        $dosenUser = User::firstOrCreate(
            ['username' => 'dpl_dummy'],
            [
                'name' => 'Dr. DPL Simulasi, M.Kom.',
                'email' => 'dpl_dummy@uinsaizu.ac.id',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );

        $dosen = Dosen::firstOrCreate(
            ['user_id' => $dosenUser->id],
            [
                'nip' => '198001012005011001',
                'nama' => 'Dr. DPL Simulasi, M.Kom.',
                'fakultas_id' => $fakultas->id,
                'gender' => 'L',
            ]
        );

        $lokasi = Lokasi::firstOrCreate(
            ['village_name' => 'Desa Simulasi Maju'],
            [
                'regency_name' => 'Kabupaten Fiktif',
                'district_name' => 'Kecamatan Coba',
                'address' => 'Jl. KKN No. 99',
                'capacity' => 15,
            ]
        );

        $kelompok = KelompokKkn::firstOrCreate(
            ['nama_kelompok' => 'Kelompok 99 - Simulasi'],
            [
                'periode_id' => $periode->id,
                'location_id' => $lokasi->id,
                'dpl_id' => $dosen->id,
                'status' => 'active',
                'capacity' => 15,
                'code' => 'KLP-99',
                'token' => 'TOKEN99',
            ]
        );

        // 5. Setup Registration & Plotting
        $peserta = PesertaKkn::updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'periode_id' => $periode->id],
            [
                'kelompok_id' => $kelompok->id,
                'status' => 'approved',
                'role' => 'member',
                'registration_date' => Carbon::now()->subMonths(2),
            ]
        );

        // 6. Setup Work Programs (Program Kerja)
        $this->info('Generating Work Programs...');
        $proker1 = ProgramKerja::firstOrCreate(
            ['title' => 'Edukasi Literasi Digital Desa'],
            [
                'kelompok_id' => $kelompok->id,
                'description' => 'Meningkatkan pemahaman masyarakat tentang penggunaan internet sehat.',
                'sdg_goals' => [4, 9], // Pendidikan Berkualitas, Inovasi
                'objectives' => 'Masyarakat paham bahaya hoaks',
                'target_participants' => 30,
                'status' => 'approved',
                'submitted_at' => Carbon::now()->subDays(45),
                'approved_at' => Carbon::now()->subDays(40),
            ]
        );

        $proker2 = ProgramKerja::firstOrCreate(
            ['title' => 'Penyuluhan Pencegahan Stunting'],
            [
                'kelompok_id' => $kelompok->id,
                'description' => 'Sosialisasi gizi buruk kepada ibu hamil dan menyusui.',
                'sdg_goals' => [3], // Kehidupan Sehat dan Sejahtera
                'objectives' => 'Menurunkan angka stunting di desa',
                'target_participants' => 25,
                'status' => 'approved',
                'submitted_at' => Carbon::now()->subDays(45),
                'approved_at' => Carbon::now()->subDays(40),
            ]
        );

        // 7. Setup Daily Logs (Logbook)
        $this->info('Generating 30 Days of Daily Logs...');
        $startDate = Carbon::now()->subDays(30);
        for ($i = 0; $i < 30; $i++) {
            $date = $startDate->copy()->addDays($i);

            KegiatanKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $mahasiswa->id,
                    'kelompok_id' => $kelompok->id,
                    'date' => $date->format('Y-m-d'),
                ],
                [
                    'title' => 'Kegiatan KKN Hari ke-'.($i + 1),
                    'activity' => 'Melaksanakan program kerja rutin dan observasi sosial di desa bersama aparat terkait.',
                    'reflection' => 'Berjalan lancar, masyarakat antusias.',
                    'output' => 'Tercapainya target harian sesuai jadwal.',
                    'status' => 'approved',
                    'reviewed_at' => $date->copy()->addDay(),
                ]
            );
        }

        // 8. Setup Final Report (Laporan Akhir)
        $this->info('Generating Final Report...');
        LaporanAkhir::updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'kelompok_id' => $kelompok->id],
            [
                'title' => 'Laporan Akhir Pengabdian di Desa Simulasi Maju',
                'abstract' => 'Laporan ini menguraikan seluruh pelaksanaan program kerja ABCD selama 30 hari.',
                'file_path' => 'dummy/reports/laporan-akhir.pdf',
                'file_name' => 'Laporan_Akhir_Budi.pdf',
                'status' => 'approved',
                'submitted_at' => Carbon::now()->subDays(2),
                'reviewed_at' => Carbon::now()->subDays(1),
                'score' => 90,
            ]
        );

        // 9. Setup Grading (NilaiKkn)
        $this->info('Generating Final Grades...');
        NilaiKkn::updateOrCreate(
            ['user_id' => $user->id, 'kelompok_id' => $kelompok->id],
            [
                'desa_interaksi_score' => 90,
                'desa_disiplin_score' => 88,
                'desa_kinerja_score' => 92,
                'dpl_relevansi_score' => 85,
                'dpl_ketercapaian_score' => 88,
                'dpl_inovasi_score' => 86,
                'dpl_administrasi_score' => 90,
                'dpl_artikel_score' => 85,
                'final_report_score' => 90,
                'total_score' => 88.5,
                'letter_grade' => 'A',
                'is_finalized' => true,
                'dpl_graded_at' => Carbon::now()->subDays(1),
                'village_graded_at' => Carbon::now()->subDays(2),
            ]
        );

        $this->info("\n✅ SUCCESS: Dummy student successfully generated!");
        $this->line('--------------------------------------------------');
        $this->line("Login Username : {$nim}");
        $this->line('Login Password : password');
        $this->line('Nama           : Budi Simulasi KKN');
        $this->line('Kelompok       : Kelompok 99 - Simulasi');
        $this->line('Lokasi         : Desa Simulasi Maju');
        $this->line('--------------------------------------------------');
    }
}
