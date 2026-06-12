<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ExternalKknBatch;
use App\Models\KKN\ExternalStudentProfile;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExternalParticipantController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeProfilesByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function scopeBatchesByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('students.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function requireSuperadmin(): ?JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->error('FORBIDDEN', 'Fitur import/bulk peserta eksternal sementara hanya untuk Super Admin.', 403);
        }

        return null;
    }

    private function activePeriodIds(): array
    {
        return Periode::query()->where('is_active', true)->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    public function index(Request $request): JsonResponse
    {
        $query = ExternalStudentProfile::query()
            ->with([
                'batch:id,periode_id,home_university,target_regency',
                'batch.periode:id,name,periode',
                'mahasiswa:id,user_id,nim,nama,phone',
                'mahasiswa.user:id,username,name,email,phone',
                'mahasiswa.peserta:id,mahasiswa_id,kelompok_id,status',
                'mahasiswa.peserta.kelompok:id,nama_kelompok,lokasi_id',
                'mahasiswa.peserta.kelompok.lokasi:id,regency_name,district_name,village_name',
            ])
            ->whereHas('batch.periode', fn ($q) => $q->where('is_active', true))
            ->when($request->filled('batch_id'), fn ($q) => $q->where('batch_id', $request->integer('batch_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $raw = strtolower(trim((string) $request->query('search')));
                $words = preg_split('/\s+/', $raw);
                foreach ($words as $word) {
                    if ($word === '') continue;
                    $s = '%' . $word . '%';
                    $q->where(function ($qq) use ($s) {
                        $qq->whereRaw('lower(external_nim) like ?', [$s])
                            ->orWhereRaw('lower(home_university) like ?', [$s])
                            ->orWhereRaw('lower(external_faculty) like ?', [$s])
                            ->orWhereRaw('lower(external_study_program) like ?', [$s])
                            ->orWhereHas('mahasiswa', fn ($m) => $m->whereRaw('lower(nama) like ?', [$s]));
                    });
                }
            })
            ->latest('id');

        $this->scopeProfilesByFaculty($query);

        $page = $query->paginate(min((int) $request->query('per_page', 25), 100));
        $page->setCollection($page->getCollection()->map(fn (ExternalStudentProfile $profile) => $this->serializeExternalProfile($profile)));

        return $this->success($page);
    }

    public function batches(): JsonResponse
    {
        $query = ExternalKknBatch::withCount('students')->with('periode:id,name,periode,is_active')->whereHas('periode', fn ($q) => $q->where('is_active', true))->latest('id');
        $this->scopeBatchesByFaculty($query);

        return $this->success($query->get());
    }

    public function storeBatch(Request $request): JsonResponse
    {
        if ($forbidden = $this->requireSuperadmin()) {
            return $forbidden;
        }

        $data = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'home_university' => ['required', 'string', 'max:150'],
            'program_name' => ['nullable', 'string', 'max:150'],
            'letter_number' => ['nullable', 'string', 'max:120'],
            'letter_date' => ['nullable', 'date'],
            'expected_participants' => ['nullable', 'integer', 'min:1'],
            'target_regency' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'letter_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);
        if (! Periode::whereKey($data['periode_id'])->where('is_active', true)->exists()) {
            return $this->error('INVALID_PERIOD', 'Batch peserta eksternal hanya boleh dibuat untuk periode aktif.', 422);
        }

        $data['program_name'] = $data['program_name'] ?? 'KKN Kolaborasi PTKIN';
        $data['created_by'] = auth()->id();

        if ($request->hasFile('letter_file')) {
            $path = $request->file('letter_file')->store('letters/external', 'public');
            $data['letter_file_path'] = $path;
        }

        return $this->created(ExternalKknBatch::create($data), 'Batch peserta eksternal dibuat.');
    }

    public function import(Request $request): JsonResponse
    {
        if ($forbidden = $this->requireSuperadmin()) {
            return $forbidden;
        }

        $data = $request->validate([
            'batch_id' => ['required', 'exists:external_kkn_batches,id'],
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:10240'],
        ]);
        $batch = $this->findScopedBatch((int) $data['batch_id']);
        $rows = $this->extractRowsFromUpload($request->file('file'), $batch);
        $faculty = Fakultas::firstOrCreate(['code' => 'EXT'], ['nama' => 'Mahasiswa Eksternal', 'short_name' => 'Eksternal']);
        $prodi = Prodi::firstOrCreate(['code' => 'EXT', 'fakultas_id' => $faculty->id], ['nama' => 'Program Studi Eksternal', 'short_name' => 'Eksternal']);
        $created = 0;
        $skipped = 0;
        $accounts = [];

        DB::transaction(function () use ($rows, $batch, $faculty, $prodi, &$created, &$skipped, &$accounts) {
            foreach ($rows as $i => $row) {
                $nama = trim((string) ($row['nama'] ?? $row['name'] ?? ''));
                $nim = trim((string) ($row['nim'] ?? $row['nim_asal'] ?? $row['external_nim'] ?? ''));
                if ($nama === '' || $nim === '') {
                    $skipped++;

                    continue;
                }
                if (ExternalStudentProfile::where('batch_id', $batch->id)->where('external_nim', $nim)->exists()) {
                    $skipped++;

                    continue;
                }
                $username = 'X-'.strtoupper($nim);
                $base = $username;
                $n = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $base.'-'.$n++;
                }
                $password = Str::password(16);
                $user = User::create([
                    'username' => $username,
                    'name' => $nama,
                    'email' => $row['email'] ?? null,
                    'phone' => $row['no_hp'] ?? $row['phone'] ?? null,
                    'address' => $row['alamat'] ?? $row['address'] ?? null,
                    'is_active' => true,
                    'must_change_password' => true,
                    'password' => $password,
                ]);
                $user->assignRole('student');
                $mahasiswa = Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $nim,
                    'nama' => $nama,
                    'fakultas_id' => $faculty->id,
                    'prodi_id' => $prodi->id,
                    'batch_year' => (int) now()->year,
                    'gender' => strtoupper(substr((string) ($row['jenis_kelamin'] ?? $row['gender'] ?? ''), 0, 1)) ?: null,
                    'phone' => $row['no_hp'] ?? $row['phone'] ?? null,
                    'birth_date' => $row['tgl_lahir'] ?? $row['tanggal_lahir'] ?? $row['birth_date'] ?? null,
                    'alamat' => $row['alamat'] ?? $row['address'] ?? null,
                    'status_aktif' => 'aktif',
                    'sks_completed' => 0,
                    'gpa' => 0,
                    'is_paid_ukt' => false,
                    'origin_type' => 'external',
                ]);
                ExternalStudentProfile::create([
                    'mahasiswa_id' => $mahasiswa->id,
                    'batch_id' => $batch->id,
                    'external_nim' => $nim,
                    'home_university' => $row['kampus_asal'] ?? $row['home_university'] ?? $batch->home_university,
                    'external_faculty' => $row['fakultas_asal'] ?? $row['external_faculty'] ?? null,
                    'external_study_program' => $row['prodi_asal'] ?? $row['external_study_program'] ?? null,
                    'source_row_number' => $i + 2,
                ]);
                PesertaKkn::firstOrCreate([
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $batch->periode_id,
                ], [
                    'status' => 'approved',
                    'role' => 'member',
                    'registration_date' => now(),
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                    'notes' => 'Peserta eksternal import batch #'.$batch->id,
                ]);
                $created++;
                $accounts[] = ['nama' => $nama, 'nim_asal' => $nim, 'username' => $username, 'password' => $password];
            }
        });

        return $this->success(['created' => $created, 'skipped' => $skipped, 'accounts' => $accounts], 'Import peserta eksternal selesai.');
    }

    private function readCsv(string $path): array
    {
        $fh = fopen($path, 'r');
        $header = fgetcsv($fh) ?: [];
        $header = array_map(fn ($h) => Str::snake(trim((string) $h)), $header);
        $rows = [];
        while (($line = fgetcsv($fh)) !== false) {
            $row = [];
            foreach ($header as $i => $key) {
                $row[$key] = $line[$i] ?? null;
            }
            $rows[] = $row;
        }
        fclose($fh);

        return $rows;
    }

    public function export(Request $request)
    {
        $rows = ExternalStudentProfile::query()
            ->with(['batch.periode', 'mahasiswa.user', 'mahasiswa.peserta.kelompok.lokasi'])
            ->whereHas('batch.periode', fn ($q) => $q->where('is_active', true))
            ->when($request->filled('batch_id'), fn ($q) => $q->where('batch_id', $request->integer('batch_id')))
            ->oldest('id');

        $this->scopeProfilesByFaculty($rows);

        $rows = $rows->get();

        $header = ['no', 'nama', 'username', 'nim_asal', 'kampus_asal', 'fakultas_asal', 'prodi_asal', 'periode', 'target_kabupaten', 'kelompok', 'lokasi_kelompok', 'status_peserta', 'no_hp', 'email'];
        $lines = [$header];
        foreach ($rows as $i => $row) {
            $peserta = $row->mahasiswa?->peserta?->first();
            $kelompok = $peserta?->kelompok;
            $lines[] = [
                $i + 1,
                $row->mahasiswa?->nama ?? '',
                $row->mahasiswa?->user?->username ?? $row->mahasiswa?->nim ?? '',
                $row->external_nim,
                $row->home_university,
                $row->external_faculty ?? '',
                $row->external_study_program ?? '',
                $row->batch?->periode?->name ?? '',
                $row->batch?->target_regency ?? '',
                $kelompok?->nama_kelompok ?? '',
                $kelompok?->lokasi?->regency_name ?? '',
                $peserta?->status ?? '',
                $row->mahasiswa?->phone ?? $row->mahasiswa?->user?->phone ?? '',
                $row->mahasiswa?->user?->email ?? '',
            ];
        }
        $csv = collect($lines)->map(fn ($line) => implode(',', array_map(fn ($v) => $this->csvCell($v), $line)))->implode("\n")."\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="peserta-eksternal-'.now()->format('Ymd-His').'.csv"',
        ]);
    }

    public function template()
    {
        $rows = [
            ['nama', 'nim', 'kampus_asal', 'fakultas_asal', 'prodi_asal', 'jenis_kelamin', 'email', 'no_hp', 'tanggal_lahir', 'alamat'],
            ['Contoh Mahasiswa', 'EXT001', 'Universitas Contoh', 'Fakultas Contoh', 'Program Studi Contoh', 'L', 'contoh@email.test', '08123456789', '2005-01-01', 'Alamat lengkap'],
        ];
        $csv = collect($rows)->map(fn ($row) => implode(',', array_map(fn ($v) => $this->csvCell($v), $row)))->implode("\n")."\n";

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template-peserta-eksternal.csv"',
        ]);
    }

    public function importPreview(Request $request): JsonResponse
    {
        if ($forbidden = $this->requireSuperadmin()) return $forbidden;
        $data = $request->validate(['batch_id'=>['required','exists:external_kkn_batches,id'],'file'=>['required','file','mimes:csv,txt,xlsx,xls','max:10240']]);
        $batch = $this->findScopedBatch((int) $data['batch_id']);
        $rows = $this->normalizeImportRows($this->extractRowsFromUpload($request->file('file'), $batch), $batch);
        return $this->success(['rows'=>array_slice($rows,0,200),'total_rows'=>count($rows),'valid_rows'=>collect($rows)->where('valid',true)->count(),'invalid_rows'=>collect($rows)->where('valid',false)->count(),'needs_review'=>true], 'Preview import berhasil. Periksa data sebelum import final.');
    }

    public function importConfirm(Request $request): JsonResponse
    {
        if ($forbidden = $this->requireSuperadmin()) return $forbidden;
        $data = $request->validate(['batch_id'=>['required','exists:external_kkn_batches,id'],'rows'=>['required','array','max:1000']]);
        $batch = $this->findScopedBatch((int) $data['batch_id']);
        $rows = collect($data['rows'])->filter(fn($row)=>is_array($row) && ($row['valid'] ?? true))->values()->all();
        return $this->importRowsArray($rows, $batch);
    }

    private function importRowsArray(array $rows, ExternalKknBatch $batch): JsonResponse
    {
        $faculty = Fakultas::firstOrCreate(['code'=>'EXT'], ['nama'=>'Mahasiswa Eksternal','short_name'=>'Eksternal']);
        $prodi = Prodi::firstOrCreate(['code'=>'EXT','fakultas_id'=>$faculty->id], ['nama'=>'Program Studi Eksternal','short_name'=>'Eksternal']);
        $created=0; $skipped=0; $accounts=[];
        DB::transaction(function() use($rows,$batch,$faculty,$prodi,&$created,&$skipped,&$accounts){
            foreach($rows as $i=>$row){
                $nama=trim((string)($row['nama']??$row['name']??'')); $nim=trim((string)($row['nim']??$row['nim_asal']??$row['external_nim']??''));
                if($nama===''||$nim===''||ExternalStudentProfile::where('batch_id',$batch->id)->where('external_nim',$nim)->exists()){ $skipped++; continue; }
                $username='X-'.strtoupper($nim); $base=$username; $n=1; while(User::where('username',$username)->exists()) $username=$base.'-'.$n++;
                $password=Str::password(16);
                $user=User::create(['username'=>$username,'name'=>$nama,'email'=>$row['email']??null,'phone'=>$row['no_hp']??$row['phone']??null,'address'=>$row['alamat']??$row['address']??null,'is_active'=>true,'must_change_password'=>true,'password'=>$password]);
                $user->assignRole('student');
                $m=Mahasiswa::create(['user_id'=>$user->id,'nim'=>$nim,'nama'=>$nama,'fakultas_id'=>$faculty->id,'prodi_id'=>$prodi->id,'batch_year'=>(int)now()->year,'gender'=>strtoupper(substr((string)($row['jenis_kelamin']??$row['gender']??''),0,1))?:null,'phone'=>$row['no_hp']??$row['phone']??null,'birth_date'=>$row['tgl_lahir']??$row['tanggal_lahir']??$row['birth_date']??null,'alamat'=>$row['alamat']??$row['address']??null,'status_aktif'=>'aktif','sks_completed'=>0,'gpa'=>0,'is_paid_ukt'=>false,'origin_type'=>'external']);
                ExternalStudentProfile::create(['mahasiswa_id'=>$m->id,'batch_id'=>$batch->id,'external_nim'=>$nim,'home_university'=>$row['kampus_asal']??$row['home_university']??$batch->home_university,'external_faculty'=>$row['fakultas_asal']??$row['external_faculty']??null,'external_study_program'=>$row['prodi_asal']??$row['external_study_program']??null,'source_row_number'=>$i+2]);
                PesertaKkn::firstOrCreate(['mahasiswa_id'=>$m->id,'periode_id'=>$batch->periode_id], ['status'=>'approved','role'=>'member','registration_date'=>now(),'approved_at'=>now(),'approved_by'=>auth()->id(),'notes'=>'Peserta eksternal import batch #'.$batch->id]);
                $created++; $accounts[]=['nama'=>$nama,'nim_asal'=>$nim,'username'=>$username,'password'=>$password];
            }
        });
        return $this->success(['created'=>$created,'skipped'=>$skipped,'accounts'=>$accounts], 'Import peserta eksternal selesai.');
    }

    private function extractRowsFromUpload($file, ExternalKknBatch $batch): array
    {
        $ext=strtolower($file->getClientOriginalExtension() ?: $file->extension()); $path=$file->getRealPath();
        if(in_array($ext,['csv','txt'],true)) return $this->readCsv($path);
        if(in_array($ext,['xlsx','xls'],true)) return $this->readSpreadsheet($path);
        return [];
    }

    private function readSpreadsheet(string $path): array
    {
        if(!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) abort(422,'Parser XLSX belum terpasang.');
        $data=\PhpOffice\PhpSpreadsheet\IOFactory::load($path)->getActiveSheet()->toArray(null,true,true,false); if(count($data)<1) return [];
        $header=array_map(fn($h)=>Str::snake(trim((string)$h)), array_shift($data)); $rows=[];
        foreach($data as $line){ if(collect($line)->filter(fn($v)=>trim((string)$v)!=='')->isEmpty()) continue; $row=[]; foreach($header as $i=>$key) $row[$key ?: 'kolom_'.$i]=$line[$i]??null; $rows[]=$row; }
        return $rows;
    }

    private function runExtractText(array $cmd): string
    {
        $spec=[1=>['pipe','w'],2=>['pipe','w']]; $process=proc_open($cmd,$spec,$pipes); if(!is_resource($process)) return ''; $out=stream_get_contents($pipes[1]); fclose($pipes[1]); fclose($pipes[2]); proc_close($process); return (string)$out;
    }

    private function ocrPdf(string $path): string
    {
        $dir=sys_get_temp_dir().'/sibermas-ocr-'.Str::random(8); @mkdir($dir,0700,true); $prefix=$dir.'/page';
        $this->runExtractText(['gs','-q','-dNOPAUSE','-dBATCH','-sDEVICE=png16m','-r200','-sOutputFile='.$prefix.'-%03d.png',$path]);
        $out=''; foreach(glob($prefix.'-*.png')?:[] as $img){ $out .= "\n".$this->runExtractText(['tesseract',$img,'stdout','-l','ind+eng','--psm','6']); @unlink($img); } @rmdir($dir); return $out;
    }

    private function parseLooseRows(string $text, ExternalKknBatch $batch): array
    {
        $rows=[]; foreach(preg_split('/\R+/',$text) as $line){ $line=trim(preg_replace('/\s{2,}/',' ',$line)); if($line===''||preg_match('/^(no\.?|nama|nim|daftar|lampiran|surat)\b/i',$line)) continue; if(!preg_match('/\b([A-Z0-9][A-Z0-9.\-\/]{3,})\b/u',$line,$m)) continue; $nim=trim($m[1]); $name=trim(str_replace($m[0],'',$line)); $name=preg_replace('/^\d+[\).\-\s]+/','',$name); $name=trim(preg_replace('/\b(L|P|LAKI-LAKI|PEREMPUAN)\b.*$/i','',$name)); if($name===''||strlen($name)<3) continue; $rows[]=['nama'=>$name,'nim'=>$nim,'kampus_asal'=>$batch->home_university,'_raw'=>$line]; } return $rows;
    }

    private function normalizeImportRows(array $rows, ExternalKknBatch $batch): array
    {
        return collect($rows)->values()->map(function($row,$idx)use($batch){ $nama=trim((string)($row['nama']??$row['name']??'')); $nim=trim((string)($row['nim']??$row['nim_asal']??$row['external_nim']??'')); $errors=[]; if($nama==='')$errors[]='Nama kosong'; if($nim==='')$errors[]='NIM kosong'; if($nim!==''&&ExternalStudentProfile::where('batch_id',$batch->id)->where('external_nim',$nim)->exists())$errors[]='Duplikat di batch'; return ['row'=>$idx+1,'nama'=>$nama,'nim'=>$nim,'kampus_asal'=>$row['kampus_asal']??$row['home_university']??$batch->home_university,'fakultas_asal'=>$row['fakultas_asal']??$row['external_faculty']??null,'prodi_asal'=>$row['prodi_asal']??$row['external_study_program']??null,'jenis_kelamin'=>$row['jenis_kelamin']??$row['gender']??null,'email'=>$row['email']??null,'no_hp'=>$row['no_hp']??$row['phone']??null,'tanggal_lahir'=>$row['tanggal_lahir']??$row['tgl_lahir']??$row['birth_date']??null,'alamat'=>$row['alamat']??$row['address']??null,'valid'=>count($errors)===0,'errors'=>$errors,'raw'=>$row['_raw']??null]; })->all();
    }

    private function findScopedBatch(int $batchId): ExternalKknBatch
    {
        $query = ExternalKknBatch::query()->whereKey($batchId);
        $this->scopeBatchesByFaculty($query);

        return $query->firstOrFail();
    }

    private function serializeExternalProfile(ExternalStudentProfile $profile): array
    {
        $peserta = $profile->mahasiswa?->peserta?->first();
        $kelompok = $peserta?->kelompok;
        $lokasi = $kelompok?->lokasi;

        return [
            'id' => $profile->id,
            'mahasiswa_id' => $profile->mahasiswa_id,
            'batch_id' => $profile->batch_id,
            'external_nim' => $profile->external_nim,
            'home_university' => $profile->home_university,
            'external_faculty' => $profile->external_faculty,
            'external_study_program' => $profile->external_study_program,
            'source_row_number' => $profile->source_row_number,
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
            'target_regency' => $profile->target_regency,
            'target_district' => $profile->target_district,
            'target_village' => $profile->target_village,
            'target_group' => $profile->target_group,
            'placement_notes' => $profile->placement_notes,
            'batch' => $profile->batch ? [
                'id' => $profile->batch->id,
                'periode_id' => $profile->batch->periode_id,
                'home_university' => $profile->batch->home_university,
                'target_regency' => $profile->batch->target_regency,
                'periode' => $profile->batch->periode ? [
                    'id' => $profile->batch->periode->id,
                    'name' => $profile->batch->periode->name,
                    'periode' => $profile->batch->periode->periode,
                ] : null,
            ] : null,
            'mahasiswa' => $profile->mahasiswa ? [
                'id' => $profile->mahasiswa->id,
                'user_id' => $profile->mahasiswa->user_id,
                'nim' => $profile->mahasiswa->nim,
                'nama' => $profile->mahasiswa->nama,
                'phone' => $profile->mahasiswa->phone,
                'user' => $profile->mahasiswa->user ? [
                    'id' => $profile->mahasiswa->user->id,
                    'username' => $profile->mahasiswa->user->username,
                    'name' => $profile->mahasiswa->user->name,
                    'email' => $profile->mahasiswa->user->email,
                    'phone' => $profile->mahasiswa->user->phone,
                ] : null,
                'peserta' => $peserta ? [[
                    'id' => $peserta->id,
                    'mahasiswa_id' => $peserta->mahasiswa_id,
                    'kelompok_id' => $peserta->kelompok_id,
                    'status' => $peserta->status,
                    'kelompok' => $kelompok ? [
                        'id' => $kelompok->id,
                        'nama_kelompok' => $kelompok->nama_kelompok,
                        'lokasi' => $lokasi ? [
                            'id' => $lokasi->id,
                            'regency_name' => $lokasi->regency_name,
                            'district_name' => $lokasi->district_name,
                            'village_name' => $lokasi->village_name,
                        ] : null,
                    ] : null,
                ]] : [],
            ] : null,
        ];
    }

    private function csvCell($value): string
    {
        $value = (string) $value;
        if ($value !== '' && preg_match('/^[=+\-@]/', $value)) {
            $value = "'".$value;
        }

        return '"'.str_replace('"', '""', $value).'"';
    }
}
