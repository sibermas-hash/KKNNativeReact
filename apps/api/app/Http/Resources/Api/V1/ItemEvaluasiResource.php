<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemEvaluasiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'evaluasi_id' => $this->evaluasi_id,
            'criterion' => $this->criterion,
            'score' => $this->score,
            'weight' => $this->weight,
            'notes' => $this->notes,
        ];
    }
}
