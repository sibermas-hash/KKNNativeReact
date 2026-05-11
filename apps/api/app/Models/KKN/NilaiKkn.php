<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class NilaiKkn extends Model
{
    protected function casts(): array
    {
        return [
            'dpl_graded_at' => 'datetime',
            'village_graded_at' => 'datetime',
            'admin_graded_at' => 'datetime',
            'is_finalized' => 'boolean',
            'desa_interaksi_score' => 'decimal:2',
            'desa_disiplin_score' => 'decimal:2',
            'desa_kinerja_score' => 'decimal:2',
            'dpl_relevansi_score' => 'decimal:2',
            'dpl_ketercapaian_score' => 'decimal:2',
            'dpl_inovasi_score' => 'decimal:2',
            'dpl_administrasi_score' => 'decimal:2',
            'dpl_artikel_score' => 'decimal:2',
            'final_report_score' => 'decimal:2',
            'execution_score' => 'decimal:2',
            'article_score' => 'decimal:2',
            'discipline_score' => 'decimal:2',
            'attitude_score' => 'decimal:2',
            'workshop_score' => 'decimal:2',
            'administration_score' => 'decimal:2',
            'dpl_weighted_score' => 'decimal:2',
            'village_weighted_score' => 'decimal:2',
            'lppm_weighted_score' => 'decimal:2',
            'total_score' => 'decimal:2',
        ];
    }

    protected $fillable = [
        'user_id',
        'kelompok_id',
        // Aspek Desa (Hal 41)
        'desa_interaksi_score',
        'desa_disiplin_score',
        'desa_kinerja_score',
        // Aspek DPL (Hal 42)
        'dpl_relevansi_score',
        'dpl_ketercapaian_score',
        'dpl_inovasi_score',
        'dpl_administrasi_score',
        'dpl_artikel_score',
        // Legacy fields (will be mapped from sub-components)
        'final_report_score',
        'execution_score',
        'article_score',
        'discipline_score',
        'attitude_score',
        // LPPM (Hal 43)
        'workshop_score',
        'administration_score',
        // Weighted
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
    ];

    protected $table = 'nilai_kkn';

    use HasFactory;

    // FIXED: Remove confusing mahasiswa_id - only use user_id

    /**
     * Calculate Village Subtotal (Hal 41)
     */
    public function calculateVillageScore(): float
    {
        return ($this->desa_interaksi_score * 0.30) +
               ($this->desa_disiplin_score * 0.40) +
               ($this->desa_kinerja_score * 0.30);
    }

    /**
     * Calculate DPL Subtotal (Hal 42)
     */
    public function calculateDplScore(): float
    {
        return ($this->dpl_relevansi_score * 0.20) +
               ($this->dpl_ketercapaian_score * 0.20) +
               ($this->dpl_inovasi_score * 0.20) +
               ($this->dpl_administrasi_score * 0.20) +
               ($this->dpl_artikel_score * 0.20);
    }

    /**
     * Calculate LPPM Subtotal (Hal 43)
     */
    public function calculateLppmScore(): float
    {
        // SURGICAL CLEANUP: LPPM component is now 100% based on Administration Score
        return floatval($this->administration_score ?? 0);
    }

    /**
     * FIXED: Proper relationship - nilai_kkn.user_id → users.id
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function mahasiswa(): HasOne
    {
        return $this->hasOne(Mahasiswa::class, 'user_id', 'user_id');
    }

    /**
     * Get mahasiswa_id with safe relationship access
     */
    public function getMahasiswaIdAttribute(): ?int
    {
        if ($this->relationLoaded('mahasiswa') && $this->mahasiswa) {
            return $this->mahasiswa->id;
        }

        if ($this->relationLoaded('user') && $this->user) {
            if ($this->user->relationLoaded('mahasiswa') && $this->user->mahasiswa) {
                return $this->user->mahasiswa->id;
            }

            return Mahasiswa::where('user_id', $this->user->id)->value('id');
        }

        return null;
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function dplGradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dpl_graded_by');
    }

    public function adminGradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_graded_by');
    }
}
