<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countdown_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->boolean('enabled')->default(false);
            $table->string('title')->default('Pendaftaran Dibuka Dalam');
            $table->string('subtitle')->nullable();
            $table->timestamp('countdown_start')->nullable(); // kapan countdown mulai tampil
            $table->timestamp('countdown_end')->nullable();   // kapan countdown selesai (= registration opens)
            $table->string('display_location')->default('home'); // home, dashboard, both
            $table->string('style')->default('hero'); // hero, banner, minimal
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countdown_settings');
    }
};
