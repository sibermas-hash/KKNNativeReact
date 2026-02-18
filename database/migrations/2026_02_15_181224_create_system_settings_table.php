<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::connection('kkn')->hasTable('system_settings')) {
            return;
        }
        Schema::connection('kkn')->create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('config_key')->unique();
            $table->string('label');
            $table->text('value')->nullable();
            $table->string('type')->default('text'); // text, textarea, password
            $table->string('group')->default('general'); // master_api, email, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->dropIfExists('system_settings');
    }
};