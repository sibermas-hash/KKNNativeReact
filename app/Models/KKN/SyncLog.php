<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncLog extends Model
{
    use HasFactory;

    protected $table = 'sync_logs';

    protected $connection = 'kkn';

    protected $fillable = [
        'sync_type',
        'entity_type',
        'status',
        'total_fetched',
        'total_created',
        'total_updated',
        'total_skipped',
        'total_errors',
        'error_details',
        'duration_seconds',
        'triggered_by',
        'triggered_by_user_id',
        'started_at',
        'finished_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'error_details' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'total_fetched' => 'integer',
            'total_created' => 'integer',
            'total_updated' => 'integer',
            'total_skipped' => 'integer',
            'total_errors' => 'integer',
            'duration_seconds' => 'integer',
        ];
    }

    public function triggerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }
}
