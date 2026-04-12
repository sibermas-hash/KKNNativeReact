<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PoskoKelompok extends Model
{
    use HasFactory;

    protected $connection = 'kkn';

    protected $table = 'posko_kelompok';

    protected $appends = ['photo_url'];

    protected $fillable = [
        'kelompok_id',
        'latitude',
        'longitude',
        'gmaps_link',
        'photo_path',
        'photo_name',
        'photo_size',
        'uploaded_by',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'photo_size' => 'integer',
    ];

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? route('student.posko.photo', $this) : null;
    }
}
