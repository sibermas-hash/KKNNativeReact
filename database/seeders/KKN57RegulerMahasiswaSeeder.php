<?php

namespace Database\Seeders;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class KKN57RegulerMahasiswaSeeder extends Seeder
{
    private const DEFAULT_PASSWORD = 'Password#123';

    private const BATCH_SIZE = 50;

    private const FACULTY_MAP = [
        'Dakwah' => 'FDK',
        'FTIK' => 'FTIK',
        'FEBI' => 'FEBI',
        'FUAH' => 'FUH',
        'Syariah' => 'FASYA',
    ];

    private const PRODI_MAP = [
        'BKI' => ['fakultas' => 'Dakwah', 'nama' => 'Bimbingan Konseling Islam'],
        'MD' => ['fakultas' => 'Dakwah', 'nama' => 'Manajemen Dakwah'],
        'PMI' => ['fakultas' => 'Dakwah', 'nama' => 'Psikologi Islam'],
        'KPI' => ['fakultas' => 'Dakwah', 'nama' => 'Komunikasi Penyiaran Islam'],
        'PBA' => ['fakultas' => 'FTIK', 'nama' => 'Pendidikan Bahasa Arab'],
        'PAI' => ['fakultas' => 'FTIK', 'nama' => 'Pendidikan Agama Islam'],
        'TBI' => ['fakultas' => 'FTIK', 'nama' => 'Tadris Bahasa Inggris'],
        'PGMI' => ['fakultas' => 'FTIK', 'nama' => 'Pendidikan Guru Madrasah Ibtidaiyah'],
        'MPI' => ['fakultas' => 'FTIK', 'nama' => 'Manajemen Pendidikan Islam'],
        'ESY' => ['fakultas' => 'FEBI', 'nama' => 'Ekonomi Syariah'],
        'PSY' => ['fakultas' => 'FEBI', 'nama' => 'Perbankan Syariah'],
        'MZW' => ['fakultas' => 'FEBI', 'nama' => 'Manajemen Zakat dan Wakaf'],
        'HES' => ['fakultas' => 'Syariah', 'nama' => 'Hukum Ekonomi Syari\'ah'],
        'HTN' => ['fakultas' => 'Syariah', 'nama' => 'Hukum Tata Negara'],
        'HKI' => ['fakultas' => 'Syariah', 'nama' => 'Hukum Keluarga Islam'],
        'PMA' => ['fakultas' => 'Syariah', 'nama' => 'Perbandingan Mazhab'],
        'SAA' => ['fakultas' => 'FUAH', 'nama' => 'Sejarah dan Peradaban Islam'],
        'SPI' => ['fakultas' => 'FUAH', 'nama' => 'Sosiologi Pengembangan Masyarakat Islam'],
        'IAT' => ['fakultas' => 'FUAH', 'nama' => 'Ilmu Al-Quran dan Tafsir'],
        'TPI' => ['fakultas' => 'FUAH', 'nama' => 'Tasawuf dan Psikoterapi'],
    ];

    private const BIRTH_PLACES = [
        'Semarang', 'Surakarta', 'Yogyakarta', 'Jakarta', 'Bandung', 'Surabaya',
        'Pekalongan', 'Kudus', 'Jepara', 'Rembang', 'Pati', 'Demak',
        'Batang', 'Kendal', 'Temanggung', 'Wonosobo', 'Kebumen', 'Purworejo',
        'Magelang', 'Klaten', 'Sukoharjo', 'Wonogiri', 'Karawang', 'Bekasi',
        'Tangerang', 'Depok', 'Bogor', 'Cirebon', 'Majalengka', 'Indramayu',
        'Subang', 'Purwakarta', 'Sukabumi', 'Cianjur', 'Sumedang', 'Garut',
        'Tasikmalaya', 'Ciamis', 'Pangandaran', 'Banjar',
    ];

