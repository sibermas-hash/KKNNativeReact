<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->string('document_key', 120)->index();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('jenis_kkn_document_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jenis_kkn_id')->constrained('jenis_kkn')->cascadeOnDelete();
            $table->string('document_key', 120);
            $table->string('document_label', 255);
            $table->text('description')->nullable();
            $table->boolean('is_required')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('default_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
            $table->timestamps();

            $table->unique(['jenis_kkn_id', 'document_key'], 'jenis_kkn_document_key_unique');
        });

        Schema::create('periode_document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('periode')->cascadeOnDelete();
            $table->foreignId('jenis_kkn_document_requirement_id')->constrained('jenis_kkn_document_requirements')->cascadeOnDelete();
            $table->foreignId('document_template_id')->constrained('document_templates')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['periode_id', 'jenis_kkn_document_requirement_id'], 'periode_requirement_template_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periode_document_templates');
        Schema::dropIfExists('jenis_kkn_document_requirements');
        Schema::dropIfExists('document_templates');
    }
};
