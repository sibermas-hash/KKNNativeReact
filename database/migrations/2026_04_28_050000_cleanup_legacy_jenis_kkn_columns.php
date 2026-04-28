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
            $table->integer('min_sks')->default(100);
            $table->decimal('min_gpa', 3, 2)->default(0.00);
            $table->boolean('require_not_married')->default(false);
            $table->boolean('require_parent_permission')->default(false);
            $table->boolean('require_health_certificate')->default(false);
            $table->json('specific_prodi_ids')->nullable();
            $table->boolean('require_bta_ppi')->default(true);
            $table->json('custom_requirements')->nullable();
            $table->json('required_documents')->nullable();
        });
    }
};
