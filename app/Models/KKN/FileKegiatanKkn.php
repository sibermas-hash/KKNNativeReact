<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileKegiatanKkn extends Model
{
    protected $table = 'file_kegiatan_kkn';

    protected $fillable = [
        'kegiatan_kkn_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    protected $casts = ['file_size' => 'integer'];

    use HasFactory;

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(KegiatanKkn::class, 'kegiatan_kkn_id');
    }
}
