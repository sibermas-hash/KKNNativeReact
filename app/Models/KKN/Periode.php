<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Enums\KknType;
use App\Services\KKN\PeriodeGovernanceService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Periode extends Model
{

    use HasFactory, SoftDeletes;

    protected $table = 'periode';

    protected $connection = 'kkn';

    protected $fillable = [
        'academic_year_id',
        'jenis_kkn_id',
        'periode',
        'jenis',
        'program_type',
        'program_subtype',
        'registration_mode',
        'placement_mode',
        'name',
        'start_date',
        'end_date',
        'registration_start',
        'registration_end',
        'kuota',
        'is_active',
        'grading_start',
        'grading_end',
        'current_phase',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'registration_start' => 'date',
            'registration_end' => 'date',
            'grading_start' => 'date',
            'grading_end' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public const PROGRAM_TYPE_REGULER = 'reguler';

    public const PROGRAM_TYPE_NUSANTARA = 'nusantara';

    public const PROGRAM_TYPE_INTERNASIONAL_MANDIRI = 'internasional_mandiri';

    public const PROGRAM_TYPE_KOLABORASI_PTKIN = 'kolaborasi_ptkin';

    public const PROGRAM_TYPE_TEMATIK = 'tematik';

    public const PROGRAM_SUBTYPE_KAMPUNG_ZAKAT = 'kampung_zakat';

    public const PROGRAM_SUBTYPE_DESA_KATANA = 'desa_katana';

    public const REGISTRATION_MODE_OPEN = 'open';

    public const REGISTRATION_MODE_SELECTIVE = 'selective';

    public const REGISTRATION_MODE_PROPOSAL_BASED = 'proposal_based';

    public const PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL = 'automatic_after_approval';

    public const PLACEMENT_MODE_MANUAL_ADMIN = 'manual_admin';

    public const PLACEMENT_MODE_HOST_DEFINED = 'host_defined';

    public const PLACEMENT_MODE_PROPOSAL_DEFINED = 'proposal_defined';

    private const CACHE_KEYS = [
        'active_period',
        'default_period_id',
        'available_periods',
    ];

    public static function programTypeOptions(): array
    {
        return [
            self::PROGRAM_TYPE_REGULER => 'KKN Reguler',
            self::PROGRAM_TYPE_NUSANTARA => 'KKN Nusantara',
            self::PROGRAM_TYPE_INTERNASIONAL_MANDIRI => 'KKN Terpadu Internasional Mandiri',
            self::PROGRAM_TYPE_KOLABORASI_PTKIN => 'KKN Kolaborasi PTKIN',
            self::PROGRAM_TYPE_TEMATIK => 'KKN Tematik',
        ];
    }

    public static function programTypeDescriptions(): array
    {
        return [
            self::PROGRAM_TYPE_REGULER => 'Pendaftaran mandiri untuk mahasiswa yang memenuhi syarat umum KKN reguler.',
            self::PROGRAM_TYPE_NUSANTARA => 'Program khusus lintas daerah yang mengikuti seleksi dan penetapan peserta oleh panitia/LPPM.',
            self::PROGRAM_TYPE_INTERNASIONAL_MANDIRI => 'Program internasional berbasis kerja sama mitra luar negeri dengan seleksi khusus.',
            self::PROGRAM_TYPE_KOLABORASI_PTKIN => 'Program kolaborasi antar-PTKIN yang dikelola bersama mitra dan panitia.',
            self::PROGRAM_TYPE_TEMATIK => 'Program berbasis tema atau proposal pengabdian dengan penempatan mengikuti desain program.',
        ];
    }

    public static function programSubtypeOptions(): array
    {
        return [
            self::PROGRAM_SUBTYPE_KAMPUNG_ZAKAT => 'Tematik Kampung Zakat',
            self::PROGRAM_SUBTYPE_DESA_KATANA => 'Tematik Desa Katana',
        ];
    }

    public static function programSubtypeDescriptions(): array
    {
        return [
            self::PROGRAM_SUBTYPE_KAMPUNG_ZAKAT => 'Subtema KKN Tematik untuk pemberdayaan masyarakat berbasis zakat.',
            self::PROGRAM_SUBTYPE_DESA_KATANA => 'Subtema KKN Tematik untuk edukasi dan mitigasi kebencanaan.',
        ];
    }

    public static function registrationModeLabels(): array
    {
        return [
            self::REGISTRATION_MODE_OPEN => 'Pendaftaran terbuka mandiri',
            self::REGISTRATION_MODE_SELECTIVE => 'Seleksi khusus oleh panitia/LPPM',
            self::REGISTRATION_MODE_PROPOSAL_BASED => 'Berbasis proposal/program dosen',
        ];
    }

    public static function placementModeLabels(): array
    {
        return [
            self::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL => 'Otomatis oleh sistem setelah admin menyetujui',
            self::PLACEMENT_MODE_MANUAL_ADMIN => 'Penempatan manual oleh admin/LPPM',
            self::PLACEMENT_MODE_HOST_DEFINED => 'Penempatan ditentukan oleh mitra/host',
            self::PLACEMENT_MODE_PROPOSAL_DEFINED => 'Penempatan mengikuti desain proposal/program',
        ];
    }

    public function getJenisAttribute(mixed $value): mixed
    {
        if ($this->jenisKkn) {
            return $this->jenisKkn->code;
        }

        if ($value === null || $value === '') {
            return null;
        }

        return PeriodeGovernanceService::resolveJenisEnum($this->program_type, $this->program_subtype, $value);
    }

    public function setJenisAttribute(KknType|string|null $value): void
    {
        if ($value === null || $value === '') {
            $this->attributes['jenis'] = null;

            return;
        }

        $this->attributes['jenis'] = PeriodeGovernanceService::resolveJenisEnum($this->program_type, $this->program_subtype, $value)->value;
    }

    public function governance(): array
    {
        return PeriodeGovernanceService::blueprint(
            $this->program_type,
            $this->program_subtype,
            $this->attributes['jenis'] ?? 'REGULER',
            $this->jenisKkn,
        );
    }

    public function usesSelfServiceRegistration(): bool
    {
        return (bool) ($this->governance()['self_service_enabled'] ?? false);
    }

    public function usesAutomaticPlacementAfterApproval(): bool
    {
        return ($this->governance()['placement_mode'] ?? null) === self::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL;
    }

    public static function getActivePeriod(): ?self
    {
        return Cache::remember('active_period', now()->addHours(24), function () {
            return self::where('is_active', true)->first();
        });
    }

    public static function flushContextCache(): void
    {
        foreach (self::CACHE_KEYS as $cacheKey) {
            Cache::forget($cacheKey);
        }
    }

    protected static function booted(): void
    {
        static::saving(function (self $period) {
            PeriodeGovernanceService::applyGovernanceToModel($period);
        });

        static::saved(fn () => self::flushContextCache());
        static::deleted(fn () => self::flushContextCache());
    }

    public function tahunAkademik(): BelongsTo
    {
        return $this->belongsTo(TahunAkademik::class, 'academic_year_id');
    }

    public function jenisKkn(): BelongsTo
    {
        return $this->belongsTo(JenisKkn::class, 'jenis_kkn_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'period_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'period_id');
    }

    public function dplPeriods(): HasMany
    {
        return $this->hasMany(DplPeriod::class, 'period_id');
    }

    public function dplKecamatanAssignments(): HasMany
    {
        return $this->hasMany(DplKecamatanAssignment::class, 'period_id');
    }

    private static function inferLegacyJenisEnum(KknType|string|null $legacyJenis = null): KknType
    {
        if ($legacyJenis instanceof KknType) {
            return $legacyJenis;
        }

        if (is_string($legacyJenis) && $legacyJenis !== '') {
            $enum = KknType::tryFrom($legacyJenis);
            if ($enum instanceof KknType) {
                return $enum;
            }

            $normalized = strtolower(trim($legacyJenis));

            return match (true) {
                str_contains($normalized, 'nusantara') => KknType::NUSANTARA,
                str_contains($normalized, 'internasional') => KknType::INTERNASIONAL,
                str_contains($normalized, 'kolaborasi') && str_contains($normalized, 'ptkin') => KknType::KOLABORASI_PTKIN,
                str_contains($normalized, 'responsif') => KknType::RESPONSIF,
                str_contains($normalized, 'kampung zakat') => KknType::KAMPUNG_ZAKAT,
                str_contains($normalized, 'desa katana') => KknType::DESA_KATANA,
                str_contains($normalized, 'tematik') => KknType::TEMATIK,
                default => KknType::REGULER,
            };
        }

        return KknType::REGULER;
    }
}
