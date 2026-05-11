<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-user notification channel preferences.
 *
 * Structure (stored as JSON; nullable — null means "use defaults"):
 * {
 *   "in_app": true,
 *   "email":  true,
 *   "push":   true
 * }
 *
 * Future: add per-type overrides via nested keys, e.g.
 * { "in_app": true, "types": { "laporan_approval": { "email": false } } }.
 * Deliberately NOT included now — YAGNI until the notification taxonomy
 * stabilizes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->json('notification_preferences')->nullable()->after('manually_edited_fields');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn('notification_preferences');
        });
    }
};
