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
            'file_name' => $this->file_name,
            'file_url' => $this->download_url,
            'video_link' => $this->video_link,
            'news_link' => $this->news_link,
            'artifacts' => $this->adminArtifacts(),
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
    private function adminArtifacts(): array
    {
        return collect([
            ['key' => 'file', 'label' => 'Laporan Utama', 'path' => $this->file_path],
            ['key' => 'article_1', 'label' => 'Artikel Ilmiah 1', 'path' => $this->article_1_path],
            ['key' => 'article_2', 'label' => 'Artikel Ilmiah 2', 'path' => $this->article_2_path],
            ['key' => 'poster_1', 'label' => 'Poster Peta 1', 'path' => $this->poster_1_path],
            ['key' => 'poster_2', 'label' => 'Poster Peta 2', 'path' => $this->poster_2_path],
            ['key' => 'poster_3', 'label' => 'Poster Peta 3', 'path' => $this->poster_3_path],
        ])->map(fn ($item) => [
            'key' => $item['key'],
            'label' => $item['label'],
            'available' => filled($item['path']),
            'download_url' => filled($item['path']) ? route('api.v1.admin.laporan-akhir.download', ['report' => $this->id, 'asset' => $item['path']], false) : null,
        ])->all();
    }
}
