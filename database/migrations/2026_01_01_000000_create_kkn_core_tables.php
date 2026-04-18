<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('kkn')->create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->timestamps();
        });

        Schema::connection('kkn')->create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::connection('kkn')->create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('year', 20)->unique();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::connection('kkn')->create('periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years');
            $table->string('name', 100);
            $table->string('slug', 150)->unique();
            $table->enum('type', ['REGULER', 'TEMATIK', 'INTERNASIONAL', 'NUSANTARA']);
            $table->date('start_date');
            $table->date('end_date');
            $table->date('registration_start');
            $table->date('registration_end');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('kkn')->dropIfExists('periods');
        Schema::connection('kkn')->dropIfExists('academic_years');
        Schema::connection('kkn')->dropIfExists('programs');
        Schema::connection('kkn')->dropIfExists('faculties');
    }
};
