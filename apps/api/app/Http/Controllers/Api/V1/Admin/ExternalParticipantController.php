<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ExternalKknBatch;
use App\Models\KKN\ExternalStudentProfile;
use App\Models\KKN\ExternalUniversity;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\User;
use App\Services\GroupSelectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExternalParticipantController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeProfilesByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function scopeBatchesByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('students.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

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

        $this->scopeProfilesByFaculty($query);

        return $this->success($query->paginate(min((int) $request->query('per_page', 25), 100)));
    }

    public function batches(): JsonResponse
    {
        $query = ExternalKknBatch::withCount('students')
            ->with(['periode:id,name,periode', 'externalUniversity:id,name,code'])
            ->latest('id');
        $this->scopeBatchesByFaculty($query);

        return $this->success($query->get());
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'external_university_id' => ['required', 'exists:external_universities,id'],
            'program_name' => ['nullable', 'string', 'max:150'],
            'letter_number' => ['nullable', 'string', 'max:120'],
            'letter_date' => ['nullable', 'date'],
            'expected_participants' => ['nullable', 'integer', 'min:1'],
            'target_regency' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);
        $university = ExternalUniversity::findOrFail($data['external_university_id']);
        $data['home_university'] = $university->name;
        $data['program_name'] = $data['program_name'] ?? 'KKN Kolaborasi PTKIN';
        $data['created_by'] = auth()->id();

        return $this->created(ExternalKknBatch::create($data), 'Batch peserta eksternal dibuat.');
    }


    public function importPreview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batch_id' => ['required', 'exists:external_kkn_batches,id'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $batch = ExternalKknBatch::findOrFail($data['batch_id']);
        $rows = $this->readCsv($request->file('file')->getRealPath());
        $preview = [];

        foreach ($rows as $i => $row) {
            $nama = trim((string) ($row['nama'] ?? $row['name'] ?? ''));
            $nim = trim((string) ($row['nim'] ?? $row['nim_asal'] ?? $row['external_nim'] ?? ''));
            $errors = [];

            if ($nama === '') {
                $errors[] = 'Nama wajib diisi.';
            }
            if ($nim === '') {
                $errors[] = 'NIM wajib diisi.';
            }
            if ($nim !== '' && ExternalStudentProfile::where('batch_id', $batch->id)->where('external_nim', $nim)->exists()) {
                $errors[] = 'NIM sudah ada dalam batch ini.';
            }
            if ($nim !== '' && Mahasiswa::where('origin_type', 'external')->where('nim', $nim)->exists()) {
                $errors[] = 'NIM sudah terdaftar sebagai mahasiswa eksternal.';
            }

            $preview[] = [
                'row' => $i + 2,
                'nama' => $nama,
                'nim' => $nim,
                'kampus_asal' => $row['kampus_asal'] ?? $row['home_university'] ?? $batch->home_university,
                'fakultas_asal' => $row['fakultas_asal'] ?? $row['external_faculty'] ?? null,
                'prodi_asal' => $row['prodi_asal'] ?? $row['external_study_program'] ?? null,
                'valid' => $errors === [],
                'errors' => $errors,
                'raw' => $row,
            ];
        }

        $valid = collect($preview)->where('valid', true)->count();

        return $this->success([
            'rows' => $preview,
            'total_rows' => count($preview),
            'valid_rows' => $valid,
            'invalid_rows' => count($preview) - $valid,
        ]);
    }

    public function importConfirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'batch_id' => ['required', 'exists:external_kkn_batches,id'],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.nama' => ['required', 'string', 'max:200'],
            'rows.*.nim' => ['required', 'string', 'max:50'],
            'rows.*.kampus_asal' => ['nullable', 'string', 'max:150'],
            'rows.*.fakultas_asal' => ['nullable', 'string', 'max:150'],
            'rows.*.prodi_asal' => ['nullable', 'string', 'max:150'],
            'rows.*.valid' => ['sometimes', 'boolean'],
            'rows.*.raw' => ['sometimes', 'array'],
        ]);

        $batch = ExternalKknBatch::findOrFail($data['batch_id']);
        $rows = collect($data['rows'])->filter(fn ($row) => (bool) ($row['valid'] ?? true))->values()->all();

        return $this->createExternalParticipants($batch, $rows, false);
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
        $created = 0;
        $skipped = 0;
        $accounts = [];

        DB::transaction(function () use ($rows, $batch, $faculty, $prodi, &$created, &$skipped, &$accounts) {
            foreach ($rows as $i => $row) {
                $nama = trim((string) ($row['nama'] ?? $row['name'] ?? ''));
                $nim = trim((string) ($row['nim'] ?? $row['nim_asal'] ?? $row['external_nim'] ?? ''));
                if ($nama === '' || $nim === '') {
                    $skipped++;

                    continue;
                }
                if (ExternalStudentProfile::where('batch_id', $batch->id)->where('external_nim', $nim)->exists()) {
                    $skipped++;

                    continue;
                }
                $username = 'X-'.strtoupper($nim);
                $base = $username;
                $n = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $base.'-'.$n++;
                }
                $password = 'KknReguler#2026!';
                $user = User::create([
                    'username' => $username,
                    'name' => $nama,
                    'email' => $row['email'] ?? null,
                    'phone' => $row['no_hp'] ?? $row['phone'] ?? null,
                    'address' => $row['alamat'] ?? $row['address'] ?? null,
                    'is_active' => true,
                    'must_change_password' => true,
                    'password' => $password,
                ]);
                $user->assignRole('student');
                $mahasiswa = Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $nim,
                    'nama' => $nama,
                    'fakultas_id' => $faculty->id,
                    'prodi_id' => $prodi->id,
                    'batch_year' => (int) now()->year,
                    'gender' => strtoupper(substr((string) ($row['jenis_kelamin'] ?? $row['gender'] ?? ''), 0, 1)) ?: null,
                    'phone' => $row['no_hp'] ?? $row['phone'] ?? null,
                    'birth_date' => $row['tgl_lahir'] ?? $row['tanggal_lahir'] ?? $row['birth_date'] ?? null,
                    'alamat' => $row['alamat'] ?? $row['address'] ?? null,
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
                    'status' => 'pending',
                    'role' => 'member',
                    'registration_date' => now(),
                    'notes' => 'Peserta eksternal import batch #'.$batch->id,
                ]);
                $created++;
                $accounts[] = ['nama' => $nama, 'nim_asal' => $nim, 'username' => $username, 'password' => $password];
            }
        });

        return $this->success(['created' => $created, 'skipped' => $skipped, 'accounts' => $accounts], 'Import peserta eksternal selesai.');
    }


    private function createExternalParticipants(ExternalKknBatch $batch, array $rows, bool $legacyImport = false): JsonResponse
    {
        $faculty = Fakultas::firstOrCreate(['code' => 'EXT'], ['nama' => 'Mahasiswa Eksternal', 'short_name' => 'Eksternal']);
        $prodi = Prodi::firstOrCreate(['code' => 'EXT', 'fakultas_id' => $faculty->id], ['nama' => 'Program Studi Eksternal', 'short_name' => 'Eksternal']);
        $created = 0;
        $skipped = 0;
        $accounts = [];

        DB::transaction(function () use ($rows, $batch, $faculty, $prodi, &$created, &$skipped, &$accounts) {
            foreach ($rows as $i => $row) {
                $raw = $row['raw'] ?? $row;
                $nama = trim((string) ($row['nama'] ?? $raw['nama'] ?? $raw['name'] ?? ''));
                $nim = trim((string) ($row['nim'] ?? $raw['nim'] ?? $raw['nim_asal'] ?? $raw['external_nim'] ?? ''));
                if ($nama === '' || $nim === '') { $skipped++; continue; }
                if (ExternalStudentProfile::where('batch_id', $batch->id)->where('external_nim', $nim)->exists()) { $skipped++; continue; }
                if (Mahasiswa::where('origin_type', 'external')->where('nim', $nim)->exists()) { $skipped++; continue; }

                $username = 'X-'.strtoupper($nim);
                $base = $username;
                $n = 1;
                while (User::where('username', $username)->exists()) { $username = $base.'-'.$n++; }
                $password = 'KknReguler#2026!';
                $user = User::create([
                    'username' => $username,
                    'name' => $nama,
                    'email' => $raw['email'] ?? null,
                    'phone' => $raw['no_hp'] ?? $raw['phone'] ?? null,
                    'address' => $raw['alamat'] ?? $raw['address'] ?? null,
                    'is_active' => true,
                    'must_change_password' => true,
                    'password' => $password,
                ]);
                $user->assignRole('student');
                $mahasiswa = Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $nim,
                    'nama' => $nama,
                    'fakultas_id' => $faculty->id,
                    'prodi_id' => $prodi->id,
                    'batch_year' => (int) now()->year,
                    'gender' => strtoupper(substr((string) ($raw['jenis_kelamin'] ?? $raw['gender'] ?? ''), 0, 1)) ?: null,
                    'phone' => $raw['no_hp'] ?? $raw['phone'] ?? null,
                    'birth_date' => $raw['tgl_lahir'] ?? $raw['tanggal_lahir'] ?? $raw['birth_date'] ?? null,
                    'alamat' => $raw['alamat'] ?? $raw['address'] ?? null,
                    'status_aktif' => 'aktif',
                    'sks_completed' => 0,
                    'gpa' => 0,
                    'is_paid_ukt' => false,
                    'origin_type' => 'external',
                    'external_university_id' => $batch->external_university_id,
                    'external_nim' => $nim,
                    'external_faculty_name' => $row['fakultas_asal'] ?? $raw['fakultas_asal'] ?? $raw['external_faculty'] ?? null,
                    'external_prodi_name' => $row['prodi_asal'] ?? $raw['prodi_asal'] ?? $raw['external_study_program'] ?? null,
                ]);
                ExternalStudentProfile::create([
                    'mahasiswa_id' => $mahasiswa->id,
                    'batch_id' => $batch->id,
                    'external_nim' => $nim,
                    'home_university' => $row['kampus_asal'] ?? $raw['kampus_asal'] ?? $raw['home_university'] ?? $batch->home_university,
                    'external_faculty' => $row['fakultas_asal'] ?? $raw['fakultas_asal'] ?? $raw['external_faculty'] ?? null,
                    'external_study_program' => $row['prodi_asal'] ?? $raw['prodi_asal'] ?? $raw['external_study_program'] ?? null,
                    'source_row_number' => (int) ($row['row'] ?? ($i + 2)),
                ]);
                PesertaKkn::firstOrCreate([
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $batch->periode_id,
                ], [
                    'status' => 'pending',
                    'role' => 'member',
                    'registration_date' => now(),
                    'notes' => 'Peserta eksternal import batch #'.$batch->id.' (menunggu verifikasi admin)',
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
            foreach ($header as $i => $key) {
                $row[$key] = $line[$i] ?? null;
            }
            $rows[] = $row;
        }
        fclose($fh);

        return $rows;
    }

    public function export(Request $request)
    {
        $rows = ExternalStudentProfile::query()
            ->with(['batch.periode', 'mahasiswa.user', 'mahasiswa.peserta.kelompok.lokasi'])
            ->when($request->filled('batch_id'), fn ($q) => $q->where('batch_id', $request->integer('batch_id')))
            ->oldest('id');

        $this->scopeProfilesByFaculty($rows);

        $rows = $rows->get();

        $header = ['no', 'nama', 'username', 'nim_asal', 'kampus_asal', 'fakultas_asal', 'prodi_asal', 'periode', 'target_kabupaten', 'kelompok', 'lokasi_kelompok', 'status_peserta', 'no_hp', 'email'];
        $lines = [$header];
        foreach ($rows as $i => $row) {
            $peserta = $row->mahasiswa?->peserta?->first();
            $kelompok = $peserta?->kelompok;
            $lines[] = [
                $i + 1,
                $row->mahasiswa?->nama ?? '',
                $row->mahasiswa?->user?->username ?? $row->mahasiswa?->nim ?? '',
                $row->external_nim,
                $row->home_university,
                $row->external_faculty ?? '',
                $row->external_study_program ?? '',
                $row->batch?->periode?->name ?? '',
                $row->batch?->target_regency ?? '',
                $kelompok?->nama_kelompok ?? '',
                $kelompok?->lokasi?->regency_name ?? '',
                $peserta?->status ?? '',
                $row->mahasiswa?->phone ?? $row->mahasiswa?->user?->phone ?? '',
                $row->mahasiswa?->user?->email ?? '',
            ];
        }
        $csv = collect($lines)->map(fn ($line) => implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', (string) $v).'"', $line)))->implode("\n")."\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="peserta-eksternal-'.now()->format('Ymd-His').'.csv"',
        ]);
    }

    public function template()
    {
        $rows = [
            ['nama', 'nim', 'kampus_asal', 'fakultas_asal', 'prodi_asal', 'jenis_kelamin', 'email', 'no_hp', 'tanggal_lahir', 'alamat'],
            ['Contoh Mahasiswa', 'EXT001', 'Universitas Contoh', 'Fakultas Contoh', 'Program Studi Contoh', 'L', 'contoh@email.test', '08123456789', '2005-01-01', 'Alamat lengkap'],
        ];
        $csv = collect($rows)->map(fn ($row) => implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', $v).'"', $row)))->implode("\n")."\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template-peserta-eksternal.csv"',
        ]);
    }

    public function bulkAssign(Request $request): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }

        $validated = $request->validate([
            'peserta_ids' => ['required', 'array', 'min:1'],
            'peserta_ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'force' => ['sometimes', 'boolean'],
        ]);

        $pesertaIds = $validated['peserta_ids'];
        $kelompokId = (int) $validated['kelompok_id'];
        $force = (bool) ($validated['force'] ?? false);
        $isSuperadmin = (bool) auth()->user()?->hasRole('superadmin');

        $batchId = 'manual:bulk-ext:'.now()->format('YmdHis').':'.Str::random(8);
        $service = app(GroupSelectionService::class);

        $results = [];
        $errors = [];

        try {
            DB::transaction(function () use ($pesertaIds, $kelompokId, $force, $isSuperadmin, $batchId, $service, &$results, &$errors) {
                $group = KelompokKkn::lockForUpdate()->findOrFail($kelompokId);

                foreach ($pesertaIds as $pesertaId) {
                    $pesertaKkn = PesertaKkn::lockForUpdate()->findOrFail($pesertaId);

                    if ($pesertaKkn->status !== 'approved') {
                        $errors[] = [
                            'peserta_id' => $pesertaId,
                            'nama' => $pesertaKkn->mahasiswa?->nama ?? 'N/A',
                            'error' => 'Status peserta "'.$pesertaKkn->status.'", harus "approved".',
                        ];

                        continue;
                    }

                    $pesertaKkn->loadMissing('mahasiswa');
                    if (! $pesertaKkn->mahasiswa) {
                        $errors[] = [
                            'peserta_id' => $pesertaId,
                            'nama' => 'Unknown',
                            'error' => 'Data mahasiswa tidak ditemukan.',
                        ];

                        continue;
                    }

                    try {
                        if ($force && $isSuperadmin) {
                            $service->validateGroupAcceptance($group, $pesertaKkn->mahasiswa, $pesertaKkn->id);
                            $pesertaKkn->update([
                                'kelompok_id' => $kelompokId,
                                'joined_group_at' => now(),
                                'placement_is_live' => false,
                                'placement_published_at' => null,
                                'placement_published_by' => null,
                                'placement_batch_id' => $batchId,
                            ]);
                        } else {
                            $service->assignGroup($pesertaKkn, $pesertaKkn->mahasiswa, $kelompokId);
                            $pesertaKkn->update([
                                'placement_is_live' => false,
                                'placement_published_at' => null,
                                'placement_published_by' => null,
                                'placement_batch_id' => $batchId,
                            ]);
                        }

                        $results[] = [
                            'peserta_id' => $pesertaId,
                            'nama' => $pesertaKkn->mahasiswa->nama,
                            'status' => 'success',
                        ];
                    } catch (ValidationException $e) {
                        $errors[] = [
                            'peserta_id' => $pesertaId,
                            'nama' => $pesertaKkn->mahasiswa->nama,
                            'error' => collect($e->errors())->flatten()->first() ?? 'Gagal validasi kelompok.',
                        ];
                    }
                }

                if (count($errors) > 0) {
                    throw new \RuntimeException('Validation failed for one or more participants');
                }
            });
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Beberapa peserta gagal divalidasi.', 422, [
                'errors' => $errors,
            ]);
        }

        return $this->success([
            'assigned_count' => count($results),
            'placement_batch_id' => $batchId,
            'results' => $results,
        ], 'Bulk assign berhasil diproses sebagai draft.');
    }
}
