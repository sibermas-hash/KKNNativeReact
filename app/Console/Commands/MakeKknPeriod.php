<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Period;
use Illuminate\Console\Command;

class MakeKknPeriod extends Command
{
    protected $signature = 'kkn:make-period
        {--name= : Nama periode/angkatan (mis. "Angkatan 58")}
        {--year= : Nama/tahun academic_year (default: sama dengan --name)}
        {--start= : Tanggal mulai KKN (YYYY-MM-DD)}
        {--end= : Tanggal selesai KKN (YYYY-MM-DD)}
        {--reg-start= : Tanggal mulai pendaftaran (YYYY-MM-DD)}
        {--reg-end= : Tanggal selesai pendaftaran (YYYY-MM-DD)}
        {--active : Jadikan periode ini aktif (nonaktifkan lainnya)}';

    protected $description = 'Buat periode KKN baru dengan academic year, siap untuk import roster';

    public function handle(): int
    {
        $name = $this->option('name') ?: 'Angkatan '.date('y');
        $yearName = $this->option('year') ?: $name;
        $start = $this->option('start');
        $end = $this->option('end');
        $regStart = $this->option('reg-start');
        $regEnd = $this->option('reg-end');

        foreach (['start' => $start, 'end' => $end, 'reg-start' => $regStart, 'reg-end' => $regEnd] as $label => $val) {
            if (! $val) {
                $this->error("Opsi --{$label} wajib diisi (YYYY-MM-DD).");
                return self::FAILURE;
            }
        }

        $ay = AcademicYear::firstOrCreate(
            ['year' => $yearName],
            ['is_active' => false],
        );

        if ($this->option('active')) {
            AcademicYear::where('id', '!=', $ay->id)->update(['is_active' => false]);
            $ay->is_active = true;
            $ay->save();
        }

        $period = Period::create([
            'academic_year_id' => $ay->id,
            'name' => $name,
            'start_date' => $start,
            'end_date' => $end,
            'registration_start' => $regStart,
            'registration_end' => $regEnd,
            'is_active' => $this->option('active') ? true : false,
        ]);

        if ($period->is_active) {
            Period::where('id', '!=', $period->id)->update(['is_active' => false]);
        }

        $this->info("Periode dibuat: ID={$period->id}, AcademicYear={$ay->year}");
        return self::SUCCESS;
    }
}
