<?php

use App\Models\KKN\Announcement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $slug = 'bergabung-ke-grup-telegram-sibermas';

        if (DB::table('announcements')->where('slug', $slug)->exists()) {
            DB::table('announcements')->where('slug', $slug)->update([
                'announcement_targets' => json_encode([Announcement::TARGET_STUDENT_DASHBOARD]),
                'show_as_popup' => true,
                'is_active' => true,
                'updated_at' => now(),
            ]);

            return;
        }

        DB::table('announcements')->insert([
            'title' => 'Bergabung ke Grup Telegram',
            'slug' => $slug,
            'category' => 'PENGUMUMAN',
            'excerpt' => 'Seluruh mahasiswa KKN wajib bergabung ke grup Telegram resmi SIBERMAS untuk menerima informasi, pengumuman, dan koordinasi terbaru.',
            'content' => "Seluruh mahasiswa KKN wajib bergabung ke grup Telegram resmi SIBERMAS untuk menerima informasi, pengumuman, dan koordinasi terbaru.\n\nhttps://t.me/sibermasuinsaizu",
            'is_active' => true,
            'published_at' => now(),
            'show_as_popup' => true,
            'popup_until' => null,
            'popup_dismissable' => true,
            'announcement_targets' => json_encode([Announcement::TARGET_STUDENT_DASHBOARD]),
            'meta_title' => 'Bergabung ke Grup Telegram SIBERMAS',
            'meta_description' => 'Pengumuman dashboard mahasiswa untuk bergabung ke grup Telegram resmi SIBERMAS.',
            'meta_keywords' => 'telegram,sibermas,kkn,mahasiswa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('announcements')
            ->where('slug', 'bergabung-ke-grup-telegram-sibermas')
            ->delete();
    }
};
