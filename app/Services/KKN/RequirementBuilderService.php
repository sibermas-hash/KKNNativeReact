<?php

declare(strict_types=1);

namespace App\Services\KKN;

class RequirementBuilderService
{
    /**
     * Allowed db_check fields that can be auto-validated.
     */
    public const ALLOWED_DB_FIELDS = [
        'sks_completed',
        'gpa',
        'status_bta_ppi',
        'is_paid_ukt',
        'semester',
        'health_certificate_path',
        'parent_permission_path',
    ];

    /**
     * Validate requirements_config structure from Admin Builder.
     * Expected format:
     * [
     *   {"name": "Minimal SKS", "type": "db_check", "field": "sks_completed", "min_value": 100},
     *   {"name": "Lulus BTA-PPI", "type": "db_check", "field": "status_bta_ppi", "expected_value": "LULUS"},
     *   {"name": "Surat Keterangan Sehat", "type": "upload"}
     * ]
     *
     * @throws \InvalidArgumentException
     */
    public static function validateRequirementsConfig(array $config): void
    {
        foreach ($config as $index => $rule) {
            if (! is_array($rule)) {
                throw new \InvalidArgumentException("Rule #{$index} harus berupa array.");
            }

            if (empty($rule['name'])) {
                throw new \InvalidArgumentException("Rule #{$index} harus memiliki nama.");
            }

            $type = $rule['type'] ?? 'upload';
            if (! in_array($type, ['db_check', 'upload'], true)) {
                throw new \InvalidArgumentException("Rule #{$index}: tipe '{$type}' tidak valid. Gunakan 'db_check' atau 'upload'.");
            }

            if ($type === 'db_check' && ! empty($rule['field'])) {
                if (! in_array($rule['field'], self::ALLOWED_DB_FIELDS, true)) {
                    throw new \InvalidArgumentException(
                        "Rule #{$index}: field '{$rule['field']}' tidak diizinkan untuk db_check."
                    );
                }
            }
        }
    }

    /**
     * Legacy alias for backward compatibility.
     */
    public static function validateConfig(array $config): bool
    {
        try {
            self::validateRequirementsConfig($config);

            return true;
        } catch (\InvalidArgumentException) {
            return false;
        }
    }
}
