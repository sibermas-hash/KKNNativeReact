<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Jobs\ProcessActivityAiAnalysis;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KegiatanKkn extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REVISION = 'revision';

    protected $table = 'kegiatan_kkn';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'date',
        'title',
        'abcd_stage',
        'activity',
        'reflection',
        'social_media_link',
        'latitude',
        'longitude',
        'gps_accuracy',
        'captured_at',
        'location_source',
        'location_name',
        'status',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
        'ai_summary',
        'ai_analysis',
    ];

    protected $casts = [
        'date' => 'date',
        'captured_at' => 'datetime',
        'gps_accuracy' => 'float',
        'reviewed_at' => 'datetime',
        'ai_analysis' => 'array',
    ];

    use HasFactory;

    public static function draftStatuses(): array
    {
        return ['draft', 'draf'];
    }

    public static function submittedStatuses(): array
    {
        return ['submitted', 'pending', 'menunggu'];
    }

    public static function approvedStatuses(): array
    {
        return ['approved', 'reviewed', 'disetujui'];
    }

    public static function revisionStatuses(): array
    {
        return ['revision', 'revised', 'revisi', 'rejected', 'ditolak'];
    }

    public static function normalizeWorkflowStatus(?string $status): string
    {
        $normalized = strtolower(trim((string) $status));

        return match ($normalized) {
            'submitted', 'pending', 'menunggu' => self::STATUS_SUBMITTED,
            'approved', 'reviewed', 'disetujui' => self::STATUS_APPROVED,
            'revision', 'revised', 'revisi', 'rejected', 'ditolak' => self::STATUS_REVISION,
            default => self::STATUS_DRAFT,
        };
    }

    public function canonicalStatus(): string
    {
        return self::normalizeWorkflowStatus($this->status);
    }

    public function canBeReviewed(): bool
    {
        return in_array($this->canonicalStatus(), [self::STATUS_SUBMITTED, self::STATUS_REVISION], true);
    }

    public function canBeUpdatedByStudent(): bool
    {
        return $this->canonicalStatus() !== self::STATUS_APPROVED;
    }

    public function isApproved(): bool
    {
        return $this->canonicalStatus() === self::STATUS_APPROVED;
    }

    public function isRevisionRequested(): bool
    {
        return $this->canonicalStatus() === self::STATUS_REVISION;
    }

    public function scopeWorkflowSubmitted(Builder $query): Builder
    {
        return $query->whereIn('status', self::submittedStatuses());
    }

    public function scopeWorkflowApproved(Builder $query): Builder
    {
        return $query->whereIn('status', self::approvedStatuses());
    }

    public function scopeWorkflowRevision(Builder $query): Builder
    {
        return $query->whereIn('status', self::revisionStatuses());
    }

    public string $status_label {
        get => match ($this->canonicalStatus()) {
            self::STATUS_SUBMITTED => 'Menunggu Review',
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_REVISION => 'Perlu Revisi',
            default => 'Draft',
        };
    }

    public string $status_color {
        get => match ($this->canonicalStatus()) {
            self::STATUS_SUBMITTED => 'amber',
            self::STATUS_APPROVED => 'emerald',
            self::STATUS_REVISION => 'rose',
            default => 'slate',
        };
    }

    protected static function booted(): void
    {
        static::created(function (KegiatanKkn $kegiatan) {
            if (! app()->environment('testing')) {
                defer(fn () => ProcessActivityAiAnalysis::dispatch($kegiatan->withoutRelations()));
            }
        });

        static::deleting(function (KegiatanKkn $kegiatan) {
            $kegiatan->fileKegiatan()
                ->cursorPaginate(200)
                ->each(fn ($f) => $f->delete());
        });
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function fileKegiatan(): HasMany
    {
        return $this->hasMany(FileKegiatanKkn::class, 'kegiatan_kkn_id');
    }
}
