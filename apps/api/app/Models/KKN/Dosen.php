<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Dosen extends Model
{
    protected $table = 'dosen';

protected $fillable = [
        'user_id',
        'nip',
        'nama',
        'nama_gelar',
        'nidn',
        'nik',
        'phone',
        'jabatan',
        'kelas_jabatan',
        'tugas_tambahan',
        'pendidikan_terakhir',
        'golongan',
        'pangkat',
        'birth_date',
        'tempat_lahir',
        'gender',
        'alamat',
        'tanggal_pensiun',
        'is_cpns',
        'is_tugas_belajar',
        'has_workshop',
        'workshop_date',
        'status_aktif',
        'status_pegawai',
        'fakultas_id',
        'master_id',
        'master_synced_at',
    ];

    protected $hidden = [
        'no_rekening',
        'nama_bank',
        'npwp',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'tanggal_pensiun' => 'date',
        'is_cpns' => 'boolean',
        'is_tugas_belajar' => 'boolean',
        'has_workshop' => 'boolean',
        'workshop_date' => 'date',
        'master_synced_at' => 'datetime',
    ];

    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'fakultas_id');
    }

    // Relationship: A lecturer can supervise multiple groups (Many-to-Many via pivot)
    public function pimpinKelompok(): BelongsToMany
    {
        return $this->belongsToMany(KelompokKkn::class, 'dpl_kelompok', 'dosen_id', 'kelompok_kkn_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    // Helper: Get groups where this Dosen is the 'Ketua' (Admin)
    public function adminKelompok(): BelongsToMany
    {
        return $this->pimpinKelompok()->wherePivot('role', 'Ketua');
    }

    // Alias used by DPL controllers (DailyReport, FinalReport, Evaluation, Grading)
    public function kelompokKkn(): BelongsToMany
    {
        return $this->pimpinKelompok();
    }

    public function dplPeriods(): HasMany
    {
        return $this->hasMany(DplPeriod::class, 'dosen_id');
    }

    public function coordinatorAssignments(): HasMany
    {
        return $this->hasMany(DplKecamatanAssignment::class, 'dosen_id');
    }

    public function feedbackPeserta(): HasMany
    {
        return $this->hasMany(EvaluasiDplPeserta::class, 'dosen_id');
    }

    public function profileSnapshot(): MorphOne
    {
        return $this->morphOne(ProfilUser::class, 'profileable');
    }

    /**
     * Check if this DPL can take more groups in a specific period.
     */
    public function canTakeMoreGroups(int $periodId): bool
    {
        $dplPeriod = $this->dplPeriods()
            ->where('periode_id', $periodId)
            ->where('is_active', true)
            ->first();

        if (! $dplPeriod) {
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
            $q->where('periode_id', $periodId)
                ->where('is_active', true)
                ->whereRaw('max_kelompok_kkn > (SELECT COUNT(*) FROM kelompok_kkn WHERE dpl_periode_id = dpl_periode.id AND deleted_at IS NULL)');
        });
    }
}
