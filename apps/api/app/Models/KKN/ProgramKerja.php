<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Enums\AbcdStage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProgramKerja extends Model
{
    use SoftDeletes;

    protected $table = 'program_kerja';

    protected $fillable = [
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
    ];

    protected $casts = [
        'sdg_goals' => 'array',
        'target_participants' => 'integer',
        'budget' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'abcd_stage' => AbcdStage::class,
    ];

    use HasFactory;

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function approvedBy(): BelongsTo
    {
        // withTrashed: audit trail — tetap tampilkan siapa approve walau
        // user sudah di-soft-delete.
        return $this->belongsTo(User::class, 'approved_by')->withTrashed();
    }

    public function rekapitulasi(): HasMany
    {
        return $this->hasMany(RekapitulasiKegiatan::class, 'program_kerja_id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(ProposalProgramKerja::class, 'program_kerja_id')
            ->orderByDesc('version')
            ->orderByDesc('uploaded_at')
            ->orderByDesc('id');
    }

    public function latestProposal(): HasOne
    {
        return $this->hasOne(ProposalProgramKerja::class, 'program_kerja_id')
            ->latestOfMany('version');
    }
}
