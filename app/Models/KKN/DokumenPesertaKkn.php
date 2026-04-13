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
#[Table('dokumen_peserta_kkn')]
#[Fillable([
    'peserta_kkn_id',
        'document_type',
        'file_path',
        'file_name',
        'file_size',
        'uploaded_at',
        'status',
        'notes',
])]
#[Casts([
    'file_size' => 'integer',
        'uploaded_at' => 'datetime',
])]
class DokumenPesertaKkn extends Model
{
    use HasFactory;

    

    

    public $timestamps = false;

    

    

    public function peserta(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class, 'peserta_kkn_id');
    }
}
