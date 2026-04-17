<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenPesertaKkn extends Model
{
    protected $connection = 'kkn';

    protected $table = 'dokumen_peserta_kkn';

    protected $fillable = [
        'peserta_kkn_id',
        'document_type',
        'file_path',
        'file_name',
        'file_size',
        'uploaded_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'uploaded_at' => 'datetime',
    ];

    use HasFactory;

    public $timestamps = false;

    public function peserta(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class, 'peserta_kkn_id');
    }
}
