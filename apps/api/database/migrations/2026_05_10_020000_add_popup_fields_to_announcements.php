<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Announcement-as-popup capability.
 *
 * Admin flags an announcement with `show_as_popup = true` and optionally
 * an expiry via `popup_until`. The public endpoint
 * `GET /api/v1/public/popup-announcement` returns the latest such row
 * whose publish window is active and whose popup window has not expired.
 *
 * `popup_dismissable` controls whether the client shows a "Jangan
 * ingatkan lagi" button — true by default (users can permanently opt out
 * via localStorage per announcement id). Admin can flip it off for truly
 * critical notices (e.g. scheduled outage) that should return on every
 * page load even after the user dismissed it once.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $t) {
            $t->boolean('show_as_popup')->default(false)->after('is_active');
            $t->timestamp('popup_until')->nullable()->after('show_as_popup');
            $t->boolean('popup_dismissable')->default(true)->after('popup_until');
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $t) {
            $t->dropColumn(['show_as_popup', 'popup_until', 'popup_dismissable']);
        });
    }
};
