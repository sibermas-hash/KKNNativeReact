<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CountdownSetting extends Model
{
    protected $table = 'countdown_settings';

    protected $fillable = [
        'periode_id',
        'enabled',
        'title',
        'subtitle',
        'countdown_start',
        'countdown_end',
        'display_location',
        'style',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'countdown_start' => 'datetime',
        'countdown_end' => 'datetime',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }
}
