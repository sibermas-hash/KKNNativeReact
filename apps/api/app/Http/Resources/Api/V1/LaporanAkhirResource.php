<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LaporanAkhirResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'kelompok_id' => $this->kelompok_id,
            'title' => $this->title,
            'abstract' => $this->abstract,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'file_url' => $this->download_url,
            'video_link' => $this->video_link,
            'news_link' => $this->news_link,
            'article_1_path' => $this->article_1_path,
            'article_2_path' => $this->article_2_path,
            'poster_1_path' => $this->poster_1_path,
            'poster_2_path' => $this->poster_2_path,
            'poster_3_path' => $this->poster_3_path,
            'articles' => [
                'article_1_path' => $this->article_1_path,
                'article_2_path' => $this->article_2_path,
            ],
            'posters' => [
                'poster_1_path' => $this->poster_1_path,
                'poster_2_path' => $this->poster_2_path,
                'poster_3_path' => $this->poster_3_path,
            ],
            'status' => $this->canonicalStatus(),
            'status_label' => $this->status_label,
            'status_color' => $this->status_color,
            'score' => $this->score,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'review_notes' => $this->review_notes,
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
        ];
    }
}
