<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profil_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('profileable_type')->nullable();
            $table->unsignedBigInteger('profileable_id')->nullable();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamps();
            
            $table->index(['profileable_type', 'profileable_id'], 'profil_user_profileable_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profil_user');
    }
};
