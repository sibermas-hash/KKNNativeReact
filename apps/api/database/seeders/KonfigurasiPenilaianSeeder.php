<?php

namespace Database\Seeders;

use App\Models\KKN\KonfigurasiPenilaian;
use Illuminate\Database\Seeder;

class KonfigurasiPenilaianSeeder extends Seeder
{
    public function run(): void
    {
        KonfigurasiPenilaian::ensureDefaults();
    }
}
