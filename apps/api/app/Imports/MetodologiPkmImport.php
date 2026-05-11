<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Dosen;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

class MetodologiPkmImport implements ToCollection, WithStartRow
{
    public int $matchedCount = 0;

    public int $unmatchedCount = 0;

    public int $createdWorkshopCount = 0;

    public int $skippedCount = 0;

    public array $errors = [];

    public array $unmatchedDetails = [];

    public array $matchedDetails = [];

    private const THRESHOLD = 50;

    public function startRow(): int
    {
        return 3;
    }

    public function collection(Collection $rows): void
    {
        $dosenCache = Dosen::select('id', 'nama', 'user_id')->get();

        foreach ($rows as $index => $row) {
            $rowArray = is_array($row) ? $row : $row->toArray();

            if (count($rowArray) < 6) {
                $this->skippedCount++;

                continue;
            }

            $no = isset($rowArray[0]) ? trim((string) $rowArray[0]) : '';
            $nama = isset($rowArray[1]) ? trim((string) $rowArray[1]) : '';

            if (empty($no) || empty($nama)) {
                $this->skippedCount++;

                continue;
            }

            $jabatan = isset($rowArray[2]) ? trim((string) $rowArray[2]) : '';
            $nomorDokumen = isset($rowArray[3]) ? trim((string) $rowArray[3]) : '';
            $jenis_kegiatAN = isset($rowArray[4]) ? trim((string) $rowArray[4]) : '';
            $tahunRaw = $rowArray[5] ?? null;
            $tahun = is_numeric($tahunRaw) ? (int) $tahunRaw : 0;

            if ($tahun < 2020 || $tahun > 2030) {
                $this->skippedCount++;

                continue;
            }

            $workshop = $this->findOrCreateWorkshop($jenis_kegiatAN, $tahun);
            if (! $workshop) {
                $this->errors[] = "Gagal membuat workshop untuk {$jenis_kegiatAN} {$tahun}";

                continue;
            }

            $dosen = $this->findDosenFuzzy($nama, $dosenCache);

            if (! $dosen) {
                $this->unmatchedCount++;
                $this->unmatchedDetails[] = [
                    'nama_excel' => $nama,
                    'jabatan' => $jabatan,
                    'sk' => $nomorDokumen,
                    'jenis' => $jenis_kegiatAN,
                    'tahun' => $tahun,
                ];

                continue;
            }

            // Check if Dosen already attended a workshop (each Dosen only 1 workshop)
            if ($dosen->has_workshop) {
                $this->skippedCount++;
                $this->errors[] = "{$nama} sudah pernah mengikuti workshop sebelumnya";

                continue;
            }

            // Mark Dosen as having attended workshop
            $dosen->update([
                'has_workshop' => true,
                'workshop_date' => "{$tahun}-01-01",
            ]);

            // Also create PesertaWorkshop for history (optional - can skip if not needed)
            $exists = PesertaWorkshop::where('workshop_id', $workshop->id)
                ->where('user_id', $dosen->user_id)
                ->exists();

            if (! $exists) {
                PesertaWorkshop::create([
                    'workshop_id' => $workshop->id,
                    'user_id' => $dosen->user_id,
                    'jabatan_sk' => $jabatan ?: null,
                    'nomor_dokumen' => $nomorDokumen ?: null,
                    'registered_at' => now(),
                    'attendance_status' => 'attended',
                    'is_passed' => true,
                    'checked_in_at' => now(),
                    'certificate_generated' => false,
                ]);
            } else {
                // Update jabatan_sk dan nomor_dokumen jika sudah ada tapi belum terisi
                PesertaWorkshop::where('workshop_id', $workshop->id)
                    ->where('user_id', $dosen->user_id)
                    ->whereNull('jabatan_sk')
                    ->update([
                        'jabatan_sk' => $jabatan ?: null,
                        'nomor_dokumen' => $nomorDokumen ?: null,
                    ]);
            }

            $this->matchedCount++;
            $this->matchedDetails[] = [
                'nama_excel' => $nama,
                'nama_db' => $dosen->nama,
                'jabatan' => $jabatan,
                'jenis' => $jenis_kegiatAN,
                'tahun' => $tahun,
            ];
        }
    }

    private function findOrCreateWorkshop(string $jenis, int $tahun): ?Workshop
    {
        $key = "{$jenis}_{$tahun}";
        static $cache = [];

        if (isset($cache[$key])) {
            return $cache[$key];
        }

        $workshop = Workshop::where('title', 'like', "%{$jenis}%")
            ->whereRaw('DATE(workshop_date) = ?', ["{$tahun}-01-01"])
            ->first();

        if (! $workshop) {
            $workshop = Workshop::create([
                'periode_id' => null,
                'title' => "Metodologi PKM - {$jenis} ({$tahun})",
                'description' => "Workshop Metodologi PKM {$jenis} {$tahun}",
                'workshop_date' => "{$tahun}-01-01",
                'methodology' => $jenis,
                'location' => 'UIN Saizu',
                'max_participants' => 500,
                'is_active' => false,
                'registration_start' => "{$tahun}-01-01",
                'registration_end' => "{$tahun}-12-31",
            ]);
            $this->createdWorkshopCount++;
        }

        $cache[$key] = $workshop;

        return $workshop;
    }

