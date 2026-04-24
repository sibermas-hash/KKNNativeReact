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
        Schema::table('jenis_kkn', function (Blueprint $blueprint) {
            $blueprint->boolean('require_not_married')->default(false)->after('min_gpa');
            $blueprint->boolean('require_parent_permission')->default(false)->after('require_not_married');
            $blueprint->boolean('require_health_certificate')->default(false)->after('require_parent_permission');
            $blueprint->json('specific_prodi_ids')->nullable()->after('require_health_certificate');
            $blueprint->boolean('require_bta_ppi')->default(true)->after('specific_prodi_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jenis_kkn', function (Blueprint $blueprint) {
            $blueprint->dropColumn([
                'require_not_married',
                'require_parent_permission',
                'require_health_certificate',
                'specific_prodi_ids',
                'require_bta_ppi'
            ]);
        });
    }
};
