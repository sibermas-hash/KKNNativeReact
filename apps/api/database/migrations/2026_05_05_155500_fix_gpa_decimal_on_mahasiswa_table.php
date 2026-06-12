<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // API kampus mengirim gpa seperti 10.73 (skala 100) atau 4.xx (skala 4.0)
        // decimal(3,2) hanya bisa menampung max 9.99 → overflow
        // decimal(5,2) menampung hingga 999.99 — cukup untuk semua skala
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->decimal('gpa', 5, 2)->default(0.00)->change();
        });
    }

    public function down(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->decimal('gpa', 3, 2)->default(0.00)->change();
        });
    }
};
