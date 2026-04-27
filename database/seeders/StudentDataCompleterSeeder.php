<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\KKN\Mahasiswa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class StudentDataCompleterSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('id_ID');
        $mahasiswas = Mahasiswa::with('user')->get();

        $this->command->info("Melengkapi data random untuk " . $mahasiswas->count() . " mahasiswa...");

        DB::beginTransaction();
        try {
            foreach ($mahasiswas as $mahasiswa) {
                // 1. Random BTA PPI Status
                $isPassed = $faker->boolean(70); // 70% Peluang Lulus
                $status = $isPassed ? 'LULUS' : 'TIDAK LULUS';

                $mahasiswa->update([
                    'birth_place' => $faker->city,
                    'birth_date' => $faker->date('Y-m-d', '2005-12-31'),
                    'university' => 'UIN Saizu Purwokerto',
                    'status_bta_ppi' => $status,
                    'is_bta_ppi_passed' => $isPassed,
                ]);

                // 2. Random User Domicile Data
                if ($mahasiswa->user) {
                    $mahasiswa->user->update([
                        'address' => $faker->address,
                        'domicile_village_name' => $faker->village,
                        'domicile_district_name' => $faker->district,
                        'domicile_regency_name' => $faker->regency,
                        'address_verified_at' => $faker->boolean(80) ? now() : null, // 80% Peluang sudah diverifikasi
                    ]);
                }
            }

            DB::commit();
            $this->command->info("Data mahasiswa berhasil dilengkapi secara acak.");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Gagal melengkapi data: " . $e->getMessage());
        }
    }
}
