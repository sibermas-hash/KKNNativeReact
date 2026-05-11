<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit fix: dosen.fakultas_id is legitimately absent for external (LB-*)
 * lecturers in SIAKAD. The NOT NULL constraint caused ~50% of the dosen
 * sync to fail at the DB layer even after the application layer allowed
 * null (see sync:master-data monitoring on 2026-05-09).
 *
 * Making it nullable matches reality: not every lecturer belongs to a
 * fakultas. Admins can assign one manually via the admin UI when needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dosen', function (Blueprint $table) {
            // Drop + recreate because ->change() on a FK column with Postgres
            // via doctrine is fiddly. Using raw SQL is cleaner.
        });

        // Postgres-safe ALTER — keeps the FK but relaxes NOT NULL.
        DB::statement(
            'ALTER TABLE dosen ALTER COLUMN fakultas_id DROP NOT NULL'
        );
    }

    public function down(): void
    {
        // Backfill any NULLs with the first fakultas before reinstating NOT NULL,
        // otherwise the rollback would fail.
        DB::statement(
            'UPDATE dosen SET fakultas_id = (SELECT id FROM fakultas ORDER BY id ASC LIMIT 1) WHERE fakultas_id IS NULL'
        );

        DB::statement(
            'ALTER TABLE dosen ALTER COLUMN fakultas_id SET NOT NULL'
        );
    }
};
