<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jenis_kkn', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Kode unik, e.g. REGULER, NUSANTARA');
            $table->string('name', 100)->comment('Label tampilan, e.g. KKN Reguler');
            $table->text('description')->nullable();
            $table->enum('registration_mode', ['open', 'selective', 'proposal_based'])->default('open');
            $table->enum('placement_mode', ['automatic_after_approval', 'manual_admin', 'host_defined', 'proposal_defined'])->default('automatic_after_approval');
            $table->integer('min_sks')->default(100);
            $table->decimal('min_gpa', 3, 2)->default(0.00);
            $table->string('color', 20)->default('emerald')->comment('Badge color for UI');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jenis_kkn');
    }
};
