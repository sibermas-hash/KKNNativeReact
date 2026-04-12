<?php

use App\Models\KKN\Periode;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            if (! Schema::hasColumn('periode', 'program_type')) {
                $table->string('program_type', 50)->default(Periode::PROGRAM_TYPE_REGULER)->after('jenis');
            }

            if (! Schema::hasColumn('periode', 'program_subtype')) {
                $table->string('program_subtype', 50)->nullable()->after('program_type');
            }

            if (! Schema::hasColumn('periode', 'registration_mode')) {
                $table->string('registration_mode', 50)->default(Periode::REGISTRATION_MODE_OPEN)->after('program_subtype');
            }

            if (! Schema::hasColumn('periode', 'placement_mode')) {
                $table->string('placement_mode', 50)->default(Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL)->after('registration_mode');
            }
        });

        // Backfill existing periods with defaults based on jenis
        DB::table('periode')
            ->whereNull('program_type')
            ->orWhere('program_type', '')
            ->update([
                'program_type' => Periode::PROGRAM_TYPE_REGULER,
                'program_subtype' => null,
                'registration_mode' => Periode::REGISTRATION_MODE_OPEN,
                'placement_mode' => Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
            ]);
    }

    public function down(): void
    {
        Schema::table('periode', function (Blueprint $table) {
            $columns = collect([
                'program_type',
                'program_subtype',
                'registration_mode',
                'placement_mode',
            ])->filter(fn (string $column) => Schema::hasColumn('periode', $column))->all();

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
