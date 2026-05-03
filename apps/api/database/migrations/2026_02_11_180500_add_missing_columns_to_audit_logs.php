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
        $hasAbility = Schema::hasColumn('log_audit', 'ability');
        $hasDescription = Schema::hasColumn('log_audit', 'description');

        if ($hasAbility && $hasDescription) {
            return;
        }

        Schema::table('log_audit', function (Blueprint $table) use ($hasAbility, $hasDescription) {
            if (! $hasAbility) {
                $table->string('ability')->nullable();
            }
            if (! $hasDescription) {
                $table->text('description')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $hasAbility = Schema::hasColumn('log_audit', 'ability');
        $hasDescription = Schema::hasColumn('log_audit', 'description');

        if (! $hasAbility && ! $hasDescription) {
            return;
        }

        Schema::table('log_audit', function (Blueprint $table) use ($hasAbility, $hasDescription) {
            if ($hasAbility) {
                $table->dropColumn('ability');
            }
            if ($hasDescription) {
                $table->dropColumn('description');
            }
        });
    }
};
