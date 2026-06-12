<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS peserta_kkn_once_ever_kkn_idx ON peserta_kkn (mahasiswa_id) WHERE deleted_at IS NULL AND (kelompok_id IS NOT NULL OR status IN ('approved','document_verified','completed'))");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS peserta_kkn_once_ever_kkn_idx');
    }
};
