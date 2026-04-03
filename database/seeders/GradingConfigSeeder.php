<?php

namespace Database\Seeders;

use App\Models\KKN\KonfigurasiPenilaian as GradingConfig;
use Illuminate\Database\Seeder;

class GradingConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        GradingConfig::ensureDefaults();
    }
}
