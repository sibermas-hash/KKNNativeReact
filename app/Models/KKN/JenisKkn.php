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
        'min_sks',
        'min_gpa',
        'require_not_married',
        'require_parent_permission',
        'require_health_certificate',
        'specific_prodi_ids',
        'require_bta_ppi',
        'color',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_gpa' => 'decimal:2',
        'require_not_married' => 'boolean',
        'require_parent_permission' => 'boolean',
        'require_health_certificate' => 'boolean',
        'require_bta_ppi' => 'boolean',
        'specific_prodi_ids' => 'array',
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
            default => $this->placement_mode,
        };
    }

    // ─── Relations ──────────────────────────────────────

    public function periodes(): HasMany
    {
        return $this->hasMany(Periode::class, 'jenis_kkn_id');
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
            ])
            ->toArray();
    }
}
