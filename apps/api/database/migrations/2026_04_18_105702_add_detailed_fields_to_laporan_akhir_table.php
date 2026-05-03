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
        Schema::table('laporan_akhir', function (Blueprint $table) {
            if (! Schema::hasColumn('laporan_akhir', 'abstract')) {
                $table->text('abstract')->nullable();
            }
            if (! Schema::hasColumn('laporan_akhir', 'file_path')) {
                $table->string('file_path')->nullable();
            }
            if (! Schema::hasColumn('laporan_akhir', 'file_name')) {
                $table->string('file_name')->nullable();
            }
            if (! Schema::hasColumn('laporan_akhir', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable();
            }
            if (! Schema::hasColumn('laporan_akhir', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
            if (! Schema::hasColumn('laporan_akhir', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('laporan_akhir', 'score')) {
                $table->decimal('score', 5, 2)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->dropColumn(['abstract', 'file_path', 'file_name', 'submitted_at', 'reviewed_at', 'reviewed_by', 'score']);
        });
    }
};
