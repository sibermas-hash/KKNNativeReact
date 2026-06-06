<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table): void {
            if (! Schema::hasColumn('peserta_kkn', 'placement_is_live')) {
                $table->boolean('placement_is_live')->default(false)->after('kelompok_id');
            }
            if (! Schema::hasColumn('peserta_kkn', 'placement_published_at')) {
                $table->timestamp('placement_published_at')->nullable()->after('placement_is_live');
            }
            if (! Schema::hasColumn('peserta_kkn', 'placement_published_by')) {
                $table->foreignId('placement_published_by')->nullable()->after('placement_published_at')->constrained('users')->nullOnDelete();
            }
        });

        DB::table('peserta_kkn')
            ->whereNotNull('kelompok_id')
            ->update(['placement_is_live' => true]);
    }

    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table): void {
            if (Schema::hasColumn('peserta_kkn', 'placement_published_by')) {
                $table->dropConstrainedForeignId('placement_published_by');
            }
            if (Schema::hasColumn('peserta_kkn', 'placement_published_at')) {
                $table->dropColumn('placement_published_at');
            }
            if (Schema::hasColumn('peserta_kkn', 'placement_is_live')) {
                $table->dropColumn('placement_is_live');
            }
        });
    }
};
