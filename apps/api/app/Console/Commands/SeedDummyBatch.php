<?php

namespace App\Console\Commands;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
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

class SeedDummyBatch extends Command
{
    protected $signature = 'kkn:seed-dummy-batch';

    protected $description = 'Seed a batch of varied dummy students for comprehensive system testing.';

    private array $students = [
        [
            'nim' => '2201010001', 'nama' => 'Siti Aisyah Ramadhani', 'gender' => 'P',
            'role_kelompok' => 'ketua', 'logbook_days' => 30, 'status_reg' => 'approved',
            'has_final_report' => true, 'has_grade' => true, 'grade' => 'A', 'total' => 91.0,
        ],
        [
            'nim' => '2201010002', 'nama' => 'Ahmad Fauzan Hidayat', 'gender' => 'L',
            'role_kelompok' => 'member', 'logbook_days' => 30, 'status_reg' => 'approved',
            'has_final_report' => true, 'has_grade' => true, 'grade' => 'B+', 'total' => 78.5,
        ],
        [
            'nim' => '2201010003', 'nama' => 'Dewi Lestari Putri', 'gender' => 'P',
            'role_kelompok' => 'member', 'logbook_days' => 25, 'status_reg' => 'approved',
            'has_final_report' => true, 'has_grade' => false, 'grade' => null, 'total' => null,
        ],
        [
            'nim' => '2201010004', 'nama' => 'Muhammad Rizki Pratama', 'gender' => 'L',
            'role_kelompok' => 'member', 'logbook_days' => 15, 'status_reg' => 'approved',
            'has_final_report' => false, 'has_grade' => false, 'grade' => null, 'total' => null,
        ],
        [
            'nim' => '2201010005', 'nama' => 'Nur Fadilah Azzahra', 'gender' => 'P',
            'role_kelompok' => 'member', 'logbook_days' => 0, 'status_reg' => 'approved',
            'has_final_report' => false, 'has_grade' => false, 'grade' => null, 'total' => null,
        ],
        // Kelompok 2
        [
            'nim' => '2201020001', 'nama' => 'Rendi Saputra', 'gender' => 'L',
            'role_kelompok' => 'ketua', 'logbook_days' => 30, 'status_reg' => 'approved',
            'has_final_report' => true, 'has_grade' => true, 'grade' => 'A-', 'total' => 85.0,
            'kelompok' => 2,
        ],
        [
            'nim' => '2201020002', 'nama' => 'Indah Permata Sari', 'gender' => 'P',
            'role_kelompok' => 'member', 'logbook_days' => 28, 'status_reg' => 'approved',
            'has_final_report' => true, 'has_grade' => true, 'grade' => 'B+', 'total' => 80.0,
            'kelompok' => 2,
        ],
        [
            'nim' => '2201020003', 'nama' => 'Bayu Aji Wicaksono', 'gender' => 'L',
            'role_kelompok' => 'member', 'logbook_days' => 20, 'status_reg' => 'approved',
            'has_final_report' => false, 'has_grade' => false, 'grade' => null, 'total' => null,
            'kelompok' => 2,
        ],
        // Pending registration
        [
            'nim' => '2201030001', 'nama' => 'Laila Nur Kholifah', 'gender' => 'P',
            'role_kelompok' => 'member', 'logbook_days' => 0, 'status_reg' => 'pending',
            'has_final_report' => false, 'has_grade' => false, 'grade' => null, 'total' => null,
            'kelompok' => 0,
        ],
        [
            'nim' => '2201030002', 'nama' => 'Fikri Maulana', 'gender' => 'L',
            'role_kelompok' => 'member', 'logbook_days' => 0, 'status_reg' => 'rejected',
            'has_final_report' => false, 'has_grade' => false, 'grade' => null, 'total' => null,
            'kelompok' => 0,
        ],
    ];

