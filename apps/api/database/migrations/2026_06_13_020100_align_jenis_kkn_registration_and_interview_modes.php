<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('jenis_kkn')->where('code', 'REGULER')->update([
            'registration_mode' => 'open',
            'placement_mode' => 'automatic_after_approval',
            'requires_interview' => false,
        ]);

        DB::table('jenis_kkn')->where('code', 'TEMATIK')->update([
            'registration_mode' => 'proposal_based',
            'placement_mode' => 'proposal_defined',
            'requires_interview' => false,
        ]);

        DB::table('jenis_kkn')->where('code', 'NUSANTARA')->update([
            'registration_mode' => 'selective',
            'placement_mode' => 'manual_admin',
            'requires_interview' => true,
        ]);

        DB::table('jenis_kkn')->where('code', 'INTERNASIONAL')->update([
            'registration_mode' => 'selective',
            'placement_mode' => 'host_defined',
            'requires_interview' => true,
        ]);

        DB::table('jenis_kkn')->where('code', 'KOLABORASI_PTKIN')->update([
            'registration_mode' => 'selective',
            'placement_mode' => 'host_defined',
            'requires_interview' => false,
        ]);

        DB::table('jenis_kkn')
            ->whereNotIn('code', ['REGULER', 'TEMATIK', 'NUSANTARA', 'INTERNASIONAL', 'KOLABORASI_PTKIN'])
            ->update([
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'requires_interview' => false,
            ]);
    }

    public function down(): void
    {
        // Data-alignment migration; intentionally no destructive rollback.
    }
};
