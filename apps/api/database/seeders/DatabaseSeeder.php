<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $seeders = [
            RoleSeeder::class,
            PermissionSeeder::class,
            SuperAdminSeeder::class,       // ← Superadmin (semua environment)
            MasterDataSeeder::class,
            KonfigurasiPenilaianSeeder::class,
            KonfigurasiSertifikatSeeder::class,
            JenisKknSeeder::class,
            SystemSettingSeeder::class,
        ];

        if (app()->environment('local')) {
            $seeders[] = AdminUserSeeder::class;
            $seeders[] = SampleUserSeeder::class;
        }

        $this->call($seeders);
    }
}
