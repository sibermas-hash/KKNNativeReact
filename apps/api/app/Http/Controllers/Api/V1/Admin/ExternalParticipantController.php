<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ExternalKknBatch;
use App\Models\KKN\ExternalStudentProfile;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExternalParticipantController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = ExternalStudentProfile::query()
            ->with(['batch.periode', 'mahasiswa.user', 'mahasiswa.peserta.kelompok.lokasi'])
            ->when($request->filled('batch_id'), fn ($q) => $q->where('batch_id', $request->integer('batch_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = '%'.strtolower((string) $request->query('search')).'%';
                $q->where(function ($qq) use ($s) {
                    $qq->whereRaw('lower(external_nim) like ?', [$s])
                       ->orWhereRaw('lower(home_university) like ?', [$s])
                       ->orWhereHas('mahasiswa', fn ($m) => $m->whereRaw('lower(nama) like ?', [$s]));
                });
            })
            ->latest('id');

        return $this->success($query->paginate(min((int) $request->query('per_page', 25), 100)));
    }

    public function batches(): JsonResponse
    {
        return $this->success(ExternalKknBatch::withCount('students')->with('periode:id,name,periode')->latest('id')->get());
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'home_university' => ['required', 'string', 'max:150'],
            'program_name' => ['nullable', 'string', 'max:150'],
            'letter_number' => ['nullable', 'string', 'max:120'],
            'letter_date' => ['nullable', 'date'],
            'expected_participants' => ['nullable', 'integer', 'min:1'],
            'target_regency' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);
        $data['program_name'] = $data['program_name'] ?? 'KKN Kolaborasi PTKIN';
        $data['created_by'] = auth()->id();
        return $this->created(ExternalKknBatch::create($data), 'Batch peserta eksternal dibuat.');
    }

    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batch_id' => ['required', 'exists:external_kkn_batches,id'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);
        $batch = ExternalKknBatch::findOrFail($data['batch_id']);
        $rows = $this->readCsv($request->file('file')->getRealPath());
        $faculty = Fakultas::firstOrCreate(['code' => 'EXT'], ['nama' => 'Mahasiswa Eksternal', 'short_name' => 'Eksternal']);
        $prodi = Prodi::firstOrCreate(['code' => 'EXT', 'fakultas_id' => $faculty->id], ['nama' => 'Program Studi Eksternal', 'short_name' => 'Eksternal']);
        $created = 0; $skipped = 0; $accounts = [];

        DB::transaction(function () use ($rows, $batch, $faculty, $prodi, &$created, &$skipped, &$accounts) {
            foreach ($rows as $i => $row) {
                $nama = trim((string) ($row['nama'] ?? $row['name'] ?? ''));
                $nim = trim((string) ($row['nim'] ?? $row['nim_asal'] ?? $row['external_nim'] ?? ''));
                if ($nama === '' || $nim === '') { $skipped++; continue; }
                if (ExternalStudentProfile::where('batch_id', $batch->id)->where('external_nim', $nim)->exists()) { $skipped++; continue; }
                $slug = Str::slug($batch->home_university, '');
                $username = strtolower(substr($slug, 0, 12).'_'.$nim);
                $base = $username; $n = 1;
                while (User::where('username', $username)->exists()) { $username = $base.'_'.$n++; }
                $password = Str::random(10);
                $user = User::create([
                    'username' => $username,
                    'name' => $nama,
                    'email' => $row['email'] ?? null,
                    'phone' => $row['no_hp'] ?? $row['phone'] ?? null,
                    'is_active' => true,
                    'must_change_password' => true,
                    'password' => $password,
                ]);
                $user->assignRole('mahasiswa');
                $mahasiswa = Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $username,
                    'nama' => $nama,
                    'fakultas_id' => $faculty->id,
                    'prodi_id' => $prodi->id,
                    'batch_year' => (int) now()->year,
                    'gender' => strtoupper(substr((string)($row['jenis_kelamin'] ?? $row['gender'] ?? ''),0,1)) ?: null,
                    'phone' => $row['no_hp'] ?? $row['phone'] ?? null,
                    'status_aktif' => 'aktif',
                    'sks_completed' => 0,
                    'gpa' => 0,
                    'is_paid_ukt' => false,
                    'origin_type' => 'external',
                ]);
                ExternalStudentProfile::create([
                    'mahasiswa_id' => $mahasiswa->id,
                    'batch_id' => $batch->id,
                    'external_nim' => $nim,
                    'home_university' => $row['kampus_asal'] ?? $row['home_university'] ?? $batch->home_university,
                    'external_faculty' => $row['fakultas_asal'] ?? $row['external_faculty'] ?? null,
                    'external_study_program' => $row['prodi_asal'] ?? $row['external_study_program'] ?? null,
                    'source_row_number' => $i + 2,
                ]);
                PesertaKkn::firstOrCreate([
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $batch->periode_id,
                ], [
                    'status' => 'approved',
                    'role' => 'member',
                    'registration_date' => now(),
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                    'notes' => 'Peserta eksternal import batch #'.$batch->id,
                ]);
                $created++;
                $accounts[] = ['nama' => $nama, 'nim_asal' => $nim, 'username' => $username, 'password' => $password];
            }
        });
        return $this->success(['created' => $created, 'skipped' => $skipped, 'accounts' => $accounts], 'Import peserta eksternal selesai.');
    }

    private function readCsv(string $path): array
    {
        $fh = fopen($path, 'r');
        $header = fgetcsv($fh) ?: [];
        $header = array_map(fn ($h) => Str::snake(trim((string) $h)), $header);
        $rows = [];
        while (($line = fgetcsv($fh)) !== false) {
            $row = [];
            foreach ($header as $i => $key) { $row[$key] = $line[$i] ?? null; }
            $rows[] = $row;
        }
        fclose($fh);
        return $rows;
    }
}
