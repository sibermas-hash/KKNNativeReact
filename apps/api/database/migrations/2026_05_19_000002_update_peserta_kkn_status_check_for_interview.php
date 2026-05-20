<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS peserta_kkn_status_check');
        DB::statement("ALTER TABLE peserta_kkn ADD CONSTRAINT peserta_kkn_status_check CHECK (status::text = ANY (ARRAY['pending','document_submitted','document_verified','approved','rejected','cancelled','completed','interview_scheduled']::text[]))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE peserta_kkn DROP CONSTRAINT IF EXISTS peserta_kkn_status_check');
        DB::statement("ALTER TABLE peserta_kkn ADD CONSTRAINT peserta_kkn_status_check CHECK (status::text = ANY (ARRAY['pending','document_submitted','document_verified','approved','rejected','cancelled','completed']::text[]))");
    }
};
