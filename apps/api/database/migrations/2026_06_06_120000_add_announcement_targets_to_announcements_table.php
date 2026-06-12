<?php

declare(strict_types=1);

use App\Models\KKN\Announcement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table): void {
            $table->json('announcement_targets')->nullable()->after('popup_dismissable');
        });

        DB::table('announcements')->update([
            'announcement_targets' => json_encode([Announcement::TARGET_PUBLIC_HOME]),
        ]);
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table): void {
            $table->dropColumn('announcement_targets');
        });
    }
};
