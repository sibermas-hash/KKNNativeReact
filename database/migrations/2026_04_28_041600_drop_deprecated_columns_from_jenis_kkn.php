<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            $table->dropColumn(['requirements_config', 'required_documents']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $table) {
            $table->json('requirements_config')->nullable();
            $table->json('required_documents')->nullable();
        });
    }
};
