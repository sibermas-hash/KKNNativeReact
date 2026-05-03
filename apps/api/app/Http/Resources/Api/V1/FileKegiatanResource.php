<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FileKegiatanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kegiatan_kkn_id' => $this->kegiatan_kkn_id,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'preview_url' => route('student.laporan-harian.files.preview', $this->id),
        ];
    }
}
