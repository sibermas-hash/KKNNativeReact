<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KknStatementAgreement extends Model
{
    use HasFactory;

    protected $table = 'kkn_statement_agreements';

    protected $fillable = [
        'mahasiswa_id',
        'periode_id',
        'jenis_kkn_id',
        'statement_version',
        'checklist',
        'signature_name',
        'signature_nim',
        'agreed_at',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'checklist' => 'array',
            'agreed_at' => 'datetime',
        ];
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function jenisKkn(): BelongsTo
    {
        return $this->belongsTo(JenisKkn::class, 'jenis_kkn_id');
    }
}
