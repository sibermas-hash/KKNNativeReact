<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Region\IndonesiaDistrict;
use App\Models\Region\IndonesiaRegency;
use App\Models\Region\IndonesiaVillage;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BackfillUserAddressRegionCodes extends Command
{
    protected $signature = 'regions:backfill-user-address-codes {--dry-run : Do not write changes}';

    protected $description = 'Backfill users.address_*_code from existing address text fields.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $updated = 0;
        $ambiguous = 0;
        $missing = 0;
        $skipped = 0;

        // Pre-load ALL region data into memory for fast lookups
        $this->info('Loading region master data into memory...');
        $villagesByName = [];
        foreach (IndonesiaVillage::query()->select('code', 'name', 'district_code')->cursor() as $v) {
            $key = $this->norm($v->name);
            if ($key !== '') {
                $villagesByName[$key][] = $v;
            }
        }

        $districtsByCode = [];
        foreach (IndonesiaDistrict::query()->select('code', 'name', 'regency_code')->cursor() as $d) {
            $districtsByCode[$d->code] = $d;
        }

        $regenciesByCode = [];
        foreach (IndonesiaRegency::query()->select('code', 'name', 'province_code')->cursor() as $r) {
            $regenciesByCode[$r->code] = $r;
        }

        $this->info(sprintf('Loaded: %d village names, %d districts, %d regencies',
            count($villagesByName), count($districtsByCode), count($regenciesByCode)));

        // Query only users with address_regency_name set (most selective)
        // Use chunkById to avoid loading all into memory
        $query = User::query()
            ->whereNotNull('address_regency_name')
            ->whereNull('address_village_code')
            ->select('id', 'address_village_name', 'address_district_name', 'address_regency_name', 'address_village_code');

        $total = $query->count();
        $this->info("Users to process: {$total}");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunkById(100, function ($users) use ($dryRun, &$updated, &$ambiguous, &$missing, &$skipped, $villagesByName, $districtsByCode, $regenciesByCode, $bar) {
            foreach ($users as $user) {
                $bar->advance();

                $villageName = $this->norm($user->address_village_name);
                $districtName = $this->norm($user->address_district_name);
                $regencyName = $this->norm($user->address_regency_name);

                if ($villageName === '' || $districtName === '' || $regencyName === '') {
                    $missing++;
                    continue;
                }

                // Find village by name
                $candidates = $villagesByName[$villageName] ?? [];
                if (empty($candidates)) {
                    $missing++;
                    continue;
                }

                $matches = [];
                foreach ($candidates as $village) {
                    $district = $districtsByCode[$village->district_code] ?? null;
                    if (! $district || $this->norm($district->name) !== $districtName) {
                        continue;
                    }
                    $regency = $regenciesByCode[$district->regency_code] ?? null;
                    if (! $regency || $this->norm($regency->name) !== $regencyName) {
                        continue;
                    }
                    $matches[] = [$village, $district, $regency];
                }

                if (count($matches) !== 1) {
                    if (count($matches) > 1) {
                        $ambiguous++;
                    } else {
                        $missing++;
                    }
                    continue;
                }

                [$village, $district, $regency] = $matches[0];
                $updated++;

                if (! $dryRun) {
                    DB::table('users')->where('id', $user->id)->update([
                        'address_province_code' => $regency->province_code,
                        'address_regency_code' => $regency->code,
                        'address_district_code' => $district->code,
                        'address_village_code' => $village->code,
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info(($dryRun ? 'Dry-run ' : '')."selesai: updated={$updated}, ambiguous={$ambiguous}, missing={$missing}, skipped={$skipped}");

        return self::SUCCESS;
    }

    private function norm(?string $value): string
    {
        return Str::of((string) $value)
            ->lower()
            ->replaceMatches('/\b(kabupaten|kecamatan|kelurahan|desa|kota|kab|kec|kel)\b/u', ' ')
            ->replaceMatches('/[^a-z0-9]+/u', ' ')
            ->squish()
            ->trim()
            ->toString();
    }
}
