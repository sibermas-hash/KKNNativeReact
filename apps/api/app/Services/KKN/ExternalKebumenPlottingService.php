<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\ExternalKknBatch;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;

class ExternalKebumenPlottingService
{
    private const GROUP_SIZE = 15;
    private const MAX_EXTERNAL = 5;

    public function preview(?int $periodeId = null): array
    {
        $periodeId = $periodeId ?: $this->latestExternalPeriodeId();
        if (! $periodeId) return ['periode_id'=>null,'summary'=>['external_unplaced'=>0,'groups_needed'=>0,'can_apply'=>false],'groups'=>[],'warnings'=>['Belum ada batch peserta eksternal.']];
        $external = $this->participants($periodeId, true);
        $internal = $this->participants($periodeId, false);
        $locations = $this->kebumenLocations();
        $groups = $this->plan($external, $internal, $locations);
        return [
            'periode_id'=>$periodeId,
            'rules'=>['regency'=>'Kebumen','group_size'=>self::GROUP_SIZE,'max_external_per_group'=>self::MAX_EXTERNAL,'mode'=>'preview_additive_unplaced_only'],
            'summary'=>[
                'external_unplaced'=>count($external),'internal_unplaced'=>count($internal),'locations_kebumen'=>count($locations),'groups_needed'=>count($groups),
                'external_distribution'=>array_map(fn($g)=>$g['external_target'],$groups),
                'internal_needed'=>array_sum(array_map(fn($g)=>$g['internal_target'],$groups)),
                'can_apply'=>$this->canApply($groups,$internal,$locations),
            ],
            'groups'=>$groups,
            'warnings'=>$this->warnings($groups,$internal,$locations),
        ];
    }

    public function apply(?int $periodeId = null): array
    {
        return DB::transaction(function () use ($periodeId) {
            $result = $this->preview($periodeId);
            if (!($result['summary']['can_apply'] ?? false)) return $result + ['applied'=>false,'message'=>'Belum diterapkan: lokasi/internal belum cukup atau tidak ada eksternal baru.'];
            foreach ($result['groups'] as $g) {
                $group = KelompokKkn::query()->lockForUpdate()->updateOrCreate(
                    ['periode_id'=>$result['periode_id'],'code'=>$g['code']],
                    ['nama_kelompok'=>$g['name'],'location_id'=>$g['location']['id'],'capacity'=>self::GROUP_SIZE,'status'=>'active']
                );
                foreach (array_merge($g['external_members'],$g['internal_members']) as $idx=>$m) {
                    PesertaKkn::whereKey($m['peserta_id'])->whereNull('kelompok_id')->update(['kelompok_id'=>$group->id,'joined_group_at'=>now(),'role'=>$idx===0?'Ketua':'Anggota']);
                }
            }
            return $result + ['applied'=>true,'message'=>'Plotting peserta eksternal Kebumen diterapkan.'];
        });
    }

    private function latestExternalPeriodeId(): ?int { return ExternalKknBatch::query()->latest('id')->value('periode_id'); }

    private function participants(int $periodeId, bool $external): array
    {
        return DB::table('peserta_kkn as p')->join('mahasiswa as m','m.id','=','p.mahasiswa_id')->leftJoin('external_student_profiles as esp','esp.mahasiswa_id','=','m.id')->leftJoin('fakultas as f','f.id','=','m.fakultas_id')->leftJoin('prodi as pr','pr.id','=','m.prodi_id')
            ->where('p.periode_id',$periodeId)->where('p.status','approved')->whereNull('p.kelompok_id')->whereNull('p.deleted_at')->whereNull('m.deleted_at')
            ->when($external, fn($q)=>$q->where(fn($qq)=>$qq->where('m.origin_type','external')->orWhereNotNull('esp.id')))
            ->when(!$external, fn($q)=>$q->where(fn($qq)=>$qq->whereNull('m.origin_type')->orWhere('m.origin_type','!=','external'))->whereNull('esp.id'))
            ->orderBy('m.gender')->orderBy('p.id')->select(['p.id as peserta_id','m.id as mahasiswa_id','m.nim','m.nama','m.gender','f.nama as fakultas','pr.nama as prodi'])->get()
            ->map(fn($r)=>['peserta_id'=>(int)$r->peserta_id,'mahasiswa_id'=>(int)$r->mahasiswa_id,'nim'=>$r->nim,'nama'=>$r->nama,'gender'=>strtoupper((string)$r->gender)==='L'?'L':'P','fakultas'=>$r->fakultas,'prodi'=>$r->prodi,'external'=>$external])->all();
    }

