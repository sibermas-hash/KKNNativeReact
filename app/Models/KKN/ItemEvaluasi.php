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
#[Table('item_evaluasi')]
#[Fillable([
    'evaluasi_id',
        'criterion',
        'score',
        'weight',
        'notes',
])]
#[Casts([
    'score' => 'decimal:2',
        'weight' => 'decimal:2',
])]
class ItemEvaluasi extends Model
{
    use HasFactory;

    

    

    public $timestamps = false;

    

    

    public function evaluasi(): BelongsTo
    {
        return $this->belongsTo(Evaluasi::class, 'evaluasi_id');
    }
}
