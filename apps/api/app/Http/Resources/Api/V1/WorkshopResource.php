<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkshopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'periode_id' => $this->periode_id,
            'title' => $this->title,
            'description' => $this->description,
            'methodology' => $this->methodology,
            'location' => $this->location,
            'speaker' => $this->speaker,
            'workshop_date' => $this->workshop_date?->toDateString(),
            'start_time' => $this->formatted_start_time,
            'end_time' => $this->formatted_end_time,
            'max_participants' => $this->max_participants,
            'status' => $this->status,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'radius_meters' => $this->radius_meters,
            'active_token' => $this->active_token,
            'participant_count' => $this->when(
                $this->relationLoaded('peserta'),
                fn () => $this->peserta->count()
            ),
            'participants' => PesertaWorkshopResource::collection($this->whenLoaded('peserta')),
        ];
    }
}
