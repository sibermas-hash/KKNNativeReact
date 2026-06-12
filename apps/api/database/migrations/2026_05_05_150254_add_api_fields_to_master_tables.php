<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Align Mahasiswa Table
        if (Schema::hasTable('mahasiswa')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                if (! Schema::hasColumn('mahasiswa', 'alamat')) {
                    $table->text('alamat')->nullable()->after('birth_date');
                }
                if (! Schema::hasColumn('mahasiswa', 'phone')) {
                    $table->string('phone', 20)->nullable()->after('alamat');
                }
                if (! Schema::hasColumn('mahasiswa', 'status_aktif')) {
                    $table->string('status_aktif', 50)->nullable()->after('is_paid_ukt');
                }
                if (! Schema::hasColumn('mahasiswa', 'nik')) {
                    $table->string('nik', 32)->nullable()->after('nim');
                }
                // birth_place is already there but API uses birth_place
            });
        }

        // 2. Align Dosen Table
        if (Schema::hasTable('dosen')) {
            Schema::table('dosen', function (Blueprint $table) {
                if (! Schema::hasColumn('dosen', 'status_aktif')) {
                    $table->string('status_aktif', 50)->nullable()->after('is_tugas_belajar');
                }
                if (! Schema::hasColumn('dosen', 'status_pegawai')) {
                    $table->string('status_pegawai', 50)->nullable()->after('status_aktif');
                }
                if (! Schema::hasColumn('dosen', 'no_rekening')) {
                    $table->string('no_rekening', 50)->nullable();
                }
                if (! Schema::hasColumn('dosen', 'nama_bank')) {
                    $table->string('nama_bank', 100)->nullable();
                }
            });
        }

        // 3. Align Fakultas Table
        if (Schema::hasTable('fakultas')) {
            Schema::table('fakultas', function (Blueprint $table) {
                if (! Schema::hasColumn('fakultas', 'short_name')) {
                    $table->string('short_name', 20)->nullable()->after('nama');
                }
            });
        }

        // 4. Align Prodi Table
        if (Schema::hasTable('prodi')) {
            Schema::table('prodi', function (Blueprint $table) {
                if (! Schema::hasColumn('prodi', 'short_name')) {
                    $table->string('short_name', 20)->nullable()->after('nama');
                }
                if (! Schema::hasColumn('prodi', 'jenjang')) {
                    $table->string('jenjang', 10)->nullable()->after('short_name');
                }
            });
        }
    }

    public function down(): void
    {
        // 1. Drop Mahasiswa columns
        if (Schema::hasTable('mahasiswa')) {
            Schema::table('mahasiswa', function (Blueprint $table) {
                if (Schema::hasColumn('mahasiswa', 'alamat')) {
                    $table->dropColumn('alamat');
                }
                if (Schema::hasColumn('mahasiswa', 'phone')) {
                    $table->dropColumn('phone');
                }
                if (Schema::hasColumn('mahasiswa', 'status_aktif')) {
                    $table->dropColumn('status_aktif');
                }
                if (Schema::hasColumn('mahasiswa', 'nik')) {
                    $table->dropColumn('nik');
                }
            });
        }

        // 2. Drop Dosen columns
        if (Schema::hasTable('dosen')) {
            Schema::table('dosen', function (Blueprint $table) {
                if (Schema::hasColumn('dosen', 'status_aktif')) {
                    $table->dropColumn('status_aktif');
                }
                if (Schema::hasColumn('dosen', 'status_pegawai')) {
                    $table->dropColumn('status_pegawai');
                }
                if (Schema::hasColumn('dosen', 'no_rekening')) {
                    $table->dropColumn('no_rekening');
                }
                if (Schema::hasColumn('dosen', 'nama_bank')) {
                    $table->dropColumn('nama_bank');
                }
            });
        }

        // 3. Drop Fakultas columns
        if (Schema::hasTable('fakultas')) {
            Schema::table('fakultas', function (Blueprint $table) {
                if (Schema::hasColumn('fakultas', 'short_name')) {
                    $table->dropColumn('short_name');
                }
            });
        }

        // 4. Drop Prodi columns
        if (Schema::hasTable('prodi')) {
            Schema::table('prodi', function (Blueprint $table) {
                if (Schema::hasColumn('prodi', 'short_name')) {
                    $table->dropColumn('short_name');
                }
                if (Schema::hasColumn('prodi', 'jenjang')) {
                    $table->dropColumn('jenjang');
                }
            });
        }
    }
};
