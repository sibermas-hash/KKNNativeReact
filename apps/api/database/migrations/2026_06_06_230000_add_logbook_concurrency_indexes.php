<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('kegiatan_kkn')) {
            return;
        }

        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS kegiatan_kkn_mahasiswa_date_unique_live ON kegiatan_kkn (mahasiswa_id, date) WHERE deleted_at IS NULL');
        DB::statement('CREATE INDEX IF NOT EXISTS kegiatan_kkn_kelompok_status_date_idx ON kegiatan_kkn (kelompok_id, status, date) WHERE deleted_at IS NULL');
        if (Schema::hasTable('file_kegiatan_kkn')) {
            DB::statement('CREATE INDEX IF NOT EXISTS file_kegiatan_kkn_kegiatan_idx ON file_kegiatan_kkn (kegiatan_kkn_id) WHERE deleted_at IS NULL');
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS file_kegiatan_kkn_kegiatan_idx');
        DB::statement('DROP INDEX IF EXISTS kegiatan_kkn_kelompok_status_date_idx');
        DB::statement('DROP INDEX IF EXISTS kegiatan_kkn_mahasiswa_date_unique_live');
    }
};
