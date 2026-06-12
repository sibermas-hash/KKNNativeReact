<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->boolean('is_eligible')->default(false)->index()->after('marital_status');
            $table->jsonb('eligibility_issues')->nullable()->after('is_eligible');
            $table->timestamp('eligibility_computed_at')->nullable()->after('eligibility_issues');
        });
    }

    public function down(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->dropColumn(['is_eligible', 'eligibility_issues', 'eligibility_computed_at']);
        });
    }
};
