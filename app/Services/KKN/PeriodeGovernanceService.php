<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Enums\KknType;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Periode;

/**
 * Service for handling Periode governance logic.
 * Extracted from Periode model to reduce model bloat.
 */
class PeriodeGovernanceService
{
    public static function blueprintFromJenisKkn(JenisKkn $jenisKkn): array
    {
        $jenisEnum = self::resolveJenisEnumFromCode($jenisKkn->code);

        return [
            'program_type' => self::mapCodeToProgramType($jenisKkn->code),
            'program_subtype' => self::mapCodeToProgramSubtype($jenisKkn->code),
            'registration_mode' => $jenisKkn->registration_mode,
            'placement_mode' => $jenisKkn->placement_mode,
            'jenis_enum' => $jenisEnum,
            'jenis_value' => $jenisKkn->code,
            'jenis_label' => $jenisEnum->label(),
            'program_type_label' => $jenisEnum->label(),
            'program_subtype_label' => null,
            'registration_mode_label' => $jenisKkn->registrationModeLabel(),
            'placement_mode_label' => $jenisKkn->placementModeLabel(),
            'self_service_enabled' => $jenisKkn->registration_mode === Periode::REGISTRATION_MODE_OPEN
                && $jenisKkn->placement_mode === Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
        ];
    }

    private static function mapCodeToProgramType(string $code): string
    {
        return match ($code) {
            'NUSANTARA' => Periode::PROGRAM_TYPE_NUSANTARA,
            'INTERNASIONAL' => Periode::PROGRAM_TYPE_INTERNASIONAL_MANDIRI,
            'KOLABORASI_PTKIN' => Periode::PROGRAM_TYPE_KOLABORASI_PTKIN,
            'KAMPUNG_ZAKAT', 'DESA_KATANA', 'TEMATIK', 'RESPONSIF' => Periode::PROGRAM_TYPE_TEMATIK,
            default => Periode::PROGRAM_TYPE_REGULER,
        };
    }

    private static function mapCodeToProgramSubtype(?string $code): ?string
    {
        return match ($code) {
            'KAMPUNG_ZAKAT' => Periode::PROGRAM_SUBTYPE_KAMPUNG_ZAKAT,
            'DESA_KATANA' => Periode::PROGRAM_SUBTYPE_DESA_KATANA,
            default => null,
        };
    }

    private static function resolveJenisEnumFromCode(string $code): KknType
    {
        return match ($code) {
            'NUSANTARA' => KknType::NUSANTARA,
            'INTERNASIONAL' => KknType::INTERNASIONAL,
            'KOLABORASI_PTKIN' => KknType::KOLABORASI_PTKIN,
            'KAMPUNG_ZAKAT' => KknType::KAMPUNG_ZAKAT,
            'DESA_KATANA' => KknType::DESA_KATANA,
            'TEMATIK' => KknType::TEMATIK,
            'RESPONSIF' => KknType::TEMATIK, // Normalize legacy to thematic
            default => KknType::REGULER,
        };
    }

    /**
     * Get governance blueprint for a period configuration.
     *
     * @deprecated - Use blueprintFromJenisKkn instead
     */
    public static function blueprint(
        ?string $programType = null,
        ?string $programSubtype = null,
        KknType|string|null $legacyJenis = null,
        ?JenisKkn $jenisKkn = null
    ): array {
        $resolvedProgramType = self::normalizeProgramType($programType, $legacyJenis);
        $resolvedProgramSubtype = self::normalizeProgramSubtype($resolvedProgramType, $programSubtype, $legacyJenis);

        // Prioritas 1: Gunakan data dari Master Data (JenisKkn)
        if ($jenisKkn) {
            $registrationMode = $jenisKkn->registration_mode;
            $placementMode = $jenisKkn->placement_mode;

            return [
                'program_type' => $resolvedProgramType,
                'program_subtype' => $resolvedProgramSubtype,
                'registration_mode' => $registrationMode,
                'placement_mode' => $placementMode,
                'jenis_enum' => self::resolveJenisEnum($resolvedProgramType, $resolvedProgramSubtype, $legacyJenis),
                'jenis_value' => $jenisKkn->code,
                'jenis_label' => $jenisKkn->name,
                'program_type_label' => $jenisKkn->name,
                'program_subtype_label' => null,
                'registration_mode_label' => $jenisKkn->registrationModeLabel(),
                'placement_mode_label' => $jenisKkn->placementModeLabel(),
                'self_service_enabled' => $registrationMode === Periode::REGISTRATION_MODE_OPEN
                    && $placementMode === Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
            ];
        }

        // Prioritas 2: Fallback ke sistem Enum lama
        $jenisEnum = self::resolveJenisEnum($resolvedProgramType, $resolvedProgramSubtype, $legacyJenis);
        $registrationMode = $jenisEnum->registrationMode();
        $placementMode = $jenisEnum->placementMode();

        return [
            'program_type' => $resolvedProgramType,
            'program_subtype' => $resolvedProgramSubtype,
            'registration_mode' => $registrationMode,
            'placement_mode' => $placementMode,
            'jenis_enum' => $jenisEnum,
            'jenis_value' => $jenisEnum->value,
            'jenis_label' => $jenisEnum->label(),
            'program_type_label' => Periode::programTypeOptions()[$resolvedProgramType] ?? $jenisEnum->label(),
            'program_subtype_label' => $resolvedProgramSubtype
                ? (Periode::programSubtypeOptions()[$resolvedProgramSubtype] ?? $resolvedProgramSubtype)
                : null,
            'registration_mode_label' => Periode::registrationModeLabels()[$registrationMode] ?? $registrationMode,
            'placement_mode_label' => Periode::placementModeLabels()[$placementMode] ?? $placementMode,
            'self_service_enabled' => $registrationMode === Periode::REGISTRATION_MODE_OPEN
                && $placementMode === Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
        ];
    }

