<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogAudit extends Model
{
    protected $connection = 'kkn';

    protected $table = 'log_audit';

    protected $fillable = [
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
];

    protected $casts = [
    'old_values' => 'json',
    'new_values' => 'json',
];

public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