    private array $activities = [
        'Melakukan sosialisasi program kerja kepada perangkat desa dan tokoh masyarakat.',
        'Mengajar mengaji anak-anak di Musholla Al-Ikhlas setelah Maghrib.',
        'Survei potensi desa bersama Kepala Dusun dan karang taruna.',
        'Gotong royong membersihkan balai desa dan lingkungan sekitar.',
        'Pelatihan pembuatan pupuk organik dari limbah dapur.',
        'Pendampingan UMKM desa dalam pembuatan label produk.',
        'Penyuluhan kesehatan ibu hamil bersama bidan desa.',
        'Mengajar bahasa Inggris dasar untuk siswa SD kelas 4-6.',
        'Dokumentasi potensi wisata desa untuk pembuatan profil desa digital.',
        'Pelatihan dasar komputer untuk karang taruna.',
        'Pendataan warga yang belum memiliki KTP elektronik.',
        'Sosialisasi pencegahan demam berdarah dan pembagian abate.',
        'Workshop pembuatan kerajinan tangan dari bahan daur ulang.',
        'Bimbingan belajar untuk anak-anak menjelang ujian semester.',
        'Senam sehat bersama ibu-ibu PKK di lapangan desa.',
        'Penanaman bibit pohon di sepanjang jalan desa.',
        'Pembuatan mural edukatif di dinding sekolah dasar.',
        'Sosialisasi pentingnya ASI eksklusif untuk ibu menyusui.',
        'Membantu administrasi surat-menyurat di kantor desa.',
        'Festival anak sholeh tingkat desa di masjid utama.',
        'Pendampingan posyandu balita dan lansia.',
        'Pembuatan video profil desa untuk media sosial.',
        'Pelatihan budidaya lele di kolam terpal untuk warga.',
        'Kerja bakti perbaikan jalan setapak menuju area persawahan.',
        'Sosialisasi bahaya narkoba untuk remaja desa.',
        'Pembuatan papan informasi publik di balai desa.',
        'Pendampingan kelompok tani dalam penggunaan aplikasi pertanian.',
        'Lomba kebersihan antar RT dalam rangka HUT RI.',
        'Pelatihan P3K dasar untuk pemuda karang taruna.',
        'Evaluasi dan penutupan program KKN bersama perangkat desa.',
    ];

