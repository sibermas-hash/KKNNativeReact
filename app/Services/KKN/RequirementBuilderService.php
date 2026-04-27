<?php

declare(strict_types=1);

namespace App\Services\KKN;

class RequirementBuilderService
{
    /**
     * Basic validation for requirements_config structure.
     * Expected format (example):
     * [
     *   {"key":"min_sks","type":"db_check","value":6},
     *   {"key":"bta_ppi","type":"db_check","value":true},
     *   {"key":"passport","type":"upload","label":"Paspor"}
     * ]
     */
    public static function validateConfig(array $config): bool
    {
        foreach ($config as $rule) {
            if (! is_array($rule)) return false;
            if (! array_key_exists('key', $rule) || ! array_key_exists('type', $rule)) {
                return false;
            }
            if (! in_array($rule['type'], ['db_check', 'upload', 'flag'])) {
                return false;
            }
        }
        return true;
    }
}
