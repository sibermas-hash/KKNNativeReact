<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the CHECK constraints created by Laravel's enum() in PostgreSQL
        // This allows us to insert 'self_determined' which was previously missing
        // from the enum array.
        
        try {
            DB::statement('ALTER TABLE jenis_kkn DROP CONSTRAINT IF EXISTS jenis_kkn_placement_mode_check');
        } catch (\Exception $e) {
            // Ignore if constraint doesn't exist
        }

        try {
            DB::statement('ALTER TABLE jenis_kkn DROP CONSTRAINT IF EXISTS jenis_kkn_registration_mode_check');
        } catch (\Exception $e) {
            // Ignore if constraint doesn't exist
        }
        
        // Also ensure the column is wide enough and changed to standard string
        Schema::table('jenis_kkn', function (Blueprint $table) {
            $table->string('placement_mode', 50)->default('automatic_after_approval')->change();
            $table->string('registration_mode', 50)->default('open')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 
    }
};
