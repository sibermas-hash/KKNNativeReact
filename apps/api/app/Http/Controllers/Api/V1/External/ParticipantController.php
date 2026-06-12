<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\External;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ParticipantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $externalUniversityId = $this->externalUniversityId($request);

        $query = PesertaKkn::query()
            ->with(['mahasiswa.externalUniversity', 'periode', 'kelompok', 'collaborationLetter'])
            ->whereHas('mahasiswa', fn ($q) => $q->where('external_university_id', $externalUniversityId))
            ->when($request->filled('periode_id'), fn ($q) => $q->where('periode_id', $request->integer('periode_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('search'), fn ($q) => $q->search((string) $request->query('search')))
            ->latest('id');

        return response()->json($query->paginate(min((int) $request->query('per_page', 15), 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $externalUniversityId = $this->externalUniversityId($request);

        $data = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
            'collaboration_letter_id' => [
                'nullable',
                Rule::exists('collaboration_letters', 'id')->where('external_university_id', $externalUniversityId),
            ],
            'external_nim' => [
                'required', 'string', 'max:100',
                Rule::unique('mahasiswa', 'external_nim')->where('external_university_id', $externalUniversityId),
            ],
            'nama' => ['required', 'string', 'max:200'],
            'nik' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'external_faculty_name' => ['nullable', 'string', 'max:150'],
            'external_prodi_name' => ['nullable', 'string', 'max:150'],
        ]);

        $participant = DB::transaction(function () use ($data, $externalUniversityId) {
            $mahasiswa = Mahasiswa::create([
                'origin_type' => 'external',
                'external_university_id' => $externalUniversityId,
                'external_nim' => $data['external_nim'],
                'nim' => $data['external_nim'],
                'nama' => $data['nama'],
                'nik' => $data['nik'] ?? null,
                'gender' => $data['gender'] ?? null,
                'birth_place' => $data['birth_place'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'phone' => $data['phone'] ?? null,
                'external_faculty_name' => $data['external_faculty_name'] ?? null,
                'external_prodi_name' => $data['external_prodi_name'] ?? null,
                'status_aktif' => true,
            ]);

            return PesertaKkn::create([
                'mahasiswa_id' => $mahasiswa->id,
                'periode_id' => $data['periode_id'],
                'status' => 'pending',
                'entry_scheme' => 'kolaborasi',
                'collaboration_letter_id' => $data['collaboration_letter_id'] ?? null,
                'registration_date' => now(),
            ])->load(['mahasiswa.externalUniversity', 'periode', 'collaborationLetter']);
        });

        return response()->json($participant, 201);
    }

    public function show(Request $request, PesertaKkn $participant): JsonResponse
    {
        $this->abortUnlessScoped($request, $participant);

        return response()->json($participant->load(['mahasiswa.externalUniversity', 'periode', 'kelompok', 'collaborationLetter', 'dokumen']));
    }

    public function update(Request $request, PesertaKkn $participant): JsonResponse
    {
        $this->abortUnlessScoped($request, $participant);

        abort_unless(in_array($participant->status, ['pending', 'rejected'], true), 403, 'Peserta tidak dapat diedit setelah diverifikasi.');

        $externalUniversityId = $this->externalUniversityId($request);
        $mahasiswa = $participant->mahasiswa;

        $data = $request->validate([
            'collaboration_letter_id' => [
                'nullable',
                Rule::exists('collaboration_letters', 'id')->where('external_university_id', $externalUniversityId),
            ],
            'external_nim' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('mahasiswa', 'external_nim')->where('external_university_id', $externalUniversityId)->ignore($mahasiswa->id),
            ],
            'nama' => ['sometimes', 'required', 'string', 'max:200'],
            'nik' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
            'alamat' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'external_faculty_name' => ['nullable', 'string', 'max:150'],
            'external_prodi_name' => ['nullable', 'string', 'max:150'],
        ]);

        $mahasiswa->update(collect($data)->only([
            'external_nim', 'nama', 'nik', 'gender', 'birth_place', 'birth_date', 'alamat', 'phone', 'external_faculty_name', 'external_prodi_name',
        ])->all());

        if (array_key_exists('collaboration_letter_id', $data)) {
            $participant->update(['collaboration_letter_id' => $data['collaboration_letter_id']]);
        }

        return response()->json($participant->fresh()->load(['mahasiswa.externalUniversity', 'periode', 'collaborationLetter']));
    }

    public function destroy(Request $request, PesertaKkn $participant): JsonResponse
    {
        $this->abortUnlessScoped($request, $participant);
        abort_unless(in_array($participant->status, ['pending', 'rejected'], true), 403, 'Peserta tidak dapat dihapus setelah diverifikasi.');

        $participant->delete();

        return response()->json(['message' => 'Participant deleted.']);
    }

    private function externalUniversityId(Request $request): int
    {
        $id = (int) $request->user()->external_university_id;
        abort_if($id <= 0, 403, 'Akun belum terhubung ke kampus luar.');

        return $id;
    }

    private function abortUnlessScoped(Request $request, PesertaKkn $participant): void
    {
        $participant->loadMissing('mahasiswa');
        abort_unless((int) $participant->mahasiswa?->external_university_id === $this->externalUniversityId($request), 404);
    }
}
