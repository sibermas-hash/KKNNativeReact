<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Fix broken foreign key constraints after table renames.
     * When tables were renamed, FK constraints still reference old table names.
     */
    public function up(): void
    {
        // Fix proposal_program_kerja (proposal_proker) FK
        // Drop old FK if exists and add new FK to program_kerja
        if (Schema::hasTable('proposal_proker')) {
            Schema::table('proposal_proker', function (Blueprint $table) {
                // Drop old FK to work_programs if exists
                $foreignKeys = Schema::getForeignKeys('proposal_proker');
                foreach ($foreignKeys as $fk) {
                    if ($fk['foreign_table_name'] === 'work_programs' || $fk['foreign_table_name'] === 'program_kerja') {
                        $table->dropForeign($fk['name']);
                    }
                }
                
                // Add correct FK
                $table->foreignId('program_kerja_id')
                    ->constrained('program_kerja')
                    ->cascadeOnDelete();
            });
        }

        // Add missing indexes for performance
        if (Schema::hasTable('laporan_akhir') && !Schema::hasIndex('laporan_akhir', 'idx_laporan_mahasiswa')) {
            Schema::table('laporan_akhir', function (Blueprint $table) {
                $table->index('mahasiswa_id', 'idx_laporan_mahasiswa');
            });
        }

        if (Schema::hasTable('monitoring_dpl') && !Schema::hasIndex('monitoring_dpl', 'idx_monitoring_periode')) {
            Schema::table('monitoring_dpl', function (Blueprint $table) {
                $table->index('periode_id', 'idx_monitoring_periode');
            });
        }

        if (Schema::hasTable('slot_terkunci') && !Schema::hasIndex('slot_terkunci', 'idx_slot_fakultas')) {
            Schema::table('slot_terkunci', function (Blueprint $table) {
                $table->index('fakultas_id', 'idx_slot_fakultas');
            });
        }

        if (Schema::hasTable('slot_terkunci') && !Schema::hasIndex('slot_terkunci', 'idx_slot_prodi')) {
            Schema::table('slot_terkunci', function (Blueprint $table) {
                $table->index('prodi_id', 'idx_slot_prodi');
            });
        }

        // Add CHECK constraint to ensure slot_terkunci has only one type filled
        // Note: This is database-level validation
        if (Schema::hasTable('slot_terkunci')) {
            DB::statement("
                ALTER TABLE slot_terkunci 
                ADD CONSTRAINT chk_slot_terkunci_type_consistency 
                CHECK (
                    (tipe_slot = 'fakultas' AND prodi_id IS NULL) OR 
                    (tipe_slot = 'prodi' AND fakultas_id IS NULL)
                )
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('proposal_proker')) {
            Schema::table('proposal_proker', function (Blueprint $table) {
                $foreignKeys = Schema::getForeignKeys('proposal_proker');
                foreach ($foreignKeys as $fk) {
                    if ($fk['foreign_table_name'] === 'program_kerja') {
                        $table->dropForeign($fk['name']);
                    }
                }
            });
        }

        if (Schema::hasTable('slot_terkunci')) {
            try {
                DB::statement("ALTER TABLE slot_terkunci DROP CONSTRAINT chk_slot_terkunci_type_consistency");
            } catch (\Exception $e) {
                // Constraint might not exist, ignore
            }
        }
    }
};
