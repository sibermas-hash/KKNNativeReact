<?php

namespace Tests\Feature;

use App\Models\KKN\Announcement;
use App\Models\KKN\Download;
use App\Models\KKN\SystemSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeedPublicContentCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seed_command_also_populates_public_content(): void
    {
        $this->artisan('kkn:seed-demo-testing')
            ->assertSuccessful();

        $this->assertDatabaseHas('announcements', [
            'title' => 'Pembukaan Pendaftaran KKN Semester Ganjil 2026',
            'is_active' => true,
        ], 'kkn');

        $this->assertDatabaseHas('downloads', [
            'title' => 'Panduan Operasional KKN 2026',
            'is_active' => true,
        ], 'kkn');

        $this->assertSame(
            'Skema KKN yang fleksibel dan kontekstual.',
            SystemSetting::get('site_schemes_title')
        );

        $this->assertGreaterThanOrEqual(3, Announcement::query()->count());
        $this->assertGreaterThanOrEqual(3, Download::query()->count());
    }
}
