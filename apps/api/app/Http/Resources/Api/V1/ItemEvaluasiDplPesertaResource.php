<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemEvaluasiDplPesertaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'evaluasi_dpl_peserta_id' => $this->evaluasi_dpl_peserta_id,
            'aspect' => $this->aspect,
            'score' => $this->score,
        ];
    }
}
