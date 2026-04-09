<?php

namespace App\Services\KKN;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Enums\KknType;

class KknRequirementService
{
    private function resolveType(Periode $periode): KknType
    {
        $legacyJenis = strtolower(trim((string) ($periode->jenis instanceof KknType ? $periode->jenis->label() : $periode->jenis)));

        if (str_contains($legacyJenis, 'responsif')) {
            return KknType::RESPONSIF;
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
     * Based on Pedoman KKN Angkatan 56 Tahun 2025.
     */
    public function validate(Mahasiswa $mahasiswa, Periode $periode): array
    {
        $errors = [];
        $kknType = $this->resolveType($periode);

        // 1. GLOBAL REQUIREMENTS (Bab II)
        if (!$mahasiswa->is_bta_ppi_passed) {
            $errors[] = 'Anda harus lulus ujian BTA/PPI terlebih dahulu.';
        }

        // 2. SCHEMA SPECIFIC REQUIREMENTS
        switch ($kknType) {
            case KknType::REGULER:
            case KknType::KOLABORASI_PTKIN:
            case KknType::DESA_KATANA:
            case KknType::TEMATIK:
            case KknType::RESPONSIF:
                if ($mahasiswa->sks_completed < 100) {
                    $errors[] = 'Minimal harus menempuh 100 SKS untuk skema KKN ini.';
                }
                break;

            case KknType::NUSANTARA:
                if ($mahasiswa->sks_completed < 85) {
                    $errors[] = 'Minimal harus menempuh 85 SKS untuk KKN Nusantara.';
                }
                if ($mahasiswa->gpa < 3.25) {
                    $errors[] = 'Minimal IPK 3.25 untuk KKN Nusantara.';
                }
                break;

            case KknType::INTERNASIONAL:
                if ($mahasiswa->sks_completed < 100) {
                    $errors[] = 'Minimal harus menempuh 100 SKS untuk KKN Internasional.';
                }
                if ($mahasiswa->gpa < 3.25) {
                    $errors[] = 'Minimal IPK 3.25 untuk KKN Internasional.';
                }
                break;

            case KknType::KAMPUNG_ZAKAT:
                if ($mahasiswa->sks_completed < 100) {
                    $errors[] = 'Minimal harus menempuh 100 SKS untuk KKN Tematik Kampung Zakat.';
                }
                if (!$this->isMazawaStudent($mahasiswa)) {
                    $errors[] = 'KKN Tematik Kampung Zakat dikhususkan untuk mahasiswa Prodi Manajemen Zakat dan Wakaf (Mazawa).';
                }
                break;
        }

        return $errors;
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

        switch ($kknType) {
            case KknType::REGULER:
                $requirements[] = 'Minimal telah menempuh 100 SKS.';
                $governanceNotes[] = 'Mahasiswa dapat mengajukan pendaftaran mandiri pada portal KKN.';
                $governanceNotes[] = 'Penempatan reguler dilakukan otomatis oleh sistem dan tidak boleh berada pada kabupaten/kota domisili yang sama.';
                break;

            case KknType::NUSANTARA:
                $requirements[] = 'Minimal telah menempuh 85 SKS.';
                $requirements[] = 'Minimal IPK 3.25.';
                $requirements[] = 'Aktif berorganisasi (intra/ekstra) dibuktikan dengan SK.';
                $requirements[] = 'Diutamakan memiliki kemampuan menulis esai populer.';
                $governanceNotes[] = 'Program dikelola melalui seleksi khusus oleh LPPM/panitia sesuai juknis program.';
                $governanceNotes[] = 'Penempatan ditetapkan secara manual oleh panitia/admin.';
                break;

            case KknType::INTERNASIONAL:
                $requirements[] = 'Minimal telah menempuh 100 SKS.';
                $requirements[] = 'Minimal IPK 3.25.';
                $requirements[] = 'Menguasai Bahasa Inggris.';
                $requirements[] = 'Sehat jasmani rohani dan tidak sedang hamil/menyusui.';
                $governanceNotes[] = 'Mengikuti seleksi khusus dan kesiapan mitra di luar negeri.';
                break;

            case KknType::KOLABORASI_PTKIN:
                $requirements[] = 'Minimal telah menempuh 100 SKS.';
                $governanceNotes[] = 'Program kolaborasi mengikuti seleksi dan koordinasi bersama PTKIN mitra.';
                $governanceNotes[] = 'Penempatan peserta mengikuti keputusan PTKIN mitra.';
                break;
                
            case KknType::KAMPUNG_ZAKAT:
                $requirements[] = 'Minimal telah menempuh 100 SKS.';
                $requirements[] = 'Berstatus sebagai mahasiswa aktif Prodi Mazawa.';
                $governanceNotes[] = 'Fokus pada pemberdayaan masyarakat berbasis zakat, infak, dan sedekah.';
                break;

            case KknType::DESA_KATANA:
                $requirements[] = 'Minimal telah menempuh 100 SKS.';
                $governanceNotes[] = 'Fokus pada edukasi dan mitigasi kebencanaan (Kampung Tanggap Bencana).';
                break;

            default:
                $requirements[] = 'Minimal telah menempuh 100 SKS.';
                $governanceNotes[] = 'Program tematik usulan dosen atau responsif.';
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
        
        if (!$mahasiswa->prodi) return false;

        $name = strtolower($mahasiswa->prodi->nama);
        return str_contains($name, 'zakat') || str_contains($name, 'mazawa');
    }
}
