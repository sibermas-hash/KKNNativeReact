<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenPesertaKkn extends Model
{
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
        'is_verified',
        'is_archived',
        'verified_at',
        'archived_at',
        'verified_by',
        'archived_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'uploaded_at' => 'datetime',
        'verified_at' => 'datetime',
        'archived_at' => 'datetime',
        'is_verified' => 'boolean',
        'is_archived' => 'boolean',
        // PII: `notes` may contain reviewer's personal remarks about the
        // student. `file_path` is INTENTIONALLY NOT encrypted because
        // PesertaKknController does an ownership check via
        // `->where('file_path', $path)` that would break with non-
        // deterministic ciphertext. File contents on disk are the
        // sensitive payload, not the path string itself.
        'notes' => 'encrypted',
    ];

    use HasFactory;

    public $timestamps = false;

    public function peserta(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class, 'peserta_kkn_id');
    }
}
