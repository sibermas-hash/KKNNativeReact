<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('jenis_kkn')
            ->whereIn('code', ['RESPONSIF', 'RES'])
            ->update([
                'registration_mode' => 'open',
                'placement_mode' => 'self_determined',
                'requires_interview' => false,
            ]);
    }

    public function down(): void
    {
        // Data-alignment migration; intentionally no destructive rollback.
    }
};
