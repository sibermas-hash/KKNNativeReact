<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * R13-SEC-004: Financial PII (nik, no_rekening, nama_bank, npwp) was previously
 * exposed to every authenticated admin/faculty_admin. Now gated via `when()` to
 * superadmin only. Non-superadmin callers simply receive the resource without
 * those keys (Laravel's JsonResource::when semantic).
 */
class DosenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isSuperadmin = (bool) $request->user()?->hasRole('superadmin');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nip' => $this->nip,
            'nama' => $this->nama,
            'nama_gelar' => $this->nama_gelar,
            'nidn' => $this->nidn,

            // R13-SEC-004: financial / identity PII — superadmin only
            'nik' => $this->when($isSuperadmin, fn() => rescue(fn() => $this->nik)),
            'phone' => rescue(fn() => $this->phone),
            'no_rekening' => $this->when($isSuperadmin, fn() => rescue(fn() => $this->no_rekening)),
            'nama_bank' => $this->when($isSuperadmin, $this->nama_bank),
            'npwp' => $this->when($isSuperadmin, fn() => rescue(fn() => $this->npwp)),

            'jabatan' => $this->jabatan,
            'kelas_jabatan' => $this->kelas_jabatan,
            'tugas_tambahan' => $this->tugas_tambahan,
            'pendidikan_terakhir' => $this->pendidikan_terakhir,
            'golongan' => $this->golongan,
            'pangkat' => $this->pangkat,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->toDateString(),
            'tempat_lahir' => $this->tempat_lahir,
            'alamat' => rescue(fn() => $this->alamat),
            'status_aktif' => $this->status_aktif,
            'status_pegawai' => $this->status_pegawai,
            'is_cpns' => $this->is_cpns,
            'is_tugas_belajar' => $this->is_tugas_belajar,
            'fakultas_id' => $this->fakultas_id,
            'has_workshop' => $this->has_workshop,
            'workshop_date' => $this->workshop_date?->toDateString(),
            'faculty' => new FakultasResource($this->whenLoaded('fakultas')),
        ];
    }
}
