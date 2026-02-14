<?php

namespace App\Console\Commands;

use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Periode;
use Illuminate\Console\Command;

class MakeKknPeriod extends Command
{
    protected $signature = 'kkn:make-period
        {--name= : Nama lengkap periode (mis. "[Angkatan 58] KKN Reguler")}
        {--angkatan= : Nomor angkatan (mis. 58)}
        {--jenis= : Jenis KKN (mis. "KKN Reguler")}
        {--year= : Nama/tahun academic_year (default: dari Tahun Akademik)}
        {--start= : Tanggal mulai KKN (YYYY-MM-DD)}
        {--end= : Tanggal selesai KKN (YYYY-MM-DD)}
        {--reg-start= : Tanggal mulai pendaftaran (YYYY-MM-DD)}
        {--reg-end= : Tanggal selesai pendaftaran (YYYY-MM-DD)}
        {--kuota= : Kuota pendaftaran (default: 2000)}
        {--active : Jadikan periode ini aktif (nonaktifkan lainnya)}';

    protected $description = 'Buat periode KKN baru dengan detail angkatan, jenis, dan kuota';

    public function handle(): int
    {
        $angkatan = $this->option('angkatan');
        $jenis = $this->option('jenis') ?: 'KKN Reguler';
        $name = $this->option('name') ?: "[Angkatan {$angkatan}] {$jenis}";
        $yearName = $this->option('year') ?: date('Y').'/'.(date('Y')+1);
        $start = $this->option('start');
        $end = $this->option('end');
        $regStart = $this->option('reg-start');
        $regEnd = $this->option('reg-end');
        $kuota = $this->option('kuota') ?: 2000;

        if (!$angkatan) {
            $this->error("Opsi --angkatan wajib diisi.");
            return self::FAILURE;
        }

        foreach (['start' => $start, 'end' => $end, 'reg-start' => $regStart, 'reg-end' => $regEnd] as $label => $val) {
            if (! $val) {
                $this->error("Opsi --{$label} wajib diisi (YYYY-MM-DD).");
                return self::FAILURE;
            }
        }

        $ay = TahunAkademik::firstOrCreate(
            ['year' => $yearName],
            ['is_active' => false],
        );

        if ($this->option('active')) {
            TahunAkademik::where('id', '!=', $ay->id)->update(['is_active' => false]);
            $ay->is_active = true;
            $ay->save();
        }

        $period = Periode::create([
            'academic_year_id' => $ay->id,
            'angkatan' => $angkatan,
            'jenis' => $jenis,
            'name' => $name,
            'start_date' => $start,
            'end_date' => $end,
            'registration_start' => $regStart,
            'registration_end' => $regEnd,
            'kuota' => $kuota,
            'is_active' => $this->option('active') ? true : false,
        ]);

        if ($period->is_active) {
            Periode::where('id', '!=', $period->id)->update(['is_active' => false]);
        }

        $this->info("Periode dibuat: ID={$period->id}, AcademicYear={$ay->year}");
        return self::SUCCESS;
    }
}
