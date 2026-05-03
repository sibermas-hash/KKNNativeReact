<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sync_logs')) {
            return;
        }

        $this->updateEntityTypeConstraint([
            'mahasiswa',
            'dosen',
            'all',
            'fakultas',
            'program',
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('sync_logs')) {
            return;
        }

        $this->updateEntityTypeConstraint([
            'mahasiswa',
            'dosen',
            'all',
            'fakultas',
        ]);
    }

    private function updateEntityTypeConstraint(array $allowedValues): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $constraints = DB::select("
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'sync_logs'::regclass
                  AND contype = 'c'
                  AND pg_get_constraintdef(oid) LIKE '%entity_type%'
            ");

            foreach ($constraints as $constraint) {
                DB::statement(sprintf('ALTER TABLE sync_logs DROP CONSTRAINT "%s"', $constraint->conname));
            }

            $list = implode("', '", $allowedValues);
            DB::statement("ALTER TABLE sync_logs ADD CONSTRAINT sync_logs_entity_type_check CHECK (entity_type IN ('{$list}'))");

            return;
        }

        if ($driver === 'mysql') {
            $list = implode("','", $allowedValues);
            DB::statement("ALTER TABLE sync_logs MODIFY entity_type ENUM('{$list}') NOT NULL");
        }
    }
};
