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
            $legacyColumns = [
                'min_sks',
                'min_gpa',
                'require_not_married',
                'require_parent_permission',
                'require_health_certificate',
                'specific_prodi_ids',
                'require_bta_ppi',
                'custom_requirements',
                'required_documents',
            ];

            foreach ($legacyColumns as $column) {
                if (Schema::hasColumn('jenis_kkn', $column)) {
                    $table->dropColumn($column);
                }
            }
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