    private function findDosenFuzzy(string $nama, $dosenCache): ?Dosen
    {
        $normalizedNama = $this->normalizeName($nama);
        $nameParts = $this->getNameParts($nama);

        // 1. Exact match
        foreach ($dosenCache as $dosen) {
            if (mb_strtolower(trim($dosen->nama), 'UTF-8') === mb_strtolower($nama, 'UTF-8')) {
                return $dosen;
            }
        }

        // 2. Normalized exact match
        foreach ($dosenCache as $dosen) {
            if ($this->normalizeName($dosen->nama) === $normalizedNama) {
                return $dosen;
            }
        }

        // 3. Core name match (first name + last name)
        if (! empty($nameParts['first']) && ! empty($nameParts['last'])) {
            foreach ($dosenCache as $dosen) {
                $dbParts = $this->getNameParts($dosen->nama);
                if (
                    ! empty($dbParts['first']) &&
                    mb_strtolower($nameParts['first']) === mb_strtolower($dbParts['first']) &&
                    mb_strtolower($nameParts['last']) === mb_strtolower($dbParts['last'])
                ) {
                    return $dosen;
                }
            }
        }

        // 4. Contains match (one contains the other, min 6 chars to avoid false positives)
        if (mb_strlen($normalizedNama) >= 6) {
            foreach ($dosenCache as $dosen) {
                $dbNormalized = $this->normalizeName($dosen->nama);
                if (mb_strlen($dbNormalized) >= 6) {
                    if (str_contains($dbNormalized, $normalizedNama) || str_contains($normalizedNama, $dbNormalized)) {
                        return $dosen;
                    }
                }
            }
        }

        // 5. Fuzzy match with percentage-based threshold
        $bestMatch = null;
        $bestScore = 0;
        foreach ($dosenCache as $dosen) {
            $dbNormalized = $this->normalizeName($dosen->nama);
            similar_text($normalizedNama, $dbNormalized, $percent);
            if ($percent > $bestScore) {
                $bestScore = $percent;
                $bestMatch = $dosen;
            }
        }
        if ($bestScore >= 75) {
            return $bestMatch;
        }

        // 6. Partial first name match (relaxed)
        if (! empty($nameParts['first']) && mb_strlen($nameParts['first']) >= 4) {
            foreach ($dosenCache as $dosen) {
                $dbParts = $this->getNameParts($dosen->nama);
                if (! empty($dbParts['first']) && mb_strtolower($nameParts['first']) === mb_strtolower($dbParts['first'])) {
                    // First name exact match — check if last name also partially matches
                    if (! empty($nameParts['last']) && ! empty($dbParts['last'])) {
                        $lastSim = 0;
                        similar_text(mb_strtolower($nameParts['last']), mb_strtolower($dbParts['last']), $lastSim);
                        if ($lastSim >= 60) {
                            return $dosen;
                        }
                    }
                }
            }
        }

        return null;
    }

    private function normalizeName(string $name): string
    {
        $normalized = mb_strtolower(trim($name), 'UTF-8');
        $normalized = preg_replace('/\s+/', ' ', $normalized);

        // Strip all academic titles/degrees aggressively using regex patterns
        // Matches: Prof., Dr., H., Hj., Ir., Drs., Dra., KH.
        $normalized = preg_replace('/\b(prof|dr|drs|dra|ir|kh|hj?)\b\.?/i', '', $normalized);
        // Matches: S.Pd.I., M.Ag., M.Hum., M.Pd., M.Si., M.A., M.E., M.Kom., etc.
        $normalized = preg_replace('/,?\s*[A-Z]\.?[a-z]*\.(?:[A-Z]\.?[a-z]*\.?)*/i', '', $normalized);
        // Matches: S1/S2/S3 degree patterns like S.Pd, S.E.Sy, M.Pharm.Sci, Lc
        $normalized = preg_replace('/\b(s\.?[a-z]+\.?[a-z]*\.?|m\.?[a-z]+\.?[a-z]*\.?|lc|ma|mma|sh|mh|st)\b\.?/i', '', $normalized);

        // Remove punctuation and extra spaces
        $normalized = preg_replace("/['.,\-]/", '', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized);

        return trim($normalized);
    }

    private function getNameParts(string $name): array
    {
        $normalized = $this->normalizeName($name);
        $parts = explode(' ', $normalized);
        $parts = array_filter($parts, fn ($p) => mb_strlen($p) > 1);

        return [
            'first' => $parts[0] ?? '',
            'last' => end($parts) ?: '',
            'all' => $parts,
        ];
    }
}
