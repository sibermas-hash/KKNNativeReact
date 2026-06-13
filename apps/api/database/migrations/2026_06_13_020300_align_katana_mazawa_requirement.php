<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $mazawaId = DB::table('prodi')
            ->where('code', 'MZW')
            ->orWhere('nama', 'ilike', '%Manajemen Zakat%')
            ->value('id');

        if (! $mazawaId) {
            return;
        }

        $rows = DB::table('jenis_kkn')
            ->whereIn('code', ['KAMPUNG_ZAKAT_KATANA', 'KAMPUNG_ZAKAT', 'DESA_KATANA'])
            ->get(['id', 'requirements_config']);

        foreach ($rows as $row) {
            $config = json_decode((string) $row->requirements_config, true);
            if (! is_array($config)) {
                $config = [];
            }
            $config['specific_prodi_ids'] = [(int) $mazawaId];

            DB::table('jenis_kkn')->where('id', $row->id)->update([
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'requires_interview' => false,
                'requirements_config' => json_encode($config),
            ]);
        }
    }

    public function down(): void
    {
        // Data-alignment migration; intentionally no destructive rollback.
    }
};
