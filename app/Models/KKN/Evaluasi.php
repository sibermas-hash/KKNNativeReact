<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluasi extends Model
{
    use HasFactory;

    protected $connection = 'kkn';

    protected $table = 'evaluasi';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'evaluator_type',
        'evaluator_id',
        'total_score',
        'grade',
        'notes',
        'evaluated_at',
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'evaluated_at' => 'datetime',
    ];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function item(): HasMany
    {
        return $this->hasMany(ItemEvaluasi::class, 'evaluasi_id');
    }
}
