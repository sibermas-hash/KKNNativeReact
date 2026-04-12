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
        Schema::connection('kkn')->table('announcements', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
            $table->string('image')->nullable()->after('content');
            $table->string('meta_title')->nullable()->after('image');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('meta_keywords')->nullable()->after('meta_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('kkn')->table('announcements', function (Blueprint $table) {
            $table->dropColumn(['slug', 'image', 'meta_title', 'meta_description', 'meta_keywords']);
        });
    }
};
