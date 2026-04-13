<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Enums\AbcdStage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('program_kerja')]
#[Fillable([
    'kelompok_id',
        'title',
        'description',
        'sdg_goals',
        'objectives',
        'target_participants',
        'budget',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
        'approval_notes',
        'abcd_stage',
        'kategori',
])]
#[Casts([
    'sdg_goals' => 'array',
        'target_participants' => 'integer',
        'budget' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'abcd_stage' => AbcdStage::class,
])]
class ProgramKerja extends Model
{
    use HasFactory;

    

    

    

    

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rekapitulasi(): HasMany
    {
        return $this->hasMany(RekapitulasiKegiatan::class, 'program_kerja_id');
    }
}
