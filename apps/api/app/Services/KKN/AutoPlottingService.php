<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AutoPlottingService
{
    private const DEFAULT_REGENCIES = ['Pangandaran', 'Cilacap', 'Banyumas', 'Purbalingga', 'Kebumen', 'Banjarnegara'];

    public function simulate(int $periodeId, int $groupSize = 15): array
    {
        $periode = Periode::with('jenisKkn')->findOrFail($periodeId);
        $students = $this->students($periodeId);
        $locations = $this->locations($periode);

        if ($students === []) {
            return [
                'summary' => $this->summary([], [], [], $groupSize),
                'meta' => $this->meta([], $locations, $periode),
                'groups' => [],
                'unplaced' => [],
            ];
        }

        $groupsCount = (int) ceil(count($students) / $groupSize);
        $groups = $this->createGroupSlots($groupsCount, $locations, $groupSize);
        $students = $this->sortStudentsByDifficulty($students);

        $unplaced = $this->assignStudentsFast($students, $groups, $groupSize);
        if (count($students) <= 300) {
            $this->rebalance($groups, $groupSize, 40);
        }

        foreach ($groups as &$g) {
            $g['warnings'] = $this->validateGroup($g, $groupSize);
            $g['stats'] = $this->groupStats($g);
            $g['quality_score'] = $this->groupQualityScore($g, $groupSize);
        }
        unset($g);

        usort($groups, fn ($a, $b) => $a['no'] <=> $b['no']);

        return [
            'summary' => $this->summary($groups, $students, $unplaced, $groupSize),
            'meta' => $this->meta($students, $locations, $periode),
            'groups' => $groups,
            'unplaced' => array_values($unplaced),
        ];
    }

    public function apply(int $periodeId, int $groupSize = 15): array
    {
        return DB::transaction(function () use ($periodeId, $groupSize) {
            $lockedIds = PesertaKkn::query()
                ->where('periode_id', $periodeId)
                ->where('status', 'approved')
                ->whereNull('kelompok_id')
                ->lockForUpdate()
                ->pluck('id')
                ->all();

            $result = $this->simulate($periodeId, $groupSize);
            $hardViolations = $this->hardViolationCount($result['groups']);

            if (($result['summary']['unplaced'] ?? 0) > 0 || $hardViolations > 0) {
                return $result + [
                    'applied' => false,
                    'message' => 'Plotting belum diterapkan: masih ada unplaced atau hard violation.',
                    'hard_violations' => $hardViolations,
                ];
            }

            foreach ($result['groups'] as $g) {
                if (count($g['members']) === 0) {
                    continue;
                }

                $group = KelompokKkn::query()->lockForUpdate()->updateOrCreate(
                    ['periode_id' => $periodeId, 'code' => $g['code']],
                    [
                        'nama_kelompok' => $g['nama_kelompok'],
                        'location_id' => $g['location']['id'] ?? null,
                        'capacity' => $groupSize,
                        'status' => 'active',
                    ]
                );

                $members = $g['members'];
                usort($members, fn ($a, $b) => [$b['gpa'] ?? 0, $a['nama'] ?? ''] <=> [$a['gpa'] ?? 0, $b['nama'] ?? '']);
                $ketuaId = $members[0]['peserta_id'] ?? null;

                foreach ($g['members'] as $m) {
                    if (! in_array($m['peserta_id'], $lockedIds, true)) {
                        continue;
                    }

                    PesertaKkn::whereKey($m['peserta_id'])->update([
                        'kelompok_id' => $group->id,
                        'placement_is_live' => false,
                        'placement_published_at' => null,
                        'placement_published_by' => null,
                        'joined_group_at' => now(),
                        'role' => $m['peserta_id'] === $ketuaId ? 'Ketua' : 'Anggota',
                    ]);
                }
            }

            return $result + ['applied' => true, 'message' => 'Plotting diterapkan.'];
        });
    }

    private function createGroupSlots(int $count, array $locations, int $groupSize): array
    {
        if ($locations === []) {
            throw new RuntimeException('Tidak ada lokasi tersedia untuk plotting.');
        }

        $locations = array_values($locations);
        usort($locations, fn ($a, $b) => [
            $this->norm($a['regency_name'] ?? ''),
            $this->norm($a['district_name'] ?? ''),
            $this->norm($a['village_name'] ?? ''),
            $a['id'] ?? 0,
        ] <=> [
            $this->norm($b['regency_name'] ?? ''),
            $this->norm($b['district_name'] ?? ''),
            $this->norm($b['village_name'] ?? ''),
            $b['id'] ?? 0,
        ]);

        $groups = [];
        for ($i = 0; $i < $count; $i++) {
            if ($count > count($locations)) {
                throw new RuntimeException('Jumlah kelompok melebihi desa terpilih. Pilih minimal '.$count.' desa karena 1 desa hanya boleh 1 kelompok.');
            }
            $loc = $locations[$i];
            $no = $i + 1;
            $groups[] = [
                'no' => $no,
                'code' => 'REG-' . str_pad((string) $no, 3, '0', STR_PAD_LEFT),
                'nama_kelompok' => 'Kelompok Reguler ' . str_pad((string) $no, 3, '0', STR_PAD_LEFT),
                'location' => $loc,
                'members' => [],
                'warnings' => [],
                'stats' => [],
                'capacity' => $groupSize,
            ];
        }

        return $groups;
    }

    private function sortStudentsByDifficulty(array $students): array
    {
        $facCounts = array_count_values(array_filter(array_column($students, 'fakultas')));
        $proCounts = array_count_values(array_filter(array_column($students, 'prodi')));
        $originCounts = array_count_values(array_filter(array_column($students, 'origin_norm')));

        usort($students, function ($a, $b) use ($facCounts, $proCounts, $originCounts) {
            $ad = [
                $originCounts[$a['origin_norm'] ?? ''] ?? 9999,
                $facCounts[$a['fakultas'] ?? ''] ?? 9999,
                $proCounts[$a['prodi'] ?? ''] ?? 9999,
                $a['gender'] === 'L' ? 0 : 1,
                -($a['gpa'] ?? 0),
                $a['nim'] ?? '',
            ];
            $bd = [
                $originCounts[$b['origin_norm'] ?? ''] ?? 9999,
                $facCounts[$b['fakultas'] ?? ''] ?? 9999,
                $proCounts[$b['prodi'] ?? ''] ?? 9999,
                $b['gender'] === 'L' ? 0 : 1,
                -($b['gpa'] ?? 0),
                $b['nim'] ?? '',
            ];

            return $ad <=> $bd;
        });

        return $students;
    }


    private function assignStudentsFast(array $students, array &$groups, int $groupSize): array
    {
        $unplaced = [];
        $stats = [];
        foreach ($groups as $i => $g) {
            $stats[$i] = [
                'n' => 0,
                'male' => 0,
                'gpa_sum' => 0.0,
                'gpa_count' => 0,
                'fac' => [],
                'pro' => [],
                'origin' => [],
            ];
        }

        foreach ($students as $s) {
            $best = null;
            $bestScore = PHP_INT_MIN;
            $minSize = min(array_column($stats, 'n') ?: [0]);
            $maxCandidateSize = min($groupSize - 1, $minSize + 2);

            foreach ($groups as $idx => $g) {
                $st = $stats[$idx];
                if ($st['n'] >= $groupSize || $st['n'] > $maxCandidateSize) {
                    continue;
                }

                $locRegency = $g['location']['regency_norm'] ?? $this->norm($g['location']['regency_name'] ?? '');
                $origin = $s['origin_norm'] ?? '';
                if ($locRegency !== '' && $origin !== '' && $locRegency === $origin) {
                    continue;
                }

                $score = $this->scoreFast($st, $s, $minSize, $groupSize);
                if ($score > $bestScore) {
                    $best = $idx;
                    $bestScore = $score;
                }
            }

            if ($best === null) {
                foreach ($groups as $idx => $g) {
                    $st = $stats[$idx];
                    if ($st['n'] >= $groupSize) continue;
                    $locRegency = $g['location']['regency_norm'] ?? $this->norm($g['location']['regency_name'] ?? '');
                    $origin = $s['origin_norm'] ?? '';
                    if ($locRegency !== '' && $origin !== '' && $locRegency === $origin) continue;
                    $score = $this->scoreFast($st, $s, min(array_column($stats, 'n') ?: [0]), $groupSize) - 500;
                    if ($score > $bestScore) { $best = $idx; $bestScore = $score; }
                }
            }

            if ($best === null) {
                $s['warnings'][] = 'Tidak ada kelompok valid hard-constraint';
                $unplaced[] = $s;
                continue;
            }

            $groups[$best]['members'][] = $s;
            $this->addToStats($stats[$best], $s);
        }

        return $unplaced;
    }

    private function scoreFast(array $st, array $s, int $minSize, int $groupSize): int
    {
        $score = 10000;
        $n = $st['n'];
        $score += ($n === $minSize) ? 1200 : 0;
        $score -= $n * 90;

        if (($s['gender'] ?? 'P') === 'L') {
            $score += $st['male'] < 3 ? 800 : ($st['male'] < 5 ? 250 : -900);
        } else {
            $score += $st['male'] >= 3 ? 180 : -300;
        }

        $fac = (string) ($s['fakultas'] ?? '');
        $pro = (string) ($s['prodi'] ?? '');
        $origin = (string) ($s['origin_norm'] ?? '');
        $sameFac = $fac !== '' ? ($st['fac'][$fac] ?? 0) : 0;
        $samePro = $pro !== '' ? ($st['pro'][$pro] ?? 0) : 0;
        $sameOrigin = $origin !== '' ? ($st['origin'][$origin] ?? 0) : 0;

        $score += $sameFac === 0 ? 650 : -($sameFac * 120);
        if ($sameFac >= 4) $score -= 350;
        if ($sameFac >= 6) $score -= 1000;

        $score += $samePro === 0 ? 550 : -($samePro * 160);
        if ($samePro >= 4) $score -= 500;
        if ($samePro >= 6) $score -= 2200;

        $score += $sameOrigin === 0 ? 300 : -($sameOrigin * 350);

        if ($st['gpa_count'] > 0) {
            $newAvg = ($st['gpa_sum'] + (float) ($s['gpa'] ?: 3.0)) / ($st['gpa_count'] + 1);
            $score -= (int) (abs($newAvg - 3.25) * 120);
        }

        $score -= abs($groupSize - ($n + 1)) * 10;
        return $score;
    }

    private function addToStats(array &$st, array $s): void
    {
        $st['n']++;
        if (($s['gender'] ?? 'P') === 'L') $st['male']++;
        if (($s['gpa'] ?? 0) > 0) { $st['gpa_sum'] += (float) $s['gpa']; $st['gpa_count']++; }
        foreach (['fakultas' => 'fac', 'prodi' => 'pro', 'origin_norm' => 'origin'] as $src => $dst) {
            $v = (string) ($s[$src] ?? '');
            if ($v !== '') $st[$dst][$v] = ($st[$dst][$v] ?? 0) + 1;
        }
    }

    private function assignStudents(array $students, array &$groups, int $groupSize): array
    {
        $unplaced = [];
        foreach ($students as $s) {
            $best = null;
            $bestScore = PHP_INT_MIN;

            foreach ($groups as $idx => $g) {
                if (! $this->hardEligible($g, $s, $groupSize)) {
                    continue;
                }

                $score = $this->score($g, $s, $groups, $groupSize);
                if ($score > $bestScore) {
                    $best = $idx;
                    $bestScore = $score;
                }
            }

            if ($best === null) {
                $s['warnings'][] = 'Tidak ada kelompok valid hard-constraint';
                $unplaced[] = $s;
                continue;
            }

            $groups[$best]['members'][] = $s;
        }

        return $unplaced;
    }

    private function hardEligible(array $g, array $s, int $groupSize): bool
    {
        if (count($g['members']) >= $groupSize) {
            return false;
        }

        $locRegency = $g['location']['regency_norm'] ?? $this->norm($g['location']['regency_name'] ?? '');
        $origin = $s['origin_norm'] ?? $this->norm($s['origin_regency'] ?? '');

        return $locRegency === '' || $origin === '' || $locRegency !== $origin;
    }

    private function score(array $g, array $s, array $groups, int $groupSize): int
    {
        $members = $g['members'];
        $n = count($members);
        $male = count(array_filter($members, fn ($x) => $x['gender'] === 'L'));
        $sameFac = count(array_filter($members, fn ($x) => ($x['fakultas'] ?? null) && $x['fakultas'] === ($s['fakultas'] ?? null)));
        $samePro = count(array_filter($members, fn ($x) => ($x['prodi'] ?? null) && $x['prodi'] === ($s['prodi'] ?? null)));
        $sameOrigin = count(array_filter($members, fn ($x) => ($x['origin_norm'] ?? '') === ($s['origin_norm'] ?? '')));
        $faculties = array_unique(array_filter(array_column($members, 'fakultas')));
        $prodis = array_unique(array_filter(array_column($members, 'prodi')));
        $sizes = array_map(fn ($x) => count($x['members']), $groups);
        $minSize = min($sizes ?: [0]);

        $score = 10000;
        $score += ($n === $minSize) ? 900 : 0;
        $score -= $n * 80;

        if (($s['gender'] ?? 'P') === 'L') {
            $score += $male < 3 ? 700 : ($male < 5 ? 250 : -800);
        } else {
            $score += $male >= 3 ? 150 : -250;
        }

        if (($s['fakultas'] ?? null) && ! in_array($s['fakultas'], $faculties, true)) {
            $score += 600;
        }
        if ($sameFac >= 6) $score -= 900;
        if ($sameFac >= 4) $score -= 350;

        if (($s['prodi'] ?? null) && ! in_array($s['prodi'], $prodis, true)) {
            $score += 500;
        }
        if ($samePro >= 6) $score -= 2000;
        if ($samePro >= 4) $score -= 500;

        $score += $sameOrigin === 0 ? 250 : -($sameOrigin * 300);

        $gpas = array_values(array_filter(array_column($members, 'gpa'), fn ($x) => $x !== null && $x > 0));
        if ($gpas !== []) {
            $newAvg = (array_sum($gpas) + (float) ($s['gpa'] ?: 3.0)) / (count($gpas) + 1);
            $score -= (int) (abs($newAvg - 3.25) * 120);
        }

        return $score;
    }

    private function rebalance(array &$groups, int $groupSize, int $maxIterations = 300): void
    {
        for ($iter = 0; $iter < $maxIterations; $iter++) {
            $bestMove = null;
            $current = $this->totalQualityScore($groups, $groupSize);

            foreach ($groups as $i => $gi) {
                foreach ($gi['members'] as $mi => $memberI) {
                    foreach ($groups as $j => $gj) {
                        if ($j <= $i) continue;
                        foreach ($gj['members'] as $mj => $memberJ) {
                            if (! $this->hardEligibleForSwap($gi, $memberJ) || ! $this->hardEligibleForSwap($gj, $memberI)) {
                                continue;
                            }

                            $trial = $groups;
                            $trial[$i]['members'][$mi] = $memberJ;
                            $trial[$j]['members'][$mj] = $memberI;
                            $score = $this->totalQualityScore($trial, $groupSize);

                            if ($score > $current) {
                                $current = $score;
                                $bestMove = [$i, $mi, $j, $mj];
                            }
                        }
                    }
                }
            }

            if ($bestMove === null) {
                break;
            }

            [$i, $mi, $j, $mj] = $bestMove;
            $tmp = $groups[$i]['members'][$mi];
            $groups[$i]['members'][$mi] = $groups[$j]['members'][$mj];
            $groups[$j]['members'][$mj] = $tmp;
        }
    }

    private function hardEligibleForSwap(array $g, array $s): bool
    {
        $locRegency = $g['location']['regency_norm'] ?? $this->norm($g['location']['regency_name'] ?? '');
        $origin = $s['origin_norm'] ?? $this->norm($s['origin_regency'] ?? '');
        return $locRegency === '' || $origin === '' || $locRegency !== $origin;
    }

    private function totalQualityScore(array $groups, int $groupSize): int
    {
        return array_sum(array_map(fn ($g) => $this->groupQualityScore($g, $groupSize), $groups));
    }

    private function groupQualityScore(array $g, int $groupSize): int
    {
        $m = $g['members'];
        $n = count($m);
        if ($n === 0) return -100000;

        $male = count(array_filter($m, fn ($x) => $x['gender'] === 'L'));
        $fac = count(array_unique(array_filter(array_column($m, 'fakultas'))));
        $pro = count(array_unique(array_filter(array_column($m, 'prodi'))));
        $score = 10000;
        $score -= abs($groupSize - $n) * 300;
        $score -= abs(4 - $male) * 450;
        $score += $fac * 250;
        $score += $pro * 180;

        foreach (array_count_values(array_filter(array_column($m, 'prodi'))) as $cnt) {
            if ($cnt > 6) $score -= ($cnt - 6) * 1200;
        }
        foreach (array_count_values(array_filter(array_column($m, 'fakultas'))) as $cnt) {
            if ($cnt > 6) $score -= ($cnt - 6) * 700;
        }
        foreach ($this->validateGroup($g, $groupSize) as $warning) {
            $score -= str_starts_with($warning, 'H') ? 10000 : 1000;
        }

        return $score;
    }

    private function students(int $periodeId): array
    {
        return DB::table('peserta_kkn as p')
            ->join('mahasiswa as m', 'm.id', '=', 'p.mahasiswa_id')
            ->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->leftJoin('fakultas as f', 'f.id', '=', 'm.fakultas_id')
            ->leftJoin('prodi as pr', 'pr.id', '=', 'm.prodi_id')
            ->where('p.periode_id', $periodeId)
            ->where('p.status', 'approved')
            ->whereNull('p.kelompok_id')
            ->whereNull('p.deleted_at')
            ->whereNull('m.deleted_at')
            ->orderBy('p.id')
            ->select([
                'p.id as peserta_id',
                'm.id as mahasiswa_id',
                'm.nim',
                'm.nama',
                'm.gender',
                'm.gpa',
                'm.sks_completed as sks',
                'm.semester',
                'm.batch_year',
                'm.birth_place',
                'u.address_regency_name',
                'f.nama as fakultas',
                'pr.nama as prodi',
            ])
            ->get()
            ->map(fn ($row) => [
                'peserta_id' => (int) $row->peserta_id,
                'mahasiswa_id' => $row->mahasiswa_id ? (int) $row->mahasiswa_id : null,
                'nim' => $row->nim,
                'nama' => $row->nama,
                'gender' => strtoupper((string) ($row->gender ?: 'P')) === 'L' ? 'L' : 'P',
                'fakultas' => $row->fakultas,
                'prodi' => $row->prodi,
                'gpa' => (float) ($row->gpa ?? 0),
                'sks' => $row->sks,
                'semester' => $row->semester,
                'batch_year' => $row->batch_year,
                'origin_regency' => $row->address_regency_name ?: $row->birth_place,
                'origin_norm' => $this->norm($row->address_regency_name ?: $row->birth_place),
            ])
            ->values()
            ->all();
    }

    private function locations(Periode $periode): array
    {
        $allowed = $periode->jenisKkn?->allowed_regencies;
        $target = is_array($allowed) && $allowed !== [] ? $allowed : self::DEFAULT_REGENCIES;
        $targetNorm = array_map(fn ($r) => $this->norm((string) $r), $target);

        $locs = Lokasi::query()
            ->whereNotNull('regency_name')
            ->where('is_selected_for_kkn', true)
            ->orderBy('regency_name')
            ->orderBy('district_name')
            ->orderBy('village_name')
            ->get()
            ->filter(fn ($l) => in_array($this->norm((string) $l->regency_name), $targetNorm, true));

        if ($locs->isEmpty()) {
            $locs = Lokasi::query()->whereNotNull('regency_name')->orderBy('regency_name')->orderBy('district_name')->limit(200)->get();
        }

        return $locs->map(fn ($l) => [
            'id' => $l->id,
            'village_name' => $l->village_name,
            'district_name' => $l->district_name,
            'regency_name' => $l->regency_name,
            'regency_norm' => $this->norm((string) $l->regency_name),
            'province_id' => $l->province_id,
            'regency_id' => $l->regency_id,
            'district_id' => $l->district_id,
            'village_code' => $l->village_code,
            'address' => $l->address,
            'latitude' => $l->latitude,
            'longitude' => $l->longitude,
            'capacity' => $l->capacity,
            'geofence_radius_meters' => $l->geofence_radius_meters,
            'maps_url' => ($l->latitude && $l->longitude) ? 'https://www.google.com/maps?q=' . $l->latitude . ',' . $l->longitude : null,
            'full_name' => trim(($l->village_name ? 'Desa ' . $l->village_name . ', ' : '') . ($l->district_name ? 'Kec. ' . $l->district_name . ', ' : '') . ($l->regency_name ? 'Kab. ' . $l->regency_name : '')),
        ])->values()->all();
    }

    private function validateGroup(array $g, int $groupSize): array
    {
        $m = $g['members'];
        if (! count($m)) return ['Kelompok kosong'];

        $fac = count(array_unique(array_filter(array_column($m, 'fakultas'))));
        $pro = count(array_unique(array_filter(array_column($m, 'prodi'))));
        $male = count(array_filter($m, fn ($x) => $x['gender'] === 'L'));
        $warnings = [];

        if (count($m) > $groupSize) $warnings[] = 'H2: Melebihi kapasitas';
        if ($fac < 2) $warnings[] = 'S2: Fakultas kurang dari 2';
        if ($pro < 3) $warnings[] = 'S3: Prodi kurang dari 3';
        if ($male < 3) $warnings[] = 'S1: Laki-laki kurang dari 3';
        if ($male > 6) $warnings[] = 'S1: Laki-laki lebih dari 6';

        foreach (array_count_values(array_filter(array_column($m, 'prodi'))) as $name => $cnt) {
            if ($cnt > 6) $warnings[] = "S4: Prodi {$name} lebih dari 6";
        }

        $locRegency = $g['location']['regency_norm'] ?? $this->norm($g['location']['regency_name'] ?? '');
        foreach ($m as $member) {
            if ($locRegency !== '' && ($member['origin_norm'] ?? $this->norm($member['origin_regency'] ?? '')) === $locRegency) {
                $warnings[] = "H1: {$member['nama']} asal sama dengan lokasi";
                break;
            }
        }

        return $warnings;
    }

    private function hardViolationCount(array $groups): int
    {
        $count = 0;
        foreach ($groups as $g) {
            foreach (($g['warnings'] ?? []) as $warning) {
                if (str_starts_with($warning, 'H')) $count++;
            }
        }
        return $count;
    }

    private function groupStats(array $g): array
    {
        $m = $g['members'];
        $n = count($m);
        $male = count(array_filter($m, fn ($x) => $x['gender'] === 'L'));
        $gpas = array_values(array_filter(array_column($m, 'gpa'), fn ($x) => $x !== null && $x > 0));

        return [
            'total' => $n,
            'male' => $male,
            'female' => $n - $male,
            'male_pct' => $n > 0 ? round($male / $n * 100, 1) : 0,
            'avg_gpa' => $gpas ? round(array_sum($gpas) / count($gpas), 2) : 0,
            'fakultas' => array_count_values(array_filter(array_column($m, 'fakultas'))),
            'prodi' => array_count_values(array_filter(array_column($m, 'prodi'))),
            'origin_regencies' => array_count_values(array_filter(array_column($m, 'origin_regency'))),
        ];
    }

    private function meta(array $students, array $locations, Periode $periode): array
    {
        return [
            'generated_at' => now()->toIso8601String(),
            'periode_id' => $periode->id,
            'jenis_kkn' => $periode->jenisKkn?->name,
            'allowed_regencies' => $periode->jenisKkn?->allowed_regencies ?: self::DEFAULT_REGENCIES,
            'location_candidates' => count($locations),
            'students_by_gender' => array_count_values(array_filter(array_column($students, 'gender'))),
            'students_by_fakultas' => array_count_values(array_filter(array_column($students, 'fakultas'))),
            'students_by_prodi' => array_count_values(array_filter(array_column($students, 'prodi'))),
            'students_by_origin' => array_count_values(array_filter(array_column($students, 'origin_regency'))),
        ];
    }

    private function summary(array $groups, array $students, array $unplaced, int $groupSize): array
    {
        $viol = 0;
        $hard = 0;
        $filled = 0;
        $quality = 0;
        foreach ($groups as $g) {
            $filled += count($g['members']);
            $warnings = $g['warnings'] ?? [];
            if ($warnings) $viol++;
            foreach ($warnings as $w) if (str_starts_with($w, 'H')) $hard++;
            $quality += $g['quality_score'] ?? 0;
        }

        return [
            'students' => count($students),
            'groups' => count($groups),
            'placed' => $filled,
            'unplaced' => count($unplaced),
            'violating_groups' => $viol,
            'hard_violations' => $hard,
            'quality_score' => $quality,
            'group_size' => $groupSize,
        ];
    }

    private function norm(?string $s): string
    {
        if (blank($s)) return '';

        return Str::of($s)
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/u', ' ')
            ->replaceMatches('/\b(kotamadya|kabupaten|kecamatan|kelurahan|desa|provinsi|prov|dki|kab|kota|kec|kel)\b/u', ' ')
            ->replaceMatches('/\b(kotamadya|kabupaten|kecamatan|kelurahan|desa|provinsi|prov|dki|kab|kota|kec|kel)\b/u', ' ')
            ->trim()
            ->squish()
            ->toString();
    }
}
