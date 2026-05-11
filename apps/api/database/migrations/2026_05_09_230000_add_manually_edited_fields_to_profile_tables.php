<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Field-level lock: tracks which fields on each record have been edited by
 * admin/mahasiswa and therefore MUST NOT be overwritten by subsequent SIAKAD
 * syncs. The list is a simple JSON array of field names.
 *
 * Populated automatically:
 *   - ProfileController::applyProfileChanges (first-time onboarding)
 *   - ProfileChangeRequestController::approve (subsequent edits)
 *
 * Released via superadmin "Unlock field" action (only allowed for mahasiswa
 * yang BELUM pernah KKN).
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['users', 'mahasiswa', 'dosen'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->json('manually_edited_fields')->nullable()->after('updated_at');
            });
        }
    }

    public function down(): void
    {
        foreach (['users', 'mahasiswa', 'dosen'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('manually_edited_fields');
            });
        }
    }
};
