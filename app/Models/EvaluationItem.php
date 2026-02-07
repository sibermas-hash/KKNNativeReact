<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluationItem extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'evaluation_id',
        'criterion',
        'score',
        'weight',
        'notes',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'weight' => 'decimal:2',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }
}
