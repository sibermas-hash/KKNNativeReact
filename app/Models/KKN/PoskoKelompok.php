<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('posko_kelompok')]
#[Fillable([
    'kelompok_id',
    'latitude',
    'longitude',
    'gmaps_link',
    'photo_path',
    'photo_name',
    'photo_size',
    'uploaded_by',
])]
#[Casts([
    'latitude' => 'decimal:8',
    'longitude' => 'decimal:8',
    'photo_size' => 'integer',
])]
class PoskoKelompok extends Model
{
    use HasFactory;

    protected $appends = ['photo_url'];

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public string $photo_url {
        get => $this->photo_path ? route('student.posko.photo', $this) : '';
    }
}
