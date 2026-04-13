<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('log_audit')]
#[Fillable([
    'user_id',
        'action',
        'description',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'severity',
        'ip_address',
        'user_agent',
])]
#[Casts([
    'old_values' => 'json',
        'new_values' => 'json',
])]
class LogAudit extends Model
{
    

    

    

    

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
