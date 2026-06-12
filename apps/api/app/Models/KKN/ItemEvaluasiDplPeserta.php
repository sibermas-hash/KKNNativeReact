<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemEvaluasiDplPeserta extends Model
{
    use HasFactory;

    protected $table = 'item_evaluasi_dpl_peserta';

    protected $fillable = [
        'evaluasi_dpl_peserta_id',
        'criterion_key',
        'criterion_label',
        'score',
        'weight',
        'notes',
    ];

    protected $casts = [
        'score' => 'integer',
        'weight' => 'integer',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(EvaluasiDplPeserta::class, 'evaluasi_dpl_peserta_id');
    }
}
