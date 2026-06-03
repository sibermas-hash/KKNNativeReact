<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExternalUniversity extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'external_universities';

    protected $fillable = [
        'code',
        'name',
        'address',
        'pic_name',
        'pic_email',
        'pic_phone',
        'status',
    ];

    public function admins(): HasMany
    {
        return $this->hasMany(User::class, 'external_university_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
