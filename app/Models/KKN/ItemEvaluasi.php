<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemEvaluasi extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'item_evaluasi';

    public $timestamps = false;

    protected $fillable = [
        'evaluasi_id',
        'criterion',
        'score',
        'weight',
        'notes',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'weight' => 'decimal:2',
    ];

    public function evaluasi(): BelongsTo
    {
        return $this->belongsTo(Evaluasi::class, 'evaluasi_id');
    }
}
