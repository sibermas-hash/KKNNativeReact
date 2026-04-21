<?php

namespace App\Models\KKN;

use App\Models\User;
use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LocationDispensation extends Model
{
    use ScopedByPeriode, SoftDeletes;

    protected $table = 'location_dispensations';

    protected $fillable = [
        'attendance_id',
        'user_id',
        'peserta_kkn_id',
        'kelompok_id',
        'periode_id',
        'type',
        'reason_description',
        'dpl_notes',
        'evidence_file_path',
        'status',
        'dpl_user_id',
        'dpl_reviewed_at',
        'dpl_decision',
        'lppm_user_id',
        'lppm_reviewed_at',
        'lppm_decision',
        'dispensation_date',
        'valid_from',
        'valid_until',
        'alternative_verification',
        'verification_method_notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'dispensation_date' => 'date',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'dpl_reviewed_at' => 'datetime',
        'lppm_reviewed_at' => 'datetime',
    ];

    // ─── RELATIONSHIPS ───────────────────────────────────────────

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pesertaKkn(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class);
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function dplReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dpl_user_id');
    }

    public function lppmReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lppm_user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    // ─── SCOPES ──────────────────────────────────────────────────

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending_dpl_review');
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('dispensation_date', $date);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'approved')
            ->where('valid_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('valid_until')
                    ->orWhere('valid_until', '>=', now());
            });
    }

    // ─── METHODS ──────────────────────────────────────────────────

    /**
     * Check if dispensation is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved' &&
               $this->dpl_decision === 'approve' &&
               (! $this->lppm_decision || $this->lppm_decision === 'approve');
    }

    /**
     * Check if dispensation is currently valid
     */
    public function isValid(): bool
    {
        if (! $this->isApproved()) {
            return false;
        }

        $now = now();

        return $this->valid_from <= $now &&
               (! $this->valid_until || $this->valid_until >= $now);
    }

    /**
     * Check if dispensation needs LPPM escalation
     */
    public function needsLppmReview(): bool
    {
        return in_array($this->type, ['sick', 'family_emergency', 'technical_issue']);
    }

    /**
     * Mark as approved by DPL
     */
    public function approveBylDpl(User $dpl, ?string $notes = null): void
    {
        $this->dpl_user_id = $dpl->id;
        $this->dpl_reviewed_at = now();
        $this->dpl_decision = 'approve';
        $this->dpl_notes = $notes;

        if ($this->needsLppmReview()) {
            $this->status = 'pending_lppm_review';
        } else {
            $this->status = 'approved';
        }

        $this->save();
    }

    /**
     * Mark as approved by LPPM
     */
    public function approveByLppm(User $lppm): void
    {
        $this->lppm_user_id = $lppm->id;
        $this->lppm_reviewed_at = now();
        $this->lppm_decision = 'approve';
        $this->status = 'approved';
        $this->save();
    }

    /**
     * Reject dispensation
     */
    public function reject(User $reviewer, string $reason, bool $byLppm = false): void
    {
        if ($byLppm) {
            $this->lppm_user_id = $reviewer->id;
            $this->lppm_reviewed_at = now();
            $this->lppm_decision = 'reject';
        } else {
            $this->dpl_user_id = $reviewer->id;
            $this->dpl_reviewed_at = now();
            $this->dpl_decision = 'reject';
        }

        $this->status = 'rejected';
        $this->dpl_notes = $reason;
        $this->save();
    }
}
