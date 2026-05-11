<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mahasiswa extends Model
{
    // R13-DB-001: soft-delete enabled so hard cascade from users no longer
    // destroys kegiatan/peserta_kkn/nilai/evaluasi. Requires migration
    // 2026_05_11_060000 to add the deleted_at column.
    use HasFactory, SoftDeletes, \App\Traits\HasManuallyEditedFields, \App\Traits\HasBlindIndex;

    protected $table = 'mahasiswa';

    protected $fillable = [
        'user_id',
        'nim',
        'nim_bidx',
        'nik',
        'nama',
        'mother_name',
        'fakultas_id',
        'prodi_id',
        'batch_year',
        'sks_completed',
        'gpa',
        'status_bta_ppi',
        'status_aktif',
        'is_paid_ukt',
        'semester',
        'health_certificate_path',
        'parent_permission_path',
        'gender',
        'shirt_size',
        'birth_place',
        'birth_date',
        'marital_status',
        'alamat',
        'phone',
        'master_id',
        'master_synced_at',
        'api_email',
        'manually_edited_fields',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'sks_completed' => 'integer',
            'semester' => 'integer',
            'gpa' => 'float',
            'is_paid_ukt' => 'boolean',
            'master_synced_at' => 'datetime',
            'manually_edited_fields' => 'array',
            // PII encryption (Phase 1): these columns were widened to TEXT in
            // 2026_05_10_033000_expand_pii_columns_on_mahasiswa so that AES-256
            // ciphertext payloads fit. Never WHERE-queried across the codebase
            // (verified via grep before enabling), so no blind index required.
            //
            // Phase 2 fields that DO need blind indexes before encryption
            // (NIM, email, phone) are tracked in docs/PII_ENCRYPTION_PLAN.md.
            // PII encryption (Phase 1+2). Columns widened to TEXT in
            // 2026_05_10_033000_expand_pii_columns_on_mahasiswa. Never
            // WHERE-queried across the codebase (verified via grep).
            //
            // NIM INTENTIONALLY NOT ENCRYPTED: used as updateOrCreate key in
            // StudentSyncService and several import paths; non-deterministic
            // AES ciphertext would produce duplicate rows every sync.
            // NIM is also not a secret (printed on student ID cards).
            // Lookup acceleration stays via `nim_bidx` HMAC column.
            'nik' => 'encrypted',
            'mother_name' => 'encrypted',
            'alamat' => 'encrypted',
            'phone' => 'encrypted',
        ];
    }

    /**
     * Blind-index map consumed by the HasBlindIndex trait.
     *
     * Source `nim` (still plaintext during transition) is HMAC-hashed into
     * `nim_bidx` on every save. Once all callers have been migrated to
     * `whereBlind('nim', $value)` and nim_bidx is fully populated, a follow-up
     * migration will encrypt the `nim` column itself.
     */
    protected function blindIndexMap(): array
    {
        return ['nim' => 'nim_bidx'];
    }

    /**
     * True when this mahasiswa has ever been accepted into a KKN group.
     * Used by sync to freeze records of students who are already in KKN —
     * their SIAKAD data must not overwrite what's already in SIBERMAS.
     */
    public function hasEverBeenInKkn(): bool
    {
        return $this->peserta()
            ->whereNotNull('kelompok_id')
            ->exists();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'fakultas_id');
    }

    public function prodi(): BelongsTo
    {
        return $this->belongsTo(Prodi::class, 'prodi_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'mahasiswa_id');
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(KegiatanKkn::class, 'mahasiswa_id');
    }

    public function laporanAkhir(): HasMany
    {
        return $this->hasMany(LaporanAkhir::class, 'mahasiswa_id');
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class, 'mahasiswa_id');
    }

    public function evaluasiDplPeserta(): HasMany
    {
        return $this->hasMany(EvaluasiDplPeserta::class, 'mahasiswa_id');
    }

    public function nilai(): HasMany
    {
        return $this->hasMany(NilaiKkn::class, 'user_id', 'user_id');
    }

    public function profileSnapshot(): MorphOne
    {
        return $this->morphOne(ProfilUser::class, 'profileable');
    }

    /**
     * Dynamic identity.
     */
    public function getIdentityAttribute(): string
    {
        return "{$this->nim} - {$this->nama}";
    }

    /**
     * Unified address accessor.
     */
    public function getAddressAttribute(): ?string
    {
        return $this->user?->address ?? $this->attributes['alamat'] ?? null;
    }

    /**
     * Dynamic completeness calculation.
     * PREVENT N+1: Only checks loaded relations.
     */
    public function getProfileCompletionAttribute(): int
    {
        $fields = ['nik', 'mother_name', 'birth_date', 'health_certificate_path', 'parent_permission_path'];
        $filled = collect($fields)->filter(fn ($f) => ! empty($this->{$f}))->count();

        $hasPhone = $this->relationLoaded('user') && ! empty($this->user?->phone);
        if ($hasPhone) {
            $filled++;
        }

        $totalFields = count($fields) + ($this->relationLoaded('user') ? 1 : 0);

        return $totalFields > 0 ? (int) (($filled / $totalFields) * 100) : 0;
    }
}
