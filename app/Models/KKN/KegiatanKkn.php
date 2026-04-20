<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Jobs\ProcessActivityAiAnalysis;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KegiatanKkn extends Model
{
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
