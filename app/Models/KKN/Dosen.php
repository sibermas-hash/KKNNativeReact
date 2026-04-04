<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dosen extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'dosen';

    protected $fillable = [
        'user_id',
        'nip',
        'nama',
        'faculty_id',
        'phone',
        'master_id',
        'master_synced_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class , 'faculty_id');
    }

    // Relationship: A lecturer can supervise multiple groups (Many-to-Many via pivot)
    public function pimpinKelompok()
    {
        return $this->belongsToMany(KelompokKkn::class , 'dpl_kelompok', 'dosen_id', 'kelompok_kkn_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    // Helper: Get groups where this Dosen is the 'Ketua' (Admin)
    public function adminKelompok()
    {
        return $this->pimpinKelompok()->wherePivot('role', 'Ketua');
    }

    // Alias used by DPL controllers (DailyReport, FinalReport, Evaluation, Grading)
    public function kelompokKkn()
    {
        return $this->pimpinKelompok();
    }

    // Legacy: Keep this for backward compatibility if needed, or remove if fully migrated
    public function kelompok()
    {
        return $this->hasMany(KelompokKkn::class , 'dpl_id');
    }

    public function dplPeriods(): HasMany
    {
        return $this->hasMany(DplPeriod::class , 'dosen_id');
    }

    public function coordinatorAssignments(): HasMany
    {
        return $this->hasMany(DplKecamatanAssignment::class, 'dosen_id');
    }

    /**
     * Check if this DPL can take more groups in a specific period.
     */
    public function canTakeMoreGroups(int $periodId): bool
    {
        $dplPeriod = $this->dplPeriods()
            ->where('period_id', $periodId)
            ->where('is_active', true)
            ->first();

        if (!$dplPeriod) {
            return false;
        }

        return $dplPeriod->hasCapacity();
    }

    /**
     * Scope: Available DPL for a specific period (still has capacity).
     */
    public function scopeAvailableForPeriod($query, int $periodId)
    {
        return $query->whereHas('dplPeriods', function ($q) use ($periodId) {
            $q->where('period_id', $periodId)
                ->where('is_active', true)
                ->whereRaw('(SELECT COUNT(*) FROM kelompok_kkn WHERE dpl_period_id = dpl_periods.id) < max_groups');
        });
    }
}
