<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KegiatanKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'kelompok_id' => $this->kelompok_id,
            'date' => $this->date?->toDateString(),
            'date_label' => $this->date?->translatedFormat('d M Y'),
            'title' => $this->title,
            'abcd_stage' => $this->abcd_stage,
            'category' => $this->category ?? null,
            'activity' => $this->activity,
            'reflection' => $this->reflection,
            'social_media_link' => $this->social_media_link,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'gps_accuracy' => $this->gps_accuracy,
            'captured_at' => $this->captured_at?->toIso8601String(),
            'location_source' => $this->location_source,
            'location_name' => $this->location_name,
            'status' => $this->canonicalStatus(),
            'status_label' => $this->status_label,
            'status_color' => $this->status_color,
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'ai_summary' => $this->ai_summary,
            'ai_analysis' => $this->ai_analysis,
            'attachments' => FileKegiatanResource::collection($this->whenLoaded('fileKegiatan')),
            'kelompok' => [
                'id' => $this->kelompok_id,
                'name' => $this->whenLoaded('kelompok', fn () => $this->kelompok?->nama_kelompok ?? '-'),
            ],
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
