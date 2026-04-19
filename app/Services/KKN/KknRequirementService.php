<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Enums\KknType;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Services\EligibilityService;

class KknRequirementService
{
    private function resolveType(Periode $periode): KknType
    {
        $legacyJenis = $periode->jenisKkn?->code ?? 'REGULER';

        if (str_contains($legacyJenis, 'responsif')) {
            return KknType::TEMATIK;
        }

        $governance = $periode->governance();

        return match ($governance['program_type'] ?? null) {
            Periode::PROGRAM_TYPE_NUSANTARA => KknType::NUSANTARA,
            Periode::PROGRAM_TYPE_INTERNASIONAL_MANDIRI => KknType::INTERNASIONAL,
            Periode::PROGRAM_TYPE_KOLABORASI_PTKIN => KknType::KOLABORASI_PTKIN,
            Periode::PROGRAM_TYPE_TEMATIK => match ($governance['program_subtype'] ?? null) {
                Periode::PROGRAM_SUBTYPE_KAMPUNG_ZAKAT => KknType::KAMPUNG_ZAKAT,
                Periode::PROGRAM_SUBTYPE_DESA_KATANA => KknType::DESA_KATANA,
                default => KknType::TEMATIK,
            },
            default => KknType::REGULER,
        };
    }

    /**
     * Validate if a student meets the requirements for a specific KKN period.
     * Delegates to centralized EligibilityService.
     */
    public function validate(Mahasiswa $mahasiswa, Periode $periode): array
    {
        $eligibility = app(EligibilityService::class)->checkEligibility($mahasiswa, $periode->id);

        return array_map(function ($issue) {
            return $issue['message'].(! empty($issue['reason']) ? " ({$issue['reason']})" : '');
        }, $eligibility['issues']);
    }

    /**
     * @return array{
     *   program_label:string,
     *   requirements:array<int, string>,
     *   governance_notes:array<int, string>
     * }
     */
    public function describe(Periode $periode): array
    {
        $governance = $periode->governance();
        $kknType = $this->resolveType($periode);

        $requirements = ['Lulus ujian BTA/PPI.'];
        $governanceNotes = [];

        // Dynamic Requirement Lines
        $minSks = $periode->jenisKkn?->min_sks ?? 100;
        $minGpa = $periode->jenisKkn ? (float) $periode->jenisKkn->min_gpa : 0;

        $requirements[] = "Minimal telah menempuh {$minSks} SKS.";
        if ($minGpa > 0) {
            $requirements[] = 'Minimal IPK '.number_format($minGpa, 2).'.';
        }

        if ($periode->jenisKkn?->description) {
            $governanceNotes[] = $periode->jenisKkn->description;
        }

        $governanceNotes[] = 'Pendaftaran: '.($governance['registration_mode_label'] ?? 'Standar');
        $governanceNotes[] = 'Penempatan: '.($governance['placement_mode_label'] ?? 'Standar');

        // Specific legacy logic for certain types
        switch ($kknType) {
            case KknType::NUSANTARA:
                $requirements[] = 'Berstatus Belum Menikah.';
                $requirements[] = 'Aktif berorganisasi (intra/ekstra).';
                break;
            case KknType::INTERNASIONAL:
                $requirements[] = 'Berstatus Belum Menikah dan Tidak Sedang Hamil/Menyusui.';
                $requirements[] = 'Memiliki Paspor aktif.';
                break;
        }

        return [
            'program_label' => $governance['jenis_label'] ?? $kknType->label(),
            'requirements' => $requirements,
            'governance_notes' => $governanceNotes,
        ];
    }

    /**
     * Check if the student belongs to the Mazawa study program.
     */
    private function isMazawaStudent(Mahasiswa $mahasiswa): bool
    {
        $mahasiswa->loadMissing('prodi');

        if (! $mahasiswa->prodi) {
            return false;
        }

        $name = strtolower($mahasiswa->prodi->nama);

        return str_contains($name, 'zakat') || str_contains($name, 'mazawa');
    }
}
