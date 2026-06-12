<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class LaporanAkhir extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REVISION = 'revision';

    protected $table = 'laporan_akhir';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'title',
        'abstract',
        'file_path',
        'file_name',
        'video_link',
        'news_link',
        'article_1_path',
        'article_2_path',
        'poster_1_path',
        'poster_2_path',
        'poster_3_path',
        'status',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
        'score',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'score' => 'decimal:2',
    ];

    public static function normalizeWorkflowStatus(?string $status): string
    {
        $normalized = strtolower(trim((string) $status));

        return match ($normalized) {
            'submitted', 'pending', 'menunggu' => self::STATUS_SUBMITTED,
            'approved', 'reviewed', 'disetujui' => self::STATUS_APPROVED,
            'revision', 'revised', 'revisi', 'rejected' => self::STATUS_REVISION,
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

    public function isApproved(): bool
    {
        return $this->canonicalStatus() === self::STATUS_APPROVED;
    }

    public function canBeResubmitted(): bool
    {
        return $this->canonicalStatus() === self::STATUS_REVISION;
    }

    public function scopeWorkflowApproved(Builder $query): Builder
    {
        return $query->whereIn('status', ['approved', 'reviewed', 'disetujui']);
    }

    /**
     * PHP 8.4 Property Hooks (Demonstration)
     * Replacing old-style getAttribute methods with direct property hooks.
     */
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
            self::STATUS_SUBMITTED => 'yellow',
            self::STATUS_APPROVED => 'green',
            self::STATUS_REVISION => 'red',
            default => 'gray',
        };
    }

    public ?string $download_url {
        get => $this->file_path ? Storage::disk('local')->url($this->file_path) : null;
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
        return $this->belongsTo(User::class, 'reviewed_by')->withTrashed();
    }
}