    private const MOTHER_NAMES = [
        'Siti Hartati', 'Siti Rahayu', 'Siti Mariam', 'Siti Aminah', 'Siti Khoiriyah',
        'Siti Nurhaliza', 'Siti Maryam', 'Siti Kulsum', 'Siti Fatimah', 'Siti Aisyah',
        'Siti Nurul', 'Siti Hidayah', 'Siti Latifah', 'Siti Wahyuni', 'Siti Suryani',
        'Siti Rohmah', 'Siti Maysaroh', 'Siti Istiqomah', 'Siti Khatun', 'Siti Balkis',
        'Siti Muakhirah', 'Siti Maesarah', 'Siti Ngadisah', 'Siti Korinah', 'Siti Latu',
        'Siti Umroh', 'Siti Kartika', 'Siti Damayanti', 'Siti Wati', 'Siti Nurlela',
        'Siti Halimah', 'Siti Hasanah', 'Siti Muflihah', 'Siti Uswatun', 'Siti Husna',
        'Siti Zalzalah', 'Siti Ghonimah', 'Siti Maqsudah', 'Siti Bashiroh', 'Siti Mudrikah',
        'Siti Qomariyah', 'Siti Muthmainnah', 'Siti Jamilah', 'Siti Khadijah', 'Siti Zaenab',
        'Siti Asma', 'Siti Ulfa', 'Siti Lutfiah', 'Siti NabIIah', 'Siti Hafsoh',
        'Siti Hanum', 'Siti Rukaiyah', 'Siti Barirah', 'Siti Sholikhah', 'Siti Ghadah',
        'Siti az-Zahro', 'Siti Nazzala', 'Siti Baroroh', 'Siti Mudrik', 'Siti Faridah',
        'Siti Azizah', 'Siti Zahrotul', 'Siti Nailal', 'Siti Aufa', 'Siti Julaeha',
        'Siti Muawanah', 'Siti Hisan', 'Siti Basuni', 'Siti Muqarramah', 'Siti Sayyidah',
        'Siti Hani', 'Siti Laily', 'Sperti', 'Maya', 'Dewi',
        'Kartika', 'Lina', 'Rina', 'Ani', 'Diah',
        'Nita', 'Ayu', 'Ika', 'Fitri', 'Yuni',
        'Tika', 'Wati', 'Sari', 'Ratri', 'Nindi',
        'Aulia', 'Citra', 'Farida', 'Intan', 'Puji',
        'Rika', 'Siti', 'Hilda', 'Indah', 'Mega',
    ];

    private const VILLAGE_NAMES = [
        'Karang Anyar', 'Pelog', 'Kudusan', 'Kepatihan', 'Solo Baru',
        'Manahan', 'Bakalan', 'Cemorosewu', 'Donotirto', 'Banjarsari',
        'Karang Timur', 'Wonosari', 'Sentolo', 'Pengasih', 'Kokap',
        'Godean', 'Sleman', 'Banguntapan', 'Bantul', 'Jetis',
        'Taman', 'Karangnongko', 'Jaten', 'Wonogiri', 'Bulusari',
    ];

    private const DISTRICT_NAMES = [
        'Gondokusuman', 'Umbulharjo', 'Jetis', 'Tegalrejo', 'Mantrijeron',
        'Kraton', 'Gondomanan', 'Mergangsang', 'Pakualaman', 'Wirobrajan',
        'Dukuh', 'Kedungsukan', 'Pemecutan', 'Dauh Puri', 'Denpasar Barat',
        'Ubung', 'Dangin Puri', 'Kuta', 'Kuta Utara', 'Kuta Selatan',
    ];

    private const REGENCY_NAMES = [
        'Surakarta', 'Yogyakarta', 'Sleman', 'Bantul', 'Gunung Kidul',
        'Klaten', 'Wonogiri', 'Karanganyar', 'Sragen', 'Purworejo',
        ' Kebumen', 'Berkeley', 'Bandung', 'Semarang', 'Surabaya',
        'Jakarta', 'Tangerang', 'Depok', 'Bekasi', 'Bogor',
    ];

    private const STREET_PREFIXES = ['Jl.', 'Jl. '];

    private const STREET_NAMES = [
        ' Ahmad Yani', ' Suprayitno', ' MT Харьох', ' Diponegoro', 'Veteran',
        ' Sudirman', ' Thamrin', ' Hasanudin', ' P Sudirman', ' Gatot Subroto',
        ' Juanda', ' Ahmad Dahlan', 'Sri Sultan', ' HB Jati', ' Mataram',
    ];

    private function generateMotherName(): string
    {
        return self::MOTHER_NAMES[array_rand(self::MOTHER_NAMES)];
    }

    private function generateAddress(): array
    {
        return [
            'address' => self::STREET_PREFIXES[array_rand(self::STREET_PREFIXES)].self::STREET_NAMES[array_rand(self::STREET_NAMES)].' No.'.rand(1, 99),
            'domicile_village_name' => self::VILLAGE_NAMES[array_rand(self::VILLAGE_NAMES)],
            'domicile_district_name' => self::DISTRICT_NAMES[array_rand(self::DISTRICT_NAMES)],
            'domicile_regency_name' => self::REGENCY_NAMES[array_rand(self::REGENCY_NAMES)],
        ];
    }

    private function generateBirthDate(): string
    {
        return sprintf('%04d-%02d-%02d', rand(2000, 2005), rand(1, 12), rand(1, 28));
    }

    private function generateSemester(): int
    {
        return rand(1, 10);
    }

    private function generateBtaStatus(): string
    {
        return rand(0, 1) ? 'LULUS' : 'BELUM_LULUS';
    }

