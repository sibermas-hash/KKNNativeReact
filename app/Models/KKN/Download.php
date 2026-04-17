<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    protected $connection = 'kkn';

    protected $table = 'downloads';

    protected $fillable = [
        'title',
        'file_name',
        'file_path',
        'external_url',
        'file_type',
        'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    use HasFactory;

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
