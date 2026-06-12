<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('dosen')) {
            return;
        }

        Schema::table('dosen', function (Blueprint $table) {
            if (! Schema::hasColumn('dosen', 'nama_gelar')) {
                $table->string('nama_gelar', 200)->nullable()->after('nama');
            }
            if (! Schema::hasColumn('dosen', 'nidn')) {
                $table->string('nidn', 20)->nullable()->after('nip');
            }
            if (! Schema::hasColumn('dosen', 'nik')) {
                $table->string('nik', 32)->nullable()->after('nidn');
            }
            if (! Schema::hasColumn('dosen', 'pangkat')) {
                $table->string('pangkat', 100)->nullable()->after('golongan');
            }
            if (! Schema::hasColumn('dosen', 'kelas_jabatan')) {
                $table->unsignedSmallInteger('kelas_jabatan')->nullable()->after('jabatan');
            }
            if (! Schema::hasColumn('dosen', 'tugas_tambahan')) {
                $table->string('tugas_tambahan', 255)->nullable()->after('kelas_jabatan');
            }
            if (! Schema::hasColumn('dosen', 'pendidikan_terakhir')) {
                $table->string('pendidikan_terakhir', 10)->nullable()->after('tugas_tambahan');
            }
            if (! Schema::hasColumn('dosen', 'tempat_lahir')) {
                $table->string('tempat_lahir', 100)->nullable()->after('birth_date');
            }
            if (! Schema::hasColumn('dosen', 'alamat')) {
                $table->text('alamat')->nullable()->after('tempat_lahir');
            }
            if (! Schema::hasColumn('dosen', 'tanggal_pensiun')) {
                $table->date('tanggal_pensiun')->nullable()->after('alamat');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('dosen')) {
            return;
        }

        Schema::table('dosen', function (Blueprint $table) {
            $cols = ['nama_gelar', 'nidn', 'nik', 'pangkat', 'kelas_jabatan',
                'tugas_tambahan', 'pendidikan_terakhir', 'tempat_lahir',
                'alamat', 'tanggal_pensiun'];
            $toDrop = array_filter($cols, fn ($c) => Schema::hasColumn('dosen', $c));
            if (! empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
