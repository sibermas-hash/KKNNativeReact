<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PesertaKkn extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'peserta_kkn';

    protected $fillable = [
        'mahasiswa_id',
        'period_id',
        'kelompok_id',
        'status',
        'registration_date',
        'approved_at',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'registration_date' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function dokumen(): HasMany
    {
        return $this->hasMany(DokumenPesertaKkn::class, 'peserta_kkn_id');
    }
}
