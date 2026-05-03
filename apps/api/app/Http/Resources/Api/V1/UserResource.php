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
            'avatar_url' => $this->avatar ? asset('storage/'.$this->avatar) : null,
            'phone' => $this->phone,
            'address' => $this->address,
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
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
