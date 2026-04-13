<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;

class EntityMapperService
{
    public function formatDosen(Dosen $dosen): array
    {
        return [
            'nip' => $dosen->nip,
            'name' => $dosen->name,
            'faculty' => [
                'code' => $dosen->faculty?->code,
                'name' => $dosen->faculty?->name,
            ],
            'email' => $dosen->user?->email,
            'phone' => $dosen->phone,
            'updated_at' => $dosen->updated_at?->toIso8601String(),
        ];
    }

    public function formatFaculty(Fakultas $faculty): array
    {
        return [
            'code' => $faculty->code,
            'name' => $faculty->name,
            'updated_at' => $faculty->updated_at?->toIso8601String(),
        ];
    }

    public function formatMahasiswa(Mahasiswa $mhs): array
    {
        return [
            'nim' => $mhs->nim,
            'name' => $mhs->name,
            'faculty' => [
                'code' => $mhs->faculty?->code,
                'name' => $mhs->faculty?->name,
            ],
            'program' => [
                'code' => $mhs->program?->code,
                'name' => $mhs->program?->name,
            ],
            'batch_year' => $mhs->batch_year,
            'gpa' => $mhs->gpa,
            'sks_completed' => $mhs->sks_completed,
            'updated_at' => $mhs->updated_at?->toIso8601String(),
        ];
    }

    public function formatProgram(Program $program): array
    {
        return [
            'code' => $program->code,
            'name' => $program->name,
            'faculty' => [
                'code' => $program->faculty?->code,
                'name' => $program->faculty?->name,
            ],
            'updated_at' => $program->updated_at?->toIso8601String(),
        ];
    }

    public function getFromDatabase(string $entityType, array $params = []): array
    {
        return match ($entityType) {
            'dosen' => Dosen::with('user', 'faculty')
                ->when(isset($params['since']), fn ($q) => $q->where('updated_at', '>=', $params['since']))
                ->get()
                ->map(fn ($d) => $this->formatDosen($d))
                ->toArray(),

            'mahasiswa' => Mahasiswa::with('user', 'faculty', 'program')
                ->when(isset($params['since']), fn ($q) => $q->where('updated_at', '>=', $params['since']))
                ->get()
                ->map(fn ($m) => $this->formatMahasiswa($m))
                ->toArray(),

            'faculty' => Fakultas::all()
                ->map(fn ($f) => $this->formatFaculty($f))
                ->toArray(),

            'program' => Prodi::with('faculty')
                ->get()
                ->map(fn ($p) => $this->formatProgram($p))
                ->toArray(),

            default => [],
        };
    }

    public function mapEntityTypeToEndpoint(string $entityType): string
    {
        return match ($entityType) {
            'dosen' => '/sync/dosen',
            'mahasiswa' => '/sync/mahasiswa',
            'faculty' => '/organizations',
            'program' => '/programs',
            default => '/sync/'.$entityType,
        };
    }
}
