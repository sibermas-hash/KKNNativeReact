<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomePreviewContentTest extends TestCase
{
    public function test_home_page_exposes_fallback_preview_content_when_public_content_is_empty(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->has('featuredAnnouncements', 3)
                ->where('featuredAnnouncements.0.is_demo', true)
                ->has('featuredDownloads', 3)
                ->where('featuredDownloads.0.is_demo', true)
            );
    }

    public function test_public_announcements_page_exposes_fallback_preview_when_empty(): void
    {
        $this->get(route('public.announcements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Announcements')
                ->has('announcements.data', 3)
                ->where('announcements.data.0.is_demo', true)
            );
    }

    public function test_public_downloads_page_exposes_fallback_preview_when_empty(): void
    {
        $this->get(route('public.downloads'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Downloads')
                ->has('downloads', 3)
                ->where('downloads.0.is_demo', true)
            );
    }
}
