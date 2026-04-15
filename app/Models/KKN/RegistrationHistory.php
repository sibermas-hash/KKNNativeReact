<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationHistory extends Model
{
    protected $connection = 'kkn';

    protected $table = 'registration_histories';

    protected $fillable = [
    'peserta_kkn_id',
    'from_period_id',
    'to_period_id',
    'from_group_id',
    'to_group_id',
    'reason',
    'processed_by',
    'processed_at',
];

    protected $casts = ['processed_at' => 'datetime'];

    use HasFactory;

    public function pesertaKkn(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class, 'peserta_kkn_id');
    }

    public function fromPeriode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'from_period_id');
    }

    public function toPeriode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'to_period_id');
    }

    public function fromKelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'from_group_id');
    }

    public function toKelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'to_group_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
