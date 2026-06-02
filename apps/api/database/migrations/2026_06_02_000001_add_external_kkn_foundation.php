<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_universities', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 200);
            $table->text('address')->nullable();
            $table->string('pic_name', 150)->nullable();
            $table->string('pic_email', 150)->nullable();
            $table->string('pic_phone', 50)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'external_university_id')) {
                $table->foreignId('external_university_id')
                    ->nullable()
                    ->after('fakultas_id')
                    ->constrained('external_universities')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'external_university_id')) {
                $table->dropConstrainedForeignId('external_university_id');
            }
        });

        Schema::dropIfExists('external_universities');
    }
};
