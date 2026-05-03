<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            $table->json('required_documents')->nullable()->after('custom_requirements'); // e.g. ["Artikel", "Paspor"]
            $table->json('allowed_regencies')->nullable()->after('required_documents'); // e.g. ["BANYUMAS", "PURBALINGGA"]
        });

        Schema::table('periode', function (Blueprint $table) {
            $table->string('theme')->nullable()->after('name'); // Branding theme
        });
    }

    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            $table->dropColumn(['required_documents', 'allowed_regencies']);
        });

        Schema::table('periode', function (Blueprint $table) {
            $table->dropColumn('theme');
        });
    }
};