    public function handle()
    {
        $this->info('🚀 Starting batch dummy student generation...');
        $this->newLine();

        // Prerequisites
        $periode = Periode::where('is_active', true)->first();
        if (! $periode) {
            $this->error('No active period found. Run kkn:generate-dummy first or create a period.');

            return;
        }

        $allFakultas = Fakultas::all();
        if ($allFakultas->isEmpty()) {
            $this->error('Fakultas master data is empty.');

            return;
        }

        // Setup two groups
        $groups = $this->setupGroups($periode, $allFakultas->first());

        $bar = $this->output->createProgressBar(count($this->students));
        $bar->start();

        foreach ($this->students as $data) {
            $this->createStudent($data, $periode, $allFakultas, $groups);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Summary table
        $rows = collect($this->students)->map(fn ($s) => [
            $s['nim'], $s['nama'], $s['status_reg'],
            $s['logbook_days'].' hari',
            $s['has_final_report'] ? '✅' : '❌',
            $s['grade'] ?? '-',
        ])->toArray();

        $this->table(
            ['NIM', 'Nama', 'Status', 'Logbook', 'Laporan', 'Nilai'],
            $rows
        );

        $this->info('Password untuk semua akun: password');
        $this->info('✅ Batch seeding completed!');
    }

    private function setupGroups(Periode $periode, Fakultas $fakultas): array
    {
        // Ensure periode has jenis_kkn_id and correct phase
        if (! $periode->jenis_kkn_id) {
            $periode->update(['jenis_kkn_id' => 1]);
        }
        $periode->update(['current_phase' => 'finished']);

        // DPL 1 (reuse existing or create)
        $dplUser1 = User::firstOrCreate(
            ['username' => 'dpl_dummy'],
            ['name' => 'Dr. DPL Simulasi, M.Kom.', 'email' => 'dpl_dummy@uinsaizu.ac.id', 'password' => Hash::make('password'), 'is_active' => true]
        );
        if (method_exists($dplUser1, 'assignRole')) {
            try {
                $dplUser1->assignRole('dosen');
            } catch (\Exception $e) {
            }
        }
        $dosen1 = Dosen::firstOrCreate(
            ['user_id' => $dplUser1->id],
            ['nip' => '198001012005011001', 'nama' => 'Dr. DPL Simulasi, M.Kom.', 'fakultas_id' => $fakultas->id, 'gender' => 'L']
        );

        // DPL 2
        $dplUser2 = User::firstOrCreate(
            ['username' => 'dpl_dummy2'],
            ['name' => 'Hj. Aminah, S.Pd., M.Pd.', 'email' => 'dpl_dummy2@uinsaizu.ac.id', 'password' => Hash::make('password'), 'is_active' => true]
        );
        if (method_exists($dplUser2, 'assignRole')) {
            try {
                $dplUser2->assignRole('dosen');
            } catch (\Exception $e) {
            }
        }
        $dosen2 = Dosen::firstOrCreate(
            ['user_id' => $dplUser2->id],
            ['nip' => '197505152003122002', 'nama' => 'Hj. Aminah, S.Pd., M.Pd.', 'fakultas_id' => $fakultas->id, 'gender' => 'P']
        );

        // DplPeriod (assignment DPL ke Periode)
        $dp1 = DplPeriod::firstOrCreate(
            ['dosen_id' => $dosen1->id, 'periode_id' => $periode->id],
            ['max_groups' => 5, 'is_active' => true]
        );
        $dp2 = DplPeriod::firstOrCreate(
            ['dosen_id' => $dosen2->id, 'periode_id' => $periode->id],
            ['max_groups' => 5, 'is_active' => true]
        );

        // Locations
        $lokasi1 = Lokasi::firstOrCreate(
            ['village_name' => 'Desa Simulasi Maju'],
            ['regency_name' => 'Kabupaten Fiktif', 'district_name' => 'Kecamatan Coba', 'address' => 'Jl. KKN No. 99', 'capacity' => 15]
        );
        $lokasi2 = Lokasi::firstOrCreate(
            ['village_name' => 'Desa Harapan Baru'],
            ['regency_name' => 'Kabupaten Fiktif', 'district_name' => 'Kecamatan Uji', 'address' => 'Jl. Merdeka No. 17', 'capacity' => 10]
        );

        // Groups with dpl_periode_id
        $kelompok1 = KelompokKkn::firstOrCreate(
            ['nama_kelompok' => 'Kelompok 99 - Simulasi'],
            ['periode_id' => $periode->id, 'location_id' => $lokasi1->id, 'dpl_id' => $dosen1->id, 'dpl_periode_id' => $dp1->id, 'status' => 'active', 'capacity' => 15, 'code' => 'KLP-99', 'token' => 'TOKEN99']
        );
        $kelompok1->update(['dpl_periode_id' => $dp1->id]); // Ensure it's always set

        $kelompok2 = KelompokKkn::firstOrCreate(
            ['nama_kelompok' => 'Kelompok 100 - Harapan'],
            ['periode_id' => $periode->id, 'location_id' => $lokasi2->id, 'dpl_id' => $dosen2->id, 'dpl_periode_id' => $dp2->id, 'status' => 'active', 'capacity' => 10, 'code' => 'KLP-100', 'token' => 'TOKEN100']
        );
        $kelompok2->update(['dpl_periode_id' => $dp2->id]); // Ensure it's always set

        // Work programs for group 1
        ProgramKerja::firstOrCreate(['title' => 'Edukasi Literasi Digital Desa'],
            ['kelompok_id' => $kelompok1->id, 'description' => 'Meningkatkan pemahaman masyarakat tentang penggunaan internet sehat.', 'sdg_goals' => [4, 9], 'objectives' => 'Masyarakat paham bahaya hoaks', 'target_participants' => 30, 'status' => 'approved', 'submitted_at' => now()->subDays(45), 'approved_at' => now()->subDays(40)]
        );
        ProgramKerja::firstOrCreate(['title' => 'Penyuluhan Pencegahan Stunting'],
            ['kelompok_id' => $kelompok1->id, 'description' => 'Sosialisasi gizi buruk kepada ibu hamil dan menyusui.', 'sdg_goals' => [3], 'objectives' => 'Menurunkan angka stunting di desa', 'target_participants' => 25, 'status' => 'approved', 'submitted_at' => now()->subDays(45), 'approved_at' => now()->subDays(40)]
        );

        // Work programs for group 2
        ProgramKerja::firstOrCreate(['title' => 'Pelatihan Budidaya Lele Terpal'],
            ['kelompok_id' => $kelompok2->id, 'description' => 'Melatih warga budidaya lele sebagai sumber protein dan penghasilan.', 'sdg_goals' => [1, 2], 'objectives' => 'Warga mampu budidaya lele mandiri', 'target_participants' => 20, 'status' => 'approved', 'submitted_at' => now()->subDays(45), 'approved_at' => now()->subDays(40)]
        );
        ProgramKerja::firstOrCreate(['title' => 'Pemberdayaan UMKM Kerajinan Lokal'],
            ['kelompok_id' => $kelompok2->id, 'description' => 'Pendampingan UMKM dalam pemasaran produk kerajinan lokal secara digital.', 'sdg_goals' => [8, 12], 'objectives' => 'UMKM memiliki toko online', 'target_participants' => 15, 'status' => 'approved', 'submitted_at' => now()->subDays(45), 'approved_at' => now()->subDays(40)]
        );

        return [1 => $kelompok1, 2 => $kelompok2];
    }

    private function createStudent(array $data, Periode $periode, $allFakultas, array $groups): void
    {
        $fakultas = $allFakultas->random();
        $prodi = Prodi::where('fakultas_id', $fakultas->id)->first() ?? Prodi::first();

        // User
        $user = User::firstOrCreate(
            ['username' => $data['nim']],
            [
                'name' => $data['nama'],
                'email' => $data['nim'].'@students.uinsaizu.ac.id',
                'password' => Hash::make('password'),
                'is_active' => true,
                'phone' => '0812'.rand(10000000, 99999999),
            ]
        );
        if (method_exists($user, 'assignRole')) {
            try {
                $user->assignRole('student');
            } catch (\Exception $e) {
            }
        }

        // Mahasiswa
        $mahasiswa = Mahasiswa::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nim' => $data['nim'],
                'nik' => '330101'.rand(1000000000, 9999999999),
                'nama' => $data['nama'],
                'gender' => $data['gender'],
                'fakultas_id' => $fakultas->id,
                'prodi_id' => $prodi->id,
                'batch_year' => 2022,
                'sks_completed' => rand(110, 130),
                'gpa' => round(rand(300, 395) / 100, 2),
                'status_bta_ppi' => 'LULUS',
                'semester' => 7,
                'shirt_size' => $data['gender'] === 'L' ? 'L' : 'M',
            ]
        );

