<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\SystemSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AutomaticGroupPlacementService
{
    public const NO_ELIGIBLE_GROUP_MESSAGE = 'Sistem belum menemukan kelompok yang tersedia di luar kabupaten asal Anda. Hubungi admin LPPM untuk penempatan manual.';

    /**
     * Default candidate pool size for auto-placement.
     * Configurable via SystemSetting 'auto_placement_candidate_limit'.
     * Audit R9-R01 fix: sebelumnya unbounded cursor iterate — untuk periode
     * dengan ratusan kelompok + ribuan mahasiswa approve bersamaan, worst
     * case bisa scan semua + lockForUpdate per candidate.
     * LIMIT 100 adalah sweet spot untuk 99% real distribusi (student biasanya
     * match di top-10 candidates setelah ORDER BY capacity ASC + preference).
     */
    private const DEFAULT_CANDIDATE_LIMIT = 100;

    public function __construct(
        private readonly GroupSelectionService $groupSelectionService,
    ) {}

    public function selectGroupForStudent(Mahasiswa $mahasiswa, int $periodId): KelompokKkn
    {
        $mahasiswa->loadMissing('user');

        $addressRegency = $this->normalizeAdministrativeName($mahasiswa->user?->address_regency_name);
        if (blank($addressRegency)) {
            throw ValidationException::withMessages([
                'periode_id' => 'Kabupaten alamat asli mahasiswa belum diisi. Lengkapi dan verifikasi alamat asli terlebih dahulu di profil.',
            ]);
        }

        $candidateLimit = (int) SystemSetting::get(
            'auto_placement_candidate_limit',
            (string) self::DEFAULT_CANDIDATE_LIMIT,
        );
        $candidateLimit = max(10, min(500, $candidateLimit));

        $candidates = KelompokKkn::query()
            ->with([
                'lokasi:id,regency_name,district_name,village_name',
                'slotTerkunci.fakultas',
                'slotTerkunci.prodi',
                'periode.jenisKkn:id,name,allowed_regencies',
            ])
            ->withCount([
                'peserta as active_participants_count' => function ($query) {
                    $query->whereIn('status', GroupSelectionService::activeRegistrationStatuses());
                },
            ])
            ->where('periode_id', $periodId)
            ->where('status', 'active')
            ->whereHas('lokasi', function ($query) use ($addressRegency) {
                $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $addressRegency);
                $query->whereNotNull('regency_name')
                    ->whereRaw('LOWER(regency_name) NOT LIKE ?', ['%'.$escaped.'%']);
            })
            ->where(function ($query) {
                $query->selectRaw('count(*)')
                    ->from('peserta_kkn')
                    ->whereColumn('peserta_kkn.kelompok_id', 'kelompok_kkn.id')
                    ->whereIn('status', GroupSelectionService::activeRegistrationStatuses());
            }, '<', DB::raw('kelompok_kkn.capacity'))
            ->orderBy('active_participants_count')
            ->orderByDesc('capacity')
            ->orderBy('id')
            ->limit($candidateLimit);

        $lastValidationException = null;
        $attempted = 0;
        $quickSkipped = 0;

        foreach ($candidates->cursor() as $group) {
            $attempted++;

            // Audit R9-R01 optimization: in-memory quick pre-check untuk
            // candidate yang obviously fail, supaya tidak memicu query
            // lockForUpdate yang mahal di validateGroupAcceptance.
            //
            // Checks yang bisa dilakukan in-memory (tanpa DB hit tambahan):
            //   - allowed_regencies whitelist (JenisKkn config)
            //   - capacity plausibility (count vs capacity)
            //
            // Checks yang tetap harus locked (race condition matter):
            //   - exact capacity snapshot (race dengan concurrent approval)
            //   - slot terkunci rules + gender quota (matters at seat boundary)
            if (! $this->quickEligibilityCheck($group, $mahasiswa)) {
                $quickSkipped++;
                continue;
            }

            try {
                $this->groupSelectionService->validateGroupAcceptance($group, $mahasiswa);

                if ($attempted > 50) {
                    // Metric: candidate butuh banyak attempt → indikasi
                    // konfigurasi kelompok tidak optimal (too many slot
                    // restrictions, not enough capacity, dll).
                    Log::info('AutomaticGroupPlacementService: high-attempt success', [
                        'mahasiswa_id' => $mahasiswa->id,
                        'periode_id' => $periodId,
                        'attempted' => $attempted,
                        'quick_skipped' => $quickSkipped,
                        'matched_group' => $group->id,
                    ]);
                }

                return $group;
            } catch (ValidationException $exception) {
                $lastValidationException = $exception;
                continue;
            }
        }

        // No candidate found dalam pool. Log metric untuk admin investigation.
        Log::warning('AutomaticGroupPlacementService: no eligible group in candidate pool', [
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $periodId,
            'attempted' => $attempted,
            'quick_skipped' => $quickSkipped,
            'candidate_limit' => $candidateLimit,
            'hometown_regency' => $addressRegency,
        ]);

        if ($lastValidationException) {
            throw $lastValidationException;
        }

        throw ValidationException::withMessages([
            'periode_id' => self::NO_ELIGIBLE_GROUP_MESSAGE,
        ]);
    }

    /**
     * Fast in-memory check before expensive locked validation.
     * Return true kalau candidate POTENSIAL layak — final lock still needed.
     */
    private function quickEligibilityCheck(KelompokKkn $group, Mahasiswa $mahasiswa): bool
    {
        // Allowed regencies whitelist
        $allowedRegencies = $group->periode?->jenisKkn?->allowed_regencies;
        if (is_array($allowedRegencies) && $allowedRegencies !== []) {
            $groupRegency = strtolower(trim((string) ($group->lokasi?->regency_name ?? '')));
            $allowedNorm = array_map(fn ($r) => strtolower(trim((string) $r)), $allowedRegencies);
            if ($groupRegency === '' || ! in_array($groupRegency, $allowedNorm, true)) {
                return false;
            }
        }

        // Capacity shortcut (race-safe: final check still in locked path).
        // `active_participants_count` from withCount snapshot; may be stale
        // by a few seats at high concurrency but sufficient for quick skip.
        if ((int) $group->active_participants_count >= (int) $group->capacity) {
            return false;
        }

        return true;
    }

    /**
     * Normalize administrative name for anti-hometown matching.
     *
     * Audit R9-R04 fix: regex sebelumnya `(kabupaten|kab\.|kota)` gagal match
     * varian umum:
     *   - "Kab Banyumas" (tanpa titik)
     *   - "Kotamadya Jakarta"
     *   - "Kab. Banyumas" dengan leading/trailing whitespace
     *   - "DKI Jakarta" ↔ "Jakarta" (prefix administratif)
     *   - "kec." / "kecamatan" kalau unit district ikut masuk
     *
     * Strategi:
     *   1. Lowercase + normalize Unicode.
     *   2. Ganti semua titik & separator dengan spasi (supaya `kab.`
     *      terdeteksi sebagai token `kab`).
     *   3. Strip prefix administratif dengan pattern word-boundary
     *      menggunakan alternation lengkap.
     *   4. Collapse whitespace.
     *
     * Hasil deterministik untuk comparison hometown vs regency kelompok.
     */
    private function normalizeAdministrativeName(?string $value): string
    {
        if (blank($value)) {
            return '';
        }

        return Str::of($value)
            ->lower()
            // Non-letter/digit → spasi. Ini juga strip titik, koma, dll.
            ->replaceMatches('/[^a-z0-9]+/u', ' ')
            // Strip prefix administratif di word-boundary. Order: yang
            // lebih panjang dulu (kotamadya, kabupaten) supaya pattern
            // pendek tidak gobble sebelum pattern panjang ter-match.
            ->replaceMatches(
                '/\b(kotamadya|kabupaten|kecamatan|kelurahan|desa|provinsi|prov|dki|kab|kota|kec|kel)\b/u',
                ' ',
            )
            // Pass ke-2 supaya residu pattern berdempetan ("kab kota") tercover.
            ->replaceMatches(
                '/\b(kotamadya|kabupaten|kecamatan|kelurahan|desa|provinsi|prov|dki|kab|kota|kec|kel)\b/u',
                ' ',
            )
            ->trim()
            ->squish()
            ->toString();
    }
}
