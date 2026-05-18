<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisKkn extends Model
{
    use HasFactory;

    protected $table = 'jenis_kkn';

    protected $fillable = [
        'code',
        'name',
        'description',
        'registration_mode',
        'placement_mode',
        'requirements_config',
        'allowed_regencies',
        'color',
        'is_active',
        'sort_order',
        'attendance_config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requirements_config' => 'array',
        'allowed_regencies' => 'array',
        'attendance_config' => 'array',
    ];

    // ─── Label helpers ─────────────────────────────────

    public function registrationModeLabel(): string
    {
        return match ($this->registration_mode) {
            'open' => 'Pendaftaran Terbuka Mandiri',
            'selective' => 'Seleksi Khusus oleh Panitia/LPPM',
            'proposal_based' => 'Berbasis Proposal/Program Dosen',
            default => $this->registration_mode,
        };
    }

    public function placementModeLabel(): string
    {
        return match ($this->placement_mode) {
            'automatic_after_approval' => 'Otomatis oleh Sistem',
            'manual_admin' => 'Manual oleh Admin/LPPM',
            'host_defined' => 'Ditentukan oleh Mitra/Host',
            'proposal_defined' => 'Mengikuti Desain Proposal',
            'self_determined' => 'Mandiri (Mahasiswa Tentukan Lokasi)',
            default => $this->placement_mode,
        };
    }

    // ─── Relations ──────────────────────────────────────

    public function periodes(): HasMany
    {
        return $this->hasMany(Periode::class, 'jenis_kkn_id');
    }

    public function documentRequirements(): HasMany
    {
        return $this->hasMany(JenisKknDocumentRequirement::class, 'jenis_kkn_id')->orderBy('sort_order')->orderBy('id');
    }

    // ─── Scopes ─────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // ─── Options for dropdowns ──────────────────────────

    public static function dropdownOptions(): array
    {
        return static::active()->ordered()->get()
            ->map(fn ($j) => [
                'id' => $j->id,
                'value' => $j->code,
                'label' => $j->name,
                'description' => $j->description,
                'registration_mode' => $j->registration_mode,
                'placement_mode' => $j->placement_mode,
                'registration_mode_label' => $j->registrationModeLabel(),
                'placement_mode_label' => $j->placementModeLabel(),
                'attendance_config' => $j->getAttendanceConfig(),
            ])
            ->toArray();
    }

    // ─── Dynamic Attendance Config ──────────────────────────

    public function getAttendanceConfig(): array
    {
        $default = [
            'geofence_enabled' => true,
            'radius_meters' => 500,
            'location_source' => 'posko',
            'require_photo' => true,
            'allow_offline_sync' => true,
        ];

        return array_merge($default, $this->attendance_config ?? []);
    }

    public function isGeofenceEnabled(): bool
    {
        return $this->getAttendanceConfig()['geofence_enabled'] ?? true;
    }

    public function getAttendanceRadius(): int
    {
        return $this->getAttendanceConfig()['radius_meters'] ?? 500;
    }

    public function getLocationSource(): string
    {
        return $this->getAttendanceConfig()['location_source'] ?? 'posko';
    }

    public function isPhotoRequired(): bool
    {
        return $this->getAttendanceConfig()['require_photo'] ?? true;
    }

    // ─── Requirements Config Accessors ──────────────────
    // Audit REGULER-001/002 fix: seeder menulis min_sks, min_gpa, dll.
    // ke dalam kolom JSON `requirements_config`. EligibilityService
    // sebelumnya akses `$jenisKkn->min_sks` langsung — property ini tidak
    // ada di kolom/model, sehingga selalu null → service fallback ke
    // SystemSetting global. Jenis KKN jadi tidak punya effect pada
    // eligibility. Accessor berikut expose nilai dari JSON sebagai
    // property virtual supaya existing service code tetap bekerja.

    public function getMinSksAttribute(): ?int
    {
        $value = $this->requirements_config['min_sks'] ?? null;

        return $value !== null ? (int) $value : null;
    }

    public function getMinGpaAttribute(): ?float
    {
        $value = $this->requirements_config['min_gpa'] ?? null;

        return $value !== null ? (float) $value : null;
    }

    public function getRequireBtaPpiAttribute(): bool
    {
        // Default: wajib (REGULER expect), kecuali explicit di-set false di config.
        return (bool) ($this->requirements_config['require_bta_ppi'] ?? true);
    }

    public function getRequireNotMarriedAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_not_married'] ?? false);
    }

    public function getRequireParentPermissionAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_parent_permission'] ?? false);
    }

    public function getSpecificProdiIdsAttribute(): ?array
    {
        $value = $this->requirements_config['specific_prodi_ids'] ?? null;

        return is_array($value) && $value !== [] ? array_map('intval', $value) : null;
    }


    public function getMinSemesterAttribute(): ?int
    {
        $value = $this->requirements_config['min_semester'] ?? null;

        return $value !== null ? (int) $value : null;
    }

    public function getRequireHealthCertificateAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_health_cert'] ?? false);
    }

    public function getRequireAchievementCertificateAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_achievement_certificate'] ?? false);
    }

    public function getRequireModerationArticleAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_moderation_article'] ?? false);
    }

    public function getRequireOrganizationExperienceAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_organization_experience'] ?? false);
    }

    public function getRequireEnglishSkillAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_english_skill'] ?? false);
    }

    public function getRequireNationalCommitmentAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_national_commitment'] ?? false);
    }

    public function getRequireNotPregnantAttribute(): bool
    {
        return (bool) ($this->requirements_config['require_not_pregnant'] ?? false);
    }
}