        // Registration
        $kelompokNum = $data['kelompok'] ?? 1;
        $kelompokId = ($kelompokNum > 0 && isset($groups[$kelompokNum])) ? $groups[$kelompokNum]->id : null;

        PesertaKkn::updateOrCreate(
            ['mahasiswa_id' => $mahasiswa->id, 'periode_id' => $periode->id],
            [
                'kelompok_id' => $kelompokId,
                'status' => $data['status_reg'],
                'role' => $data['role_kelompok'],
                'registration_date' => now()->subMonths(2),
                'rejection_reason' => $data['status_reg'] === 'rejected' ? 'SKS belum mencukupi syarat minimal.' : null,
            ]
        );

        // Logbook
        if ($data['logbook_days'] > 0 && $kelompokId) {
            $startDate = Carbon::now()->subDays(30);
            for ($i = 0; $i < $data['logbook_days']; $i++) {
                $date = $startDate->copy()->addDays($i);
                $activityText = $this->activities[$i % count($this->activities)];

                KegiatanKkn::updateOrCreate(
                    ['mahasiswa_id' => $mahasiswa->id, 'kelompok_id' => $kelompokId, 'date' => $date->format('Y-m-d')],
                    [
                        'title' => 'Kegiatan Hari ke-'.($i + 1),
                        'activity' => $activityText,
                        'reflection' => 'Kegiatan berjalan lancar. Masyarakat menyambut dengan antusias.',
                        'output' => 'Target harian tercapai sesuai rencana.',
                        'status' => $i < $data['logbook_days'] - 2 ? 'approved' : 'submitted',
                        'reviewed_at' => $i < $data['logbook_days'] - 2 ? $date->copy()->addDay() : null,
                    ]
                );
            }
        }

        // Final report
        if ($data['has_final_report'] && $kelompokId) {
            LaporanAkhir::updateOrCreate(
                ['mahasiswa_id' => $mahasiswa->id, 'kelompok_id' => $kelompokId],
                [
                    'title' => 'Laporan Akhir KKN - '.$data['nama'],
                    'abstract' => 'Laporan ini merangkum seluruh kegiatan pengabdian masyarakat berbasis ABCD selama pelaksanaan KKN.',
                    'file_path' => 'dummy/reports/laporan-'.$data['nim'].'.pdf',
                    'file_name' => 'Laporan_Akhir_'.str_replace(' ', '_', $data['nama']).'.pdf',
                    'status' => 'approved',
                    'submitted_at' => now()->subDays(5),
                    'reviewed_at' => now()->subDays(2),
                    'score' => rand(80, 95),
                ]
            );
        }

        // Grades
        if ($data['has_grade'] && $kelompokId) {
            NilaiKkn::updateOrCreate(
                ['user_id' => $user->id, 'kelompok_id' => $kelompokId],
                [
                    'desa_interaksi_score' => rand(80, 95),
                    'desa_disiplin_score' => rand(78, 95),
                    'desa_kinerja_score' => rand(80, 95),
                    'dpl_relevansi_score' => rand(78, 92),
                    'dpl_ketercapaian_score' => rand(80, 92),
                    'dpl_inovasi_score' => rand(75, 90),
                    'dpl_administrasi_score' => rand(80, 95),
                    'dpl_artikel_score' => rand(75, 90),
                    'final_report_score' => rand(80, 95),
                    'total_score' => $data['total'],
                    'letter_grade' => $data['grade'],
                    'is_finalized' => true,
                    'dpl_graded_at' => now()->subDays(1),
                    'village_graded_at' => now()->subDays(2),
                ]
            );
        }
    }
}
