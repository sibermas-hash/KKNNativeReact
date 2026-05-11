<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * R11 fix — widen Master\Mahasiswa PII columns untuk encryption.
     *
     * Context: `master_mahasiswa` table (SIAKAD mirror) punya nik, email,
     * phone, alamat sebagai plain VARCHAR. Auditor R11 menemukan tidak
     * ada encryption cast di Model — PII bocor kalau tabel ini di-query
     * langsung.
     *
     * Fix: widen kolom-kolom tersebut ke TEXT supaya ciphertext AES-256
     * muat, lalu tambah encrypted cast di Model.
     */
    public function up(): void
    {
        if (! Schema::hasTable('master_mahasiswa')) {
            return; // table belum ada di beberapa env
        }

        Schema::table('master_mahasiswa', function (Blueprint $table) {
            // Widen to TEXT for encrypted ciphertext storage
            foreach (['nik', 'email', 'phone', 'alamat'] as $column) {
                if (Schema::hasColumn('master_mahasiswa', $column)) {
                    $table->text($column)->nullable()->change();
                }
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('master_mahasiswa')) {
            return;
        }

        Schema::table('master_mahasiswa', function (Blueprint $table) {
            $table->string('nik', 16)->nullable()->change();
            $table->string('email', 100)->nullable()->change();
            $table->string('phone', 32)->nullable()->change();
            $table->string('alamat', 500)->nullable()->change();
        });
    }
};
