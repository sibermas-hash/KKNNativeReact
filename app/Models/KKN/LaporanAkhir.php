<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LaporanAkhir extends Model
{
    use HasFactory, SoftDeletes;

    protected $connection = 'kkn';

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
}
