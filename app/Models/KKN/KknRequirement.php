<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KknRequirement extends Model
{

    protected $table = 'kkn_requirements';

    protected $fillable = [
        'name',
        'column_name',
        'operator',
        'expected_value',
        'error_message',
        'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    use HasFactory;

    // Explicitly define the connection if needed (as per KKN architecture)

    /**
     * Evaluates this requirement against a Mahasiswa instance.
     * Returns true if the student meets the requirement, false otherwise.
     */
    public function evaluate(Mahasiswa $mahasiswa): bool
    {
        // 1. Get the actual value from the student record
        $actualValue = $mahasiswa->getAttribute($this->column_name);

        // Fallbacks for legacy data compatibility
        if ($this->column_name === 'total_sks' && empty($actualValue)) {
            $actualValue = $mahasiswa->sks_completed;
        }
        if ($this->column_name === 'status_bta_ppi' && empty($actualValue)) {
            $actualValue = $mahasiswa->status_bta_ppi ?? 'BELUM_LULUS';
        }

        // Fallback for nulls (treat as 0 for numbers or empty string for text)
        if ($actualValue === null) {
            $actualValue = is_numeric($this->expected_value) ? 0 : '';
        }

        $expected = $this->expected_value;

        // 2. Compare based on the selected operator
        switch ($this->operator) {
            case '>=':
                return (float) $actualValue >= (float) $expected;
            case '<=':
                return (float) $actualValue <= (float) $expected;
            case '>':
                return (float) $actualValue > (float) $expected;
            case '<':
                return (float) $actualValue < (float) $expected;
            case '==':
            case '=':
                return (string) $actualValue === (string) $expected;
            case '!=':
            case '<>':
                return (string) $actualValue !== (string) $expected;
            case 'in':
                // Expected format: "LULUS, PASSED, TRUE"
                $allowedValues = array_map('trim', explode(',', strtoupper($expected)));

                return in_array(strtoupper((string) $actualValue), $allowedValues);
            case 'not_in':
                $disallowedValues = array_map('trim', explode(',', strtoupper($expected)));

                return ! in_array(strtoupper((string) $actualValue), $disallowedValues);
            default:
                return false; // Unknown operator implies failure
        }
    }
}
