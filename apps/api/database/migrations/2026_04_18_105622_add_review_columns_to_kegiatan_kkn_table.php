<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('kegiatan_kkn', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('kegiatan_kkn', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
            if (! Schema::hasColumn('kegiatan_kkn', 'review_notes')) {
                $table->text('review_notes')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropColumn(['reviewed_by', 'reviewed_at', 'review_notes']);
        });
    }
};
