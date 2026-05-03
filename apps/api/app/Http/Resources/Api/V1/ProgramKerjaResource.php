<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramKerjaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kelompok_id' => $this->kelompok_id,
            'title' => $this->title,
            'description' => $this->description,
            'sdg_goals' => $this->sdg_goals,
            'objectives' => $this->objectives,
            'target_participants' => $this->target_participants,
            'budget' => $this->budget,
            'status' => $this->status,
            'abcd_stage' => $this->abcd_stage?->value,
            'kategori' => $this->kategori,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'approval_notes' => $this->approval_notes,
            'proposals' => ProposalProgramKerjaResource::collection($this->whenLoaded('proposals')),
            'latest_proposal' => new ProposalProgramKerjaResource($this->whenLoaded('latestProposal')),
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
