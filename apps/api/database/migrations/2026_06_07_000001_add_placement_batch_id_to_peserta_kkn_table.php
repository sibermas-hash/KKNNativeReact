<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table): void {
            if (! Schema::hasColumn('peserta_kkn', 'placement_batch_id')) {
                $table->string('placement_batch_id', 64)->nullable()->after('placement_published_by')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('peserta_kkn', function (Blueprint $table): void {
            if (Schema::hasColumn('peserta_kkn', 'placement_batch_id')) {
                $table->dropIndex(['placement_batch_id']);
                $table->dropColumn('placement_batch_id');
            }
        });
    }
};
