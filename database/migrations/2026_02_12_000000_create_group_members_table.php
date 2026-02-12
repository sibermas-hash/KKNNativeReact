<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('role_in_group')->default('member');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();
            $table->unique(['group_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_members');
    }
};