    /**
     * Normalize program type from legacy jenis.
     */
    public static function normalizeProgramType(?string $programType, KknType|string|null $legacyJenis = null): string
    {
        $programType = strtolower(trim((string) $programType));

        if (array_key_exists($programType, Periode::programTypeOptions())) {
            return $programType;
        }

        return match (self::inferLegacyJenisEnum($legacyJenis)) {
            KknType::NUSANTARA => Periode::PROGRAM_TYPE_NUSANTARA,
            KknType::INTERNASIONAL => Periode::PROGRAM_TYPE_INTERNASIONAL_MANDIRI,
            KknType::KOLABORASI_PTKIN => Periode::PROGRAM_TYPE_KOLABORASI_PTKIN,
            KknType::TEMATIK,
            KknType::RESPONSIF,
            KknType::KAMPUNG_ZAKAT,
            KknType::DESA_KATANA => Periode::PROGRAM_TYPE_TEMATIK,
            default => Periode::PROGRAM_TYPE_REGULER,
        };
    }

    /**
     * Normalize program subtype from legacy jenis.
     */
    public static function normalizeProgramSubtype(
        ?string $programType,
        ?string $programSubtype,
        KknType|string|null $legacyJenis = null
    ): ?string {
        if ($programType !== Periode::PROGRAM_TYPE_TEMATIK) {
            return null;
        }

        $programSubtype = strtolower(trim((string) $programSubtype));
        if ($programSubtype !== '' && array_key_exists($programSubtype, Periode::programSubtypeOptions())) {
            return $programSubtype;
        }

        return match (self::inferLegacyJenisEnum($legacyJenis)) {
            KknType::KAMPUNG_ZAKAT => Periode::PROGRAM_SUBTYPE_KAMPUNG_ZAKAT,
            KknType::DESA_KATANA => Periode::PROGRAM_SUBTYPE_DESA_KATANA,
            default => null,
        };
    }

    /**
     * Resolve jenis enum from program type/subtype.
     */
    public static function resolveJenisEnum(
        ?string $programType,
        ?string $programSubtype,
        KknType|string|null $legacyJenis = null
    ): KknType {
        $legacyEnum = self::inferLegacyJenisEnum($legacyJenis);

        return match ($programType) {
            Periode::PROGRAM_TYPE_NUSANTARA => KknType::NUSANTARA,
            Periode::PROGRAM_TYPE_INTERNASIONAL_MANDIRI => KknType::INTERNASIONAL,
            Periode::PROGRAM_TYPE_KOLABORASI_PTKIN => KknType::KOLABORASI_PTKIN,
            Periode::PROGRAM_TYPE_TEMATIK => match ($programSubtype) {
                Periode::PROGRAM_SUBTYPE_KAMPUNG_ZAKAT => KknType::KAMPUNG_ZAKAT,
                Periode::PROGRAM_SUBTYPE_DESA_KATANA => KknType::DESA_KATANA,
                default => KknType::TEMATIK,
            },
            default => KknType::REGULER,
        };
    }

    /**
     * Apply governance defaults to a period model before saving.
     */
    public static function applyGovernanceToModel(Periode $period): void
    {
        $jenisKkn = $period->jenisKkn;

        // If jenis_kkn_id was changed but relation not loaded, try to load it
        if (! $jenisKkn && $period->isDirty('jenis_kkn_id') && $period->jenis_kkn_id) {
            $jenisKkn = JenisKkn::find($period->jenis_kkn_id);
        }

        if (! $jenisKkn) {
            return;
        }

        $blueprint = self::blueprintFromJenisKkn($jenisKkn);

        // Sync attributes that might exist in the periode table
        $period->jenis = $blueprint['jenis_enum'];
        $period->program_type = $blueprint['program_type'];
        $period->program_subtype = $blueprint['program_subtype'];
        $period->registration_mode = $blueprint['registration_mode'];
        $period->placement_mode = $blueprint['placement_mode'];
    }

    /**
     * Infer KknType enum from legacy jenis value.
     */
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
