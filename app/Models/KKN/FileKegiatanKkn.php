<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('file_kegiatan_kkn')]
#[Fillable([
    'kegiatan_kkn_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
])]
#[Casts([
    'file_size' => 'integer',
])]
class FileKegiatanKkn extends Model
{
    use HasFactory;

    

    

    

    

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(KegiatanKkn::class, 'kegiatan_kkn_id');
    }
}
