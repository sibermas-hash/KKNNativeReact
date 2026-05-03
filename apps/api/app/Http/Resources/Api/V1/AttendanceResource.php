<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'peserta_kkn_id' => $this->peserta_kkn_id,
            'check_in_at' => $this->check_in_at?->toIso8601String(),
            'check_out_at' => $this->check_out_at?->toIso8601String(),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'photo_url' => $this->photo_path ? asset('storage/'.$this->photo_path) : null,
            'method' => $this->method,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
