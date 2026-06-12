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
            'name' => $dosen->nama,
            'faculty' => [
                'code' => $dosen->fakultas?->code,
                'name' => $dosen->fakultas?->nama,
            ],
            'email' => $dosen->user?->email,
            'phone' => $dosen->phone ?? $dosen->user?->phone,
            'master_id' => $dosen->master_id,
            'updated_at' => $dosen->updated_at?->toIso8601String(),
        ];
    }

    public function formatFaculty(Fakultas $faculty): array
    {
        return [
            'id' => $faculty->master_id,
            'code' => $faculty->code,
            'name' => $faculty->nama,
            'updated_at' => $faculty->updated_at?->toIso8601String(),
        ];
    }

    public function formatMahasiswa(Mahasiswa $mhs): array
    {
        return [
            'nim' => $mhs->nim,
            'name' => $mhs->nama,
            'faculty' => [
                'code' => $mhs->fakultas?->code,
                'name' => $mhs->fakultas?->nama,
            ],
            'program' => [
                'code' => $mhs->prodi?->code,
                'name' => $mhs->prodi?->nama,
            ],
            'batch_year' => $mhs->batch_year,
            'gpa' => $mhs->gpa,
            'sks_completed' => $mhs->sks_completed,
            'master_id' => $mhs->master_id,
            'updated_at' => $mhs->updated_at?->toIso8601String(),
        ];
    }

    public function formatProgram(Prodi $program): array
    {
        return [
            'id' => $program->master_id,
            'code' => $program->code,
            'name' => $program->nama,
            'organization_id' => $program->fakultas?->master_id,
            'faculty' => [
                'code' => $program->fakultas?->code,
                'name' => $program->fakultas?->nama,
            ],
            'updated_at' => $program->updated_at?->toIso8601String(),
        ];
    }

    public function getFromDatabase(string $entityType, array $params = []): array
    {
        return match ($entityType) {
            'dosen' => Dosen::with('user', 'fakultas')
                ->when(isset($params['since']), fn ($q) => $q->where('updated_at', '>=', $params['since']))
                ->get()
                ->map(fn ($d) => $this->formatDosen($d))
                ->toArray(),

            'mahasiswa' => Mahasiswa::with('user', 'fakultas', 'prodi')
                ->when(isset($params['since']), fn ($q) => $q->where('updated_at', '>=', $params['since']))
                ->get()
                ->map(fn ($m) => $this->formatMahasiswa($m))
                ->toArray(),

            'faculty', 'fakultas', 'organizations' => Fakultas::query()
                ->when(isset($params['since']), fn ($q) => $q->where('updated_at', '>=', $params['since']))
                ->get()
                ->map(fn ($f) => $this->formatFaculty($f))
                ->toArray(),

            'program', 'prodi' => Prodi::with('fakultas')
                ->when(isset($params['since']), fn ($q) => $q->where('updated_at', '>=', $params['since']))
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
            'faculty', 'fakultas', 'organizations' => '/sync/organizations',
            'program', 'prodi' => '/programs',
            default => '/sync/'.$entityType,
        };
    }
}
