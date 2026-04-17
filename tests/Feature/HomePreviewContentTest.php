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
                ->has('featuredAnnouncements', 0)
                ->has('featuredDownloads', 0)
            );
    }

    public function test_public_announcements_page_exposes_fallback_preview_when_empty(): void
    {
        $this->get(route('public.announcements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Announcements')
                ->has('announcements.data', 0)
            );
    }

    public function test_public_downloads_page_exposes_fallback_preview_when_empty(): void
    {
        $this->get(route('public.downloads'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Downloads')
                ->has('downloads', 0)
            );
    }
}
