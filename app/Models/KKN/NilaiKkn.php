<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NilaiKkn extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'nilai_kkn';

    protected $fillable = [
        'user_id',
        'kelompok_id',
        'final_report_score',
        'execution_score',
        'article_score',
        'discipline_score',
        'attitude_score',
        'workshop_score',
        'administration_score',
        'dpl_weighted_score',
        'village_weighted_score',
        'lppm_weighted_score',
        'total_score',
        'letter_grade',
        'dpl_graded_by',
        'dpl_graded_at',
        'village_graded_by',
        'village_graded_at',
        'admin_graded_by',
        'admin_graded_at',
        'evidence_file',
        'verification_token',
        'is_finalized',
    ];

    protected $casts = [
        'dpl_graded_at' => 'datetime',
        'village_graded_at' => 'datetime',
        'admin_graded_at' => 'datetime',
        'is_finalized' => 'boolean',
    ];

    public function mahasiswa(): BelongsTo
    {
        // Column renamed from mahasiswa_id to user_id to reflect it stores users.id
        return $this->belongsTo(Mahasiswa::class, 'user_id', 'user_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class , 'kelompok_id');
    }
}