    private function syncFakultasDanProdi(): void
    {
        foreach (self::FACULTY_MAP as $nama => $code) {
            Fakultas::updateOrCreate(['code' => $code], ['nama' => $nama]);
        }

        $cache = [];
        foreach (Fakultas::all() as $f) {
            $cache[$f->code] = $f->id;
        }

        foreach (self::PRODI_MAP as $code => $data) {
            $fName = $data['fakultas'] ?? null;
            $fCode = $fName ? (self::FACULTY_MAP[$fName] ?? null) : null;
            $fId = $fCode ? ($cache[$fCode] ?? null) : null;
            if ($fId) {
                Prodi::updateOrCreate(['fakultas_id' => $fId, 'code' => $code], ['nama' => $data['nama']]);
            }
        }

        $this->command->info('Fakultas dan Prodi telah disinkronkan.');
    }

    private function parseCSV(string $path): array
    {
        $handle = fopen($path, 'r');
        fgetcsv($handle);
        $headers = fgetcsv($handle);
        $rows = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 2 || empty($row[1])) {
                continue;
            }
            $data = [];
            foreach ($headers as $i => $h) {
                $data[trim($h)] = $row[$i] ?? '';
            }
            $rows[] = $data;
        }
        fclose($handle);

        return $rows;
    }

    public function run(): void
    {
        if (! in_array(app()->environment(), ['local', 'testing'])) {
            $this->command->warn('KKN57RegulerMahasiswaSeeder hanya bisa dijalankan di environment local/testing.');

            return;
        }

        $csvPath = base_path('DataKKN_57-KKN Reguler-setuju.csv');
        if (! file_exists($csvPath)) {
            $this->command->error('File CSV tidak ditemukan: '.$csvPath);

            return;
        }

        $studentRole = Role::where('name', 'student')->first();
        if (! $studentRole) {
            $this->command->error('Role "student" tidak ditemukan. Jalankan RoleSeeder terlebih dahulu.');

            return;
        }

        $this->syncFakultasDanProdi();

        $fCache = [];
        foreach (Fakultas::all() as $f) {
            $fCache[$f->code] = $f->id;
        }

        $pCache = [];
        foreach (Prodi::all() as $p) {
            $fid = $p->fakultas?->id;
            if ($fid) {
                $pCache[$fid.'-'.$p->code] = $p->id;
            }
        }

        $rows = $this->parseCSV($csvPath);
        $this->command->info('Menemukan '.count($rows).' mahasiswa dari CSV.');

        $emails = array_map(fn ($r) => strtolower(trim($r['NIM']).'@student.uinsaizu.ac.id'), $rows);
        $existingEmails = DB::table('users')->whereIn('email', $emails)->pluck('email')->map(fn ($e) => strtolower($e))->toArray();

        $newUsers = [];
        $newMahasiswa = [];
        $updated = 0;
        $skipped = 0;
        $now = now();
        $hashedPassword = Hash::make(self::DEFAULT_PASSWORD);

        foreach ($rows as $row) {
            $nim = trim($row['NIM']);
            if (empty($nim)) {
                $skipped++;

                continue;
            }

            $email = strtolower($nim.'@student.uinsaizu.ac.id');
            $fcode = self::FACULTY_MAP[$row['FAKULTAS']] ?? null;
            $fId = $fcode ? ($fCache[$fcode] ?? null) : null;
            $pId = $fId ? ($pCache[$fId.'-'.trim($row['PRODI'])] ?? null) : null;

            if (in_array($email, $existingEmails)) {
                $user = DB::table('users')->where('email', $email)->first();
                if ($user) {
                    $address = $this->generateAddress();
                    DB::table('users')->where('id', $user->id)->update([
                        'phone' => ! empty($row['WA']) ? trim($row['WA']) : $user->phone,
                        'address' => $address['address'],
                        'domicile_village_name' => $address['domicile_village_name'],
                        'domicile_district_name' => $address['domicile_district_name'],
                        'domicile_regency_name' => $address['domicile_regency_name'],
                        'must_change_password' => true,
                        'updated_at' => $now,
                    ]);
                    $mhs = DB::table('mahasiswa')->where('user_id', $user->id)->first();
                    if ($mhs) {
                        DB::table('mahasiswa')->where('id', $mhs->id)->update([
                            'birth_place' => self::BIRTH_PLACES[array_rand(self::BIRTH_PLACES)],
                            'birth_date' => $this->generateBirthDate(),
                            'semester' => $this->generateSemester(),
                            'status_bta_ppi' => $this->generateBtaStatus(),
                            'mother_name' => $this->generateMotherName(),
                            'updated_at' => $now,
                        ]);
                        $updated++;
                    } else {
                        DB::table('mahasiswa')->insert([
                            'user_id' => $user->id,
                            'nim' => $nim,
                            'nik' => ! empty($row['NIK']) ? trim($row['NIK']) : null,
                            'nama' => trim($row['NAMA']),
                            'mother_name' => ! empty($row['Nama Ibu']) && trim($row['Nama Ibu']) !== '' ? trim($row['Nama Ibu']) : $this->generateMotherName(),
                            'fakultas_id' => $fId,
                            'prodi_id' => $pId,
                            'batch_year' => 2025,
                            'sks_completed' => intval($row['SKS'] ?? 0),
                            'total_sks' => intval($row['SKS'] ?? 0),
                            'gpa' => floatval($row['IPKs'] ?? 0),
                            'gender' => strtoupper(trim($row['L/P'])) === 'P' ? 'P' : 'L',
                            'shirt_size' => ! empty($row['Kaos']) ? trim($row['Kaos']) : null,
                            'birth_place' => self::BIRTH_PLACES[array_rand(self::BIRTH_PLACES)],
                            'birth_date' => $this->generateBirthDate(),
                            'semester' => $this->generateSemester(),
                            'status_bta_ppi' => $this->generateBtaStatus(),
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);
                    }
                }

                continue;
            }

            $address = $this->generateAddress();
            $newUsers[] = [
                'username' => $nim,
                'name' => trim($row['NAMA']),
                'email' => $email,
                'phone' => ! empty($row['WA']) ? trim($row['WA']) : null,
                'address' => $address['address'],
                'domicile_village_name' => $address['domicile_village_name'],
                'domicile_district_name' => $address['domicile_district_name'],
                'domicile_regency_name' => $address['domicile_regency_name'],
                'is_active' => true,
                'must_change_password' => true,
                'email_verified_at' => $now,
                'password' => $hashedPassword,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $newMahasiswa[] = [
                'nim' => $nim,
                'nik' => ! empty($row['NIK']) ? trim($row['NIK']) : null,
                'nama' => trim($row['NAMA']),
                'mother_name' => ! empty($row['Nama Ibu']) && trim($row['Nama Ibu']) !== '' ? trim($row['Nama Ibu']) : $this->generateMotherName(),
                'fakultas_id' => $fId,
                'prodi_id' => $pId,
                'batch_year' => 2025,
                'sks_completed' => intval($row['SKS'] ?? 0),
                'total_sks' => intval($row['SKS'] ?? 0),
                'gpa' => floatval($row['IPKs'] ?? 0),
                'gender' => strtoupper(trim($row['L/P'])) === 'P' ? 'P' : 'L',
                'shirt_size' => ! empty($row['Kaos']) ? trim($row['Kaos']) : null,
                'birth_place' => self::BIRTH_PLACES[array_rand(self::BIRTH_PLACES)],
                'birth_date' => $this->generateBirthDate(),
                'semester' => $this->generateSemester(),
                'status_bta_ppi' => $this->generateBtaStatus(),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $inserted = 0;

        if (! empty($newUsers)) {
            $this->command->info('Input '.count($newUsers).' user baru (batch '.self::BATCH_SIZE.')...');
            $userIdMap = [];

            foreach (array_chunk($newUsers, self::BATCH_SIZE) as $i => $batch) {
                DB::table('users')->insert($batch);
                $emails = array_column($batch, 'email');
                foreach (DB::table('users')->whereIn('email', $emails)->get(['id', 'email']) as $u) {
                    $userIdMap[str_replace('@student.uinsaizu.ac.id', '', $u->email)] = $u->id;
                }
                $this->command->info('  Batch '.($i + 1).': '.count($batch));
            }
            $inserted = count($newUsers);

            $this->command->info('Assign role student ke '.count($userIdMap).' user...');
            $rId = $studentRole->id;
            foreach (array_chunk(array_values($userIdMap), self::BATCH_SIZE) as $i => $batch) {
                $vals = array_map(fn ($id) => "('App\\Models\\User',$id,$rId)", $batch);
                DB::statement('INSERT INTO model_has_roles (model_type,model_id,role_id) VALUES '.implode(',', $vals));
                $this->command->info('  Batch '.($i + 1).': '.count($batch));
            }

            $this->command->info('Input '.count($newMahasiswa).' mahasiswa...');
            foreach (array_chunk($newMahasiswa, self::BATCH_SIZE) as $i => $batch) {
                $batch = array_map(fn ($m) => array_merge($m, ['user_id' => $userIdMap[$m['nim']] ?? null]), $batch);
                $batch = array_filter($batch, fn ($m) => $m['user_id'] !== null);
                if (! empty($batch)) {
                    DB::table('mahasiswa')->insert($batch);
                }
                $this->command->info('  Batch '.($i + 1).': '.count($batch));
            }
        }

        $this->command->newLine();
        $this->command->info("Selesai! Ditambahkan: {$inserted}, Diperbarui: {$updated}, Dilewati: {$skipped}");
        $this->command->info('Password default: '.self::DEFAULT_PASSWORD);
    }
}
