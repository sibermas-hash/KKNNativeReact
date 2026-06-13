<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
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
            'nik' => $this->when($isSensitiveVisible, fn () => $this->safeAttr('nik')),
            'mother_name' => $this->when($isSensitiveVisible, fn () => $this->safeAttr('mother_name')),

            'gender' => $this->gender,
            'shirt_size' => $this->shirt_size,
            'birth_place' => $this->birth_place,
            'birth_date' => $this->birth_date?->toDateString(),
            'marital_status' => $this->marital_status,
            'phone' => $this->when($isSensitiveVisible, fn () => $this->safeAttr('phone')),
            'alamat' => $this->when($isSensitiveVisible, fn () => $this->safeAttr('alamat')),
            'api_email' => $this->when($isSensitiveVisible, fn () => $this->safeAttr('api_email')),
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
            'origin_type' => $this->origin_type,
            'external_nim' => $this->external_nim,
            'external_faculty_name' => $this->external_faculty_name,
            'external_prodi_name' => $this->external_prodi_name,
            'external_university_id' => $this->external_university_id,
            'external_university' => $this->whenLoaded('externalUniversity', fn () => [
                'id' => $this->externalUniversity?->id,
                'name' => $this->externalUniversity?->name,
                'code' => $this->externalUniversity?->code,
            ]),

            // User account info (loaded via whenLoaded to avoid N+1)
            'user' => $this->when($this->relationLoaded('user') && $this->user, function () {
                $u = $this->user;

                return [
                    'id' => $u->id,
                    'username' => $u->username,
                    'email' => $u->email,
                    'is_active' => $u->is_active,
                    'avatar_url' => $u->avatar
                        ? rtrim(preg_replace('#/api$#', '', (string) config('app.url')), '/').'/storage/'.$u->avatar
                        : null,
                    'password_changed_at' => $u->password_changed_at,
                    'last_login_at' => $u->last_login_at,
                ];
            }),

            // KKN participation history
            'peserta' => $this->when($this->relationLoaded('peserta'), function () {
                return $this->peserta->map(fn ($p) => [
                    'id' => $p->id,
                    'status' => $p->status,
                    'kelompok_id' => $p->kelompok_id,
                    'kelompok' => $p->relationLoaded('kelompok') && $p->kelompok ? [
                        'id' => $p->kelompok->id,
                        'nama' => $p->kelompok->nama ?? $p->kelompok->name ?? null,
                    ] : null,
                    'joined_group_at' => $p->joined_group_at,
                    'created_at' => $p->created_at?->toDateTimeString(),
                ]);
            }),
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

    private function safeAttr(string $key): mixed
    {
        try {
            return $this->{$key};
        } catch (DecryptException) {
            return null;
        }
    }
}
