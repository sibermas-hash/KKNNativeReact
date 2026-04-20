<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DplKecamatanAssignment extends Model
{
    protected $table = 'dpl_kecamatan_assignments';

    protected $fillable = [
        'dpl_periode_id',
        'dosen_id',
        'periode_id',
        'kecamatan_id',
        'district_name',
        'regency_name',
        'assigned_by',
        'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    use HasFactory;

    public function dplPeriod(): BelongsTo
    {
        return $this->belongsTo(DplPeriod::class, 'dpl_periode_id');
    }

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