    private function kebumenLocations(): array
    {
        return Lokasi::query()->whereRaw('lower(regency_name) like ?', ['%kebumen%'])->where('is_selected_for_kkn', true)->orderBy('district_name')->orderBy('village_name')->get()
            ->map(fn($l)=>['id'=>$l->id,'village_name'=>$l->village_name,'district_name'=>$l->district_name,'regency_name'=>$l->regency_name])->all();
    }

    private function plan(array $external, array $internal, array $locations): array
    {
        $e=count($external); if($e===0) return []; $gCount=(int)ceil($e/self::MAX_EXTERNAL); $base=intdiv($e,$gCount); $extra=$e%$gCount;
        $eL=array_values(array_filter($external,fn($x)=>$x['gender']==='L')); $eP=array_values(array_filter($external,fn($x)=>$x['gender']!=='L'));
        $iL=array_values(array_filter($internal,fn($x)=>$x['gender']==='L')); $iP=array_values(array_filter($internal,fn($x)=>$x['gender']!=='L')); $groups=[];
        for($i=0;$i<$gCount;$i++){
            $targetE=$base+($i<$extra?1:0); $ext=[];
            for($j=0;$j<$targetE;$j++){ $pickL=count(array_filter($ext,fn($x)=>$x['gender']==='L'))<=count(array_filter($ext,fn($x)=>$x['gender']!=='L')); $ext[]=(($pickL&&$eL)||!$eP)?array_shift($eL):array_shift($eP); }
            $ext=array_values(array_filter($ext)); $maleE=count(array_filter($ext,fn($x)=>$x['gender']==='L')); $targetMale=($i%2===0)?8:7; $needI=self::GROUP_SIZE-count($ext); $needL=max(0,min($needI,$targetMale-$maleE)); $needP=$needI-$needL;
            while($needL>count($iL)&&$needL>0){$needL--; $needP++;} while($needP>count($iP)&&$needP>0){$needP--; $needL++;}
            $int=array_merge(array_splice($iL,0,$needL),array_splice($iP,0,$needP)); $male=$maleE+count(array_filter($int,fn($x)=>$x['gender']==='L'));
            $groups[]=['no'=>$i+1,'code'=>'EXT-KEB-'.str_pad((string)($i+1),3,'0',STR_PAD_LEFT),'name'=>'Kelompok Eksternal Kebumen '.str_pad((string)($i+1),3,'0',STR_PAD_LEFT),'location'=>$locations[$i]??null,'external_target'=>$targetE,'internal_target'=>$needI,'external_members'=>$ext,'internal_members'=>$int,'stats'=>['total'=>count($ext)+count($int),'external'=>count($ext),'internal'=>count($int),'male'=>$male,'female'=>count($ext)+count($int)-$male]];
        }
        return $groups;
    }

    private function canApply(array $groups,array $internal,array $locations): bool { return count($groups)>0 && count($locations)>=count($groups) && array_sum(array_map(fn($g)=>$g['internal_target'],$groups))<=count($internal); }
    private function warnings(array $groups,array $internal,array $locations): array { $w=[]; if(count($groups)===0)$w[]='Tidak ada peserta eksternal baru belum ditempatkan.'; if(count($locations)<count($groups))$w[]='Lokasi Kebumen terpilih kurang: perlu '.count($groups).', tersedia '.count($locations).'.'; $need=array_sum(array_map(fn($g)=>$g['internal_target'],$groups)); if($need>count($internal))$w[]='Mahasiswa internal belum ditempatkan kurang: perlu '.$need.', tersedia '.count($internal).'.'; return $w; }
}
