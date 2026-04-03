<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KegiatanKkn extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'kegiatan_kkn';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'date',
        'title',
        'activity',
        'reflection',
        'output',
        'latitude',
        'longitude',
        'location_name',
        'status',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
    ];

    protected $casts = [
        'date' => 'date',
        'reviewed_at' => 'datetime',
    ];

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
