<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('laporan')]
#[Fillable([
    'user_id',
        'kelompok_id',
        'type',
        'title',
        'description',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'status',
        'feedback',
        'reviewed_by',
        'submitted_at',
        'reviewed_at',
])]
#[Casts([
    'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
])]
class Laporan extends Model
{
    use HasFactory, SoftDeletes;

    

    

    

    

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
