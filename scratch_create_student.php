<?php

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

$nim = '191'.rand(100, 999).rand(100, 999);
$email = $nim.'@student.uinsaizu.ac.id';
$password = 'kkn12345';

try {

    $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

    $prodi = Prodi::first();
    if (! $prodi) {
        $fakultas = Fakultas::first() ?? Fakultas::create(['name' => 'Fakultas FTIK', 'code' => 'FTIK']);
        $prodi = Prodi::create(['faculty_id' => $fakultas->id, 'name' => 'PAI']);
    } else {
        $fakultas = Fakultas::find($prodi->faculty_id) ?? Fakultas::first();
    }

    $user = User::create([
        'name' => 'Mahasiswa Teladan KKN',
        'email' => $email,
        'username' => $nim,
        'password' => Hash::make($password),
        'email_verified_at' => now(),
    ]);

    $user->assignRole($role);

    $mahasiswa = Mahasiswa::create([
        'user_id' => $user->id,
        'nim' => $nim,
        'nama' => 'Mahasiswa Teladan',
        'faculty_id' => $fakultas->id,
        'program_id' => $prodi->id,
        'batch_year' => date('Y') - 3,
        'sks_completed' => 140,
        'total_sks' => 140,
        'gpa' => 3.85,
        'gender' => 'L',
        'is_bta_ppi_passed' => true,
        'status_bta_ppi' => 'Lulus BTA & PPI',
        'semester' => 6,
        'nik' => '330'.rand(1000000000000, 9999999999999),
        'university' => 'UIN SAIZU',
    ]);

    echo "=== AKUN MAHASISWA BERHASIL DIBUAT ===\n";
    echo 'Nama Lengkap   : '.$mahasiswa->nama."\n";
    echo 'NIM / Username : '.$nim."\n";
    echo 'Password       : '.$password."\n";
    echo "--- STATUS KELAYAKAN VALIDASI ---\n";
    echo "SKS: 140 | IPK: 3.85 | BTA/PPI: Lulus | Semester: 6\n";
    echo "======================================\n";
} catch (Exception $e) {
    echo 'GAGAL: '.$e->getMessage().' on line '.$e->getLine()."\n";
}
