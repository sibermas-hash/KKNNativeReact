<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AutoPlottingService
{
    private array $targetRegencies = ['Pangandaran','Cilacap','Banyumas','Purbalingga','Kebumen','Banjarnegara'];

    public function simulate(int $periodeId, int $groupSize = 15): array
    {
        $students = $this->students($periodeId);
        $locations = $this->locations();
        $groupsCount = (int) ceil(max(1, count($students)) / $groupSize);
        $groups = [];
        for ($i = 0; $i < $groupsCount; $i++) {
            $loc = $locations[$i % max(1, count($locations))] ?? null;
            $groups[] = ['no'=>$i+1,'code'=>'REG-'.str_pad((string)($i+1),3,'0',STR_PAD_LEFT),'nama_kelompok'=>'Kelompok Reguler '.str_pad((string)($i+1),3,'0',STR_PAD_LEFT),'location'=>$loc,'members'=>[],'warnings'=>[],'stats'=>[]];
        }
        usort($students, fn($a,$b) => [$a['gender']==='L'?0:1, -$a['gpa']] <=> [$b['gender']==='L'?0:1, -$b['gpa']]);
        $unplaced = [];
        foreach ($students as $s) {
            $best = null; $bestScore = -999999;
            foreach ($groups as $idx => $g) {
                if (count($g['members']) >= $groupSize) continue;
                if ($this->norm($g['location']['regency_name'] ?? '') === $this->norm($s['origin_regency'] ?? '')) continue;
                $score = $this->score($g, $s, $groupSize);
                if ($score > $bestScore) { $best = $idx; $bestScore = $score; }
            }
            if ($best === null) {
                foreach ($groups as $idx => $g) {
                    if (count($g['members']) >= $groupSize) continue;
                    $score = $this->score($g, $s, $groupSize) - 3000;
                    if ($score > $bestScore) { $best = $idx; $bestScore = $score; }
                }
                if ($best !== null) $s['warnings'][] = 'Fallback: asal sama dengan lokasi karena data terbatas';
            }
            if ($best === null) $unplaced[] = $s; else $groups[$best]['members'][] = $s;
        }
        foreach ($groups as &$g) { $g['warnings'] = $this->validateGroup($g, $groupSize); $g['stats'] = $this->groupStats($g); }
        return ['summary'=>$this->summary($groups,$students,$unplaced,$groupSize),'meta'=>$this->meta($students,$locations),'groups'=>$groups,'unplaced'=>$unplaced];
    }

    public function apply(int $periodeId, int $groupSize = 15): array
    {
        $result = $this->simulate($periodeId, $groupSize);
        if (($result['summary']['unplaced'] ?? 0) > 0) return $result + ['applied'=>false,'message'=>'Masih ada mahasiswa belum terplot.'];
        DB::transaction(function () use ($periodeId, $result, $groupSize): void {
            foreach ($result['groups'] as $g) {
                if (count($g['members']) === 0) continue;
                $group = KelompokKkn::updateOrCreate(['periode_id'=>$periodeId,'code'=>$g['code']], ['nama_kelompok'=>$g['nama_kelompok'],'location_id'=>$g['location']['id'] ?? null,'capacity'=>$groupSize,'status'=>'active']);
                foreach ($g['members'] as $m) PesertaKkn::whereKey($m['peserta_id'])->update(['kelompok_id'=>$group->id,'joined_group_at'=>now()]);
            }
        });
        return $result + ['applied'=>true,'message'=>'Plotting diterapkan.'];
    }

    private function students(int $periodeId): array
    {
        return PesertaKkn::query()->with(['mahasiswa.user','mahasiswa.fakultas','mahasiswa.prodi'])->where('periode_id',$periodeId)->where('status','approved')->whereNull('kelompok_id')->get()->map(function($p){
            $m=$p->mahasiswa; $u=$m?->user;
            return ['peserta_id'=>$p->id,'mahasiswa_id'=>$m?->id,'nim'=>$m?->nim,'nama'=>$m?->nama,'gender'=>strtoupper((string)($m?->gender ?: 'P'))==='L'?'L':'P','fakultas'=>$m?->fakultas?->name,'prodi'=>$m?->prodi?->name,'gpa'=>(float)($m?->gpa ?? 0),'sks'=>$m?->sks_completed,'semester'=>$m?->semester,'batch_year'=>$m?->batch_year,'phone'=>$m?->phone,'alamat'=>$m?->alamat,'origin_regency'=>$u?->address_regency_name ?: $m?->birth_place];
        })->values()->all();
    }

    private function locations(): array
    {
        $locs = Lokasi::query()->whereIn('regency_name',$this->targetRegencies)->orderBy('regency_name')->orderBy('district_name')->orderBy('village_name')->get();
        if ($locs->isEmpty()) $locs = Lokasi::query()->whereNotNull('regency_name')->limit(200)->get();
        return $locs->map(fn($l)=>['id'=>$l->id,'village_name'=>$l->village_name,'district_name'=>$l->district_name,'regency_name'=>$l->regency_name,'province_id'=>$l->province_id,'regency_id'=>$l->regency_id,'district_id'=>$l->district_id,'village_code'=>$l->village_code,'village_name'=>$l->village_name,'district_name'=>$l->district_name,'regency_name'=>$l->regency_name,'address'=>$l->address,'latitude'=>$l->latitude,'longitude'=>$l->longitude,'capacity'=>$l->capacity,'geofence_radius_meters'=>$l->geofence_radius_meters,'maps_url'=>($l->latitude && $l->longitude) ? 'https://www.google.com/maps?q='.$l->latitude.','.$l->longitude : null,'full_name'=>trim(($l->village_name ? 'Desa '.$l->village_name.', ' : '').($l->district_name ? 'Kec. '.$l->district_name.', ' : '').($l->regency_name ? 'Kab. '.$l->regency_name : ''))])->values()->all();
    }

    private function score(array $g, array $s, int $groupSize): int
    {
        $m=$g['members']; $n=count($m); $male=count(array_filter($m,fn($x)=>$x['gender']==='L'));
        $fac=array_unique(array_filter(array_column($m,'fakultas'))); $pro=array_unique(array_filter(array_column($m,'prodi')));
        $samePro=count(array_filter($m,fn($x)=>$x['prodi'] && $x['prodi']===$s['prodi']));
        $avg = $n ? array_sum(array_column($m,'gpa'))/$n : 3.25;
        $score=1000-$n*10;
        if ($s['gender']==='L' && $male<4) $score+=140;
        if ($s['gender']!=='L' && $male>=3) $score+=40;
        if ($s['fakultas'] && !in_array($s['fakultas'],$fac,true)) $score+=100;
        if ($s['prodi'] && !in_array($s['prodi'],$pro,true)) $score+=80;
        if ($samePro>=6) $score-=1000;
        $score -= (int)(abs(($avg + $s['gpa'])/2 - 3.25) * 40);
        if ($n >= $groupSize - 3) $score += 25;
        return $score;
    }

    private function validateGroup(array $g, int $groupSize): array
    {
        $m=$g['members']; if (!count($m)) return ['Kelompok kosong'];
        $fac=count(array_unique(array_filter(array_column($m,'fakultas'))));
        $pro=count(array_unique(array_filter(array_column($m,'prodi'))));
        $male=count(array_filter($m,fn($x)=>$x['gender']==='L'));
        $proCounts=array_count_values(array_filter(array_column($m,'prodi')));
        $warnings=[];
        if (count($m) > $groupSize) $warnings[]='Melebihi kapasitas';
        if ($fac < 2) $warnings[]='Fakultas kurang dari 2';
        if ($pro < 3) $warnings[]='Prodi kurang dari 3';
        if ($male < 3) $warnings[]='Laki-laki kurang dari 3';
        if ($male > 6) $warnings[]='Laki-laki lebih dari 6';
        foreach ($proCounts as $name=>$cnt) if ($cnt > 6) $warnings[]="Prodi {$name} lebih dari 6";
        return $warnings;
    }

    private function groupStats(array $g): array
    {
        $m=$g['members']; $n=count($m);
        $male=count(array_filter($m,fn($x)=>$x['gender']==='L'));
        $gpas=array_values(array_filter(array_column($m,'gpa'),fn($x)=>$x!==null));
        $avg=$gpas ? round(array_sum($gpas)/count($gpas),2) : 0;
        return [
            'total'=>$n,
            'male'=>$male,
            'female'=>$n-$male,
            'avg_gpa'=>$avg,
            'fakultas'=>array_count_values(array_filter(array_column($m,'fakultas'))),
            'prodi'=>array_count_values(array_filter(array_column($m,'prodi'))),
            'origin_regencies'=>array_count_values(array_filter(array_column($m,'origin_regency'))),
        ];
    }

    private function meta(array $students, array $locations): array
    {
        return [
            'generated_at'=>now()->toIso8601String(),
            'target_regencies'=>$this->targetRegencies,
            'location_candidates'=>count($locations),
            'students_by_gender'=>array_count_values(array_filter(array_column($students,'gender'))),
            'students_by_fakultas'=>array_count_values(array_filter(array_column($students,'fakultas'))),
            'students_by_prodi'=>array_count_values(array_filter(array_column($students,'prodi'))),
            'students_by_origin'=>array_count_values(array_filter(array_column($students,'origin_regency'))),
        ];
    }

    private function summary(array $groups, array $students, array $unplaced, int $groupSize): array
    {
        $viol=0; $filled=0;
        foreach ($groups as $g) { $filled+=count($g['members']); if (count($g['warnings'] ?? [])) $viol++; }
        return ['students'=>count($students),'groups'=>count($groups),'placed'=>$filled,'unplaced'=>count($unplaced),'violating_groups'=>$viol,'group_size'=>$groupSize];
    }

    private function norm(string $s): string { return Str::of($s)->lower()->replace(['kabupaten','kab.','kota'], '')->trim()->toString(); }
}
