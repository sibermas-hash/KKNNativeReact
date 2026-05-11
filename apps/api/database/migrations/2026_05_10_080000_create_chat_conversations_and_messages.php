<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Chat Konsultasi Mahasiswa ↔ Superadmin (PRD_CHAT_SYSTEM.md).
 *
 * Direct messaging system — menggantikan chatbot AI dengan live chat
 * antara mahasiswa/dosen dan admin untuk konsultasi + komplain.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->string('subject', 255);
            $t->string('status', 16)->default('open'); // open | replied | closed
            $t->string('priority', 16)->default('normal'); // normal | urgent
            $t->timestamp('last_message_at')->useCurrent();
            $t->timestamp('closed_at')->nullable();
            $t->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();

            $t->index(['status', 'last_message_at']);
            $t->index(['user_id', 'status']);
        });

        Schema::create('chat_messages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
            $t->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $t->text('body');
            $t->boolean('is_read')->default(false);
            $t->timestamp('read_at')->nullable();
            $t->string('attachment_path', 500)->nullable();
            $t->string('attachment_name', 255)->nullable();
            $t->timestamps();

            $t->index(['conversation_id', 'created_at']);
            $t->index(['conversation_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};
