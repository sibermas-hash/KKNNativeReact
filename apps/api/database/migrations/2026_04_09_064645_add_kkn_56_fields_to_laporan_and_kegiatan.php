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
        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->string('video_link')->nullable()->comment('Link YouTube Video Kegiatan (5-7 menit)');
            $table->string('news_link')->nullable()->comment('Link/File Berita Kegiatan');
            $table->string('article_1_path')->nullable()->comment('Artikel Ilmiah Utama');
            $table->string('article_2_path')->nullable()->comment('Artikel Ilmiah Kedua');
            $table->string('poster_1_path')->nullable()->comment('Poster Peta Potensi 1');
            $table->string('poster_2_path')->nullable()->comment('Poster Peta Potensi 2');
            $table->string('poster_3_path')->nullable()->comment('Poster Peta Potensi 3');
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->string('social_media_link')->nullable()->comment('Tautan IG untuk Shilaturrahmi dll');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laporan_akhir', function (Blueprint $table) {
            $table->dropColumn([
                'video_link',
                'news_link',
                'article_1_path',
                'article_2_path',
                'poster_1_path',
                'poster_2_path',
                'poster_3_path',
            ]);
        });

        Schema::table('kegiatan_kkn', function (Blueprint $table) {
            $table->dropColumn('social_media_link');
        });
    }
};
