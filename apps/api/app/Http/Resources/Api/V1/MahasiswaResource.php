<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * R13-SEC-005: NIK + mother_name are high-risk PII (identity-theft vector in Indonesia,
 * used for bank/telco verification). Previously exposed to every authenticated user
 * that could view mahasiswa data. Now gated to superadmin only via `when()`.
 */
class MahasiswaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isSensitiveVisible = $this->shouldShowSensitiveData($user);
        $fakultas = new FakultasResource($this->whenLoaded('fakultas'));
        $prodi = new ProdiResource($this->whenLoaded('prodi'));

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nim' => $this->nim,
            'nama' => $this->nama,
            'fakultas_id' => $this->fakultas_id,
            'prodi_id' => $this->prodi_id,

            // R13-SEC-005 + R9-H01 refinement: identity-theft vector protection
            'nik' => $this->when($isSensitiveVisible, $this->nik),
            'mother_name' => $this->when($isSensitiveVisible, $this->mother_name),

            'gender' => $this->gender,
            'shirt_size' => $this->shirt_size,
            'birth_place' => $this->birth_place,
            'birth_date' => $this->birth_date?->toDateString(),
            'marital_status' => $this->marital_status,
            'phone' => $this->when($isSensitiveVisible, $this->phone),
            'alamat' => $this->when($isSensitiveVisible, $this->alamat),
            'api_email' => $this->when($isSensitiveVisible, $this->api_email),
            'semester' => $this->semester,
            'sks_completed' => $this->sks_completed,
            'gpa' => $this->gpa,
            'batch_year' => $this->batch_year,
            'status_bta_ppi' => $this->status_bta_ppi,
            'status_aktif' => $this->status_aktif,
            'is_paid_ukt' => $this->is_paid_ukt,
            'health_certificate_path' => $this->health_certificate_path,
            'parent_permission_path' => $this->parent_permission_path,
            'faculty' => $fakultas,
            'fakultas' => $fakultas,
            'prodi' => $prodi,
            'profile_completion' => $this->profile_completion,
        ];
    }

    /**
     * Determine if sensitive PII data should be exposed.
     */
    private function shouldShowSensitiveData(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        // Superadmin and admin can see all PII
        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return true;
        }

        // Students can see their own PII
        if ($user->hasRole('student') && (int) $user->id === (int) $this->user_id) {
            return true;
        }

        // Faculty admins can see PII for students in their faculty
        if ($user->hasRole('faculty_admin') && $user->fakultas_id && (int) $user->fakultas_id === (int) $this->fakultas_id) {
            return true;
        }

        return false;
    }
}
