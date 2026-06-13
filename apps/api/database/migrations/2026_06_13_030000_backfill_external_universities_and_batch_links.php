<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('external_universities') || ! Schema::hasTable('external_kkn_batches')) {
            return;
        }

        $now = now();
        $universities = [
            'UINJKT' => 'UIN Syarif Hidayatullah Jakarta',
            'ANNUQAYAH' => 'Universitas Annuqayah',
            'UINSGD' => 'UNIVERSITAS ISLAM NEGERI SUNAN GUNUNG DJATI BANDUNG',
            'UINGUSDUR' => 'UIN K.H. Abdurrahman Wahid Pekalongan',
        ];

        foreach ($universities as $code => $name) {
            $exists = DB::table('external_universities')->where('code', $code)->exists();

            if ($exists) {
                DB::table('external_universities')->where('code', $code)->update([
                    'name' => $name,
                    'status' => 'active',
                    'updated_at' => $now,
                    'deleted_at' => null,
                ]);
            } else {
                DB::table('external_universities')->insert([
                    'code' => $code,
                    'name' => $name,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        foreach ($universities as $code => $name) {
            $universityId = DB::table('external_universities')
                ->where('code', $code)
                ->value('id');

            if (! $universityId) {
                continue;
            }

            DB::table('external_kkn_batches')
                ->whereNull('external_university_id')
                ->whereRaw('LOWER(home_university) = LOWER(?)', [$name])
                ->update([
                    'external_university_id' => $universityId,
                    'updated_at' => $now,
                ]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('external_universities') || ! Schema::hasTable('external_kkn_batches')) {
            return;
        }

        $codes = ['UINJKT', 'ANNUQAYAH', 'UINGUSDUR'];
        $ids = DB::table('external_universities')->whereIn('code', $codes)->pluck('id');

        if ($ids->isNotEmpty()) {
            DB::table('external_kkn_batches')
                ->whereIn('external_university_id', $ids)
                ->update(['external_university_id' => null, 'updated_at' => now()]);
        }

        DB::table('external_universities')->whereIn('code', $codes)->delete();
    }
};
