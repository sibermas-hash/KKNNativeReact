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
        Schema::create('announcements', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('title');
            $blueprint->string('category')->default('PENGUMUMAN'); // PENDAFTARAN, PEDOMAN, PENGUMUMAN
            $blueprint->text('content');
            $blueprint->boolean('is_active')->default(true);
            $blueprint->timestamp('published_at')->useCurrent();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
