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

        DB::table('periode')
            ->select(['id', 'jenis'])
            ->orderBy('id')
            ->get()
            ->each(function (object $period): void {
                $governance = Periode::governanceBlueprint(
                    legacyJenis: $period->jenis,
                );

                DB::table('periode')
                    ->where('id', $period->id)
                    ->update([
                        'program_type' => $governance['program_type'],
                        'program_subtype' => $governance['program_subtype'],
                        'registration_mode' => $governance['registration_mode'],
                        'placement_mode' => $governance['placement_mode'],
                    ]);
            });
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
