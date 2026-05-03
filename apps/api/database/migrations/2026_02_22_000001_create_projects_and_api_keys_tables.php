<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('_projects', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('project_name');
            $table->text('use_case')->nullable();
            $table->timestamps();
        });

        Schema::create('_api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique();
            $table->string('name');
            $table->json('permissions')->default('["read"]');
            $table->string('email');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index('key');
            $table->index('email');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('_api_keys');
        Schema::dropIfExists('_projects');
    }
};
