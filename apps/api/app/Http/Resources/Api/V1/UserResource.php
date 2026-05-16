<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'name' => $this->name,
            'email' => $this->email,
            'fakultas_id' => $this->fakultas_id,
            'avatar_url' => $this->avatar ? asset('storage/'.$this->avatar) : null,
            'phone' => $this->phone,
            'address' => $this->address,
            'address_village_name' => $this->address_village_name,
            'address_district_name' => $this->address_district_name,
            'address_regency_name' => $this->address_regency_name,
            'address_postal_code' => $this->address_postal_code,
            'address_lat' => $this->address_lat,
            'address_lng' => $this->address_lng,
            'address_registered_at' => $this->address_registered_at?->toIso8601String(),
            'address_verified_at' => $this->address_verified_at?->toIso8601String(),
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'password_changed_at' => $this->password_changed_at?->toIso8601String(),
            'roles' => $this->whenLoaded('roles', fn () => $this->getRoleNames()->toArray()),
            'permissions' => $this->when(
                $request->is('api/v1/auth/user'),
                fn () => $this->getPermissionsViaRoles()->pluck('name')->unique()->values()->toArray()
            ),
            'faculty' => new FakultasResource($this->whenLoaded('fakultas')),
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'dosen' => new DosenResource($this->whenLoaded('dosen')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
