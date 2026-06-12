<?php

use App\Models\KKN\Periode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('periode')) {
            return;
        }

        DB::table('periode')
            ->where('jenis', 'RESPONSIF')
            ->update([
                'jenis' => 'TEMATIK',
                'program_type' => Periode::PROGRAM_TYPE_TEMATIK,
                'program_subtype' => null,
                'registration_mode' => Periode::REGISTRATION_MODE_PROPOSAL_BASED,
                'placement_mode' => Periode::PLACEMENT_MODE_PROPOSAL_DEFINED,
            ]);
    }

    public function down(): void
    {
        // Irreversible on purpose: data is normalized to the canonical thematic governance model.
    }
};
