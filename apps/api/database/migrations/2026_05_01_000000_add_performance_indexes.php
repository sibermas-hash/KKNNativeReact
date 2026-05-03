<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // laporan_akhir — missing indexes on frequently queried columns
        if (Schema::hasTable('laporan_akhir')) {
            Schema::table('laporan_akhir', function (Blueprint $table) {
                if (! $this->indexExists('laporan_akhir', 'kelompok_id')) {
                    $table->index('kelompok_id');
                }
                if (! $this->indexExists('laporan_akhir', 'mahasiswa_id')) {
                    $table->index('mahasiswa_id');
                }
                if (! $this->indexExists('laporan_akhir', 'status')) {
                    $table->index('status');
                }
                if (! $this->indexExists('laporan_akhir', 'submitted_at')) {
                    $table->index('submitted_at');
                }
            });
        }

        // izin_meninggalkan — missing indexes
        if (Schema::hasTable('izin_meninggalkan')) {
            Schema::table('izin_meninggalkan', function (Blueprint $table) {
                if (! $this->indexExists('izin_meninggalkan', 'mahasiswa_id')) {
                    $table->index('mahasiswa_id');
                }
                if (! $this->indexExists('izin_meninggalkan', 'kelompok_id')) {
                    $table->index('kelompok_id');
                }
                if (! $this->indexExists('izin_meninggalkan', 'status')) {
                    $table->index('status');
                }
                if (! $this->indexExists('izin_meninggalkan', 'created_at')) {
                    $table->index('created_at');
                }
            });
        }

        // file_kegiatan_kkn — missing index on FK
        if (Schema::hasTable('file_kegiatan_kkn')) {
            Schema::table('file_kegiatan_kkn', function (Blueprint $table) {
                if (! $this->indexExists('file_kegiatan_kkn', 'kegiatan_kkn_id')) {
                    $table->index('kegiatan_kkn_id');
                }
            });
        }

        // program_kerja — missing index on kelompok_id
        if (Schema::hasTable('program_kerja')) {
            Schema::table('program_kerja', function (Blueprint $table) {
                if (! $this->indexExists('program_kerja', 'kelompok_id')) {
                    $table->index('kelompok_id');
                }
            });
        }

        // announcements — missing indexes on frequently queried columns
        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (! $this->indexExists('announcements', 'published_at')) {
                    $table->index('published_at');
                }
                if (! $this->indexExists('announcements', 'is_active')) {
                    $table->index('is_active');
                }
            });
        }

        // downloads — missing index on created_at
        if (Schema::hasTable('downloads')) {
            Schema::table('downloads', function (Blueprint $table) {
                if (! $this->indexExists('downloads', 'created_at')) {
                    $table->index('created_at');
                }
            });
        }

        // kelompok_kkn — missing index on location_id
        if (Schema::hasTable('kelompok_kkn')) {
            Schema::table('kelompok_kkn', function (Blueprint $table) {
                if (! $this->indexExists('kelompok_kkn', 'location_id')) {
                    $table->index('location_id');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->dropIndex(['kelompok_id']);
            $table->dropIndex(['mahasiswa_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['submitted_at']);
        });

        Schema::table('izin_meninggalkan', function (Blueprint $table) {
            $table->dropIndex(['mahasiswa_id']);
            $table->dropIndex(['kelompok_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('file_kegiatan_kkn', function (Blueprint $table) {
            $table->dropIndex(['kegiatan_kkn_id']);
        });

        Schema::table('program_kerja', function (Blueprint $table) {
            $table->dropIndex(['kelompok_id']);
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex(['published_at']);
            $table->dropIndex(['is_active']);
        });

        Schema::table('downloads', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('kelompok_kkn', function (Blueprint $table) {
            $table->dropIndex(['location_id']);
        });
    }

    private function indexExists(string $table, string $column): bool
    {
        try {
            $driver = \Illuminate\Support\Facades\DB::getDriverName();
            if ($driver === 'sqlite') {
                $indexes = \Illuminate\Support\Facades\DB::select("PRAGMA index_list({$table})");
                foreach ($indexes as $index) {
                    $info = \Illuminate\Support\Facades\DB::select("PRAGMA index_info({$index->name})");
                    foreach ($info as $col) {
                        if ($col->name === $column) return true;
                    }
                }
                return false;
            }
            if ($driver === 'pgsql') {
                $result = \Illuminate\Support\Facades\DB::select(
                    "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexdef LIKE ? LIMIT 1",
                    [$table, "%({$column})%"]
                );
                return count($result) > 0;
            }
            // MySQL fallback
            $indexes = \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM {$table} WHERE Column_name = ?", [$column]);
            return count($indexes) > 0;
        } catch (\Throwable $e) {
            return false;
        }
    }
};
