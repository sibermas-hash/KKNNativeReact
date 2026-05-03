<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('peserta_kkn')) {
            return;
        }

        Schema::table('peserta_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('peserta_kkn', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('notes');
            }

            if (! Schema::hasColumn('peserta_kkn', 'last_rejected_at')) {
                $table->timestamp('last_rejected_at')->nullable()->after('approved_by');
            }

            if (! Schema::hasColumn('peserta_kkn', 'last_rejected_by')) {
                $table->foreignId('last_rejected_by')->nullable()->after('last_rejected_at')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('peserta_kkn', 'resubmitted_at')) {
                $table->timestamp('resubmitted_at')->nullable()->after('last_rejected_by');
            }

            if (! Schema::hasColumn('peserta_kkn', 'revision_count')) {
                $table->unsignedInteger('revision_count')->default(0)->after('resubmitted_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('peserta_kkn')) {
            return;
        }

        Schema::table('peserta_kkn', function (Blueprint $table) {
            if (Schema::hasColumn('peserta_kkn', 'last_rejected_by')) {
                $table->dropConstrainedForeignId('last_rejected_by');
            }

            foreach (['rejection_reason', 'last_rejected_at', 'resubmitted_at', 'revision_count'] as $column) {
                if (Schema::hasColumn('peserta_kkn', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
