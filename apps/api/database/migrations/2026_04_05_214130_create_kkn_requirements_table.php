<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kkn_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('column_name'); // Which column in 'mahasiswa' table to check
            $table->string('operator', 10); // >=, <=, ==, !=, in, not_in
            $table->string('expected_value'); // The threshold or expected string
            $table->text('error_message'); // The message to show if validation fails
            $table->boolean('is_active')->default(true); // Toggle the requirement ON/OFF
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kkn_requirements');
    }
};
