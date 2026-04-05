<?php

namespace Tests\Feature;

use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GradingSettingsPageTest extends TestCase
{
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'username' => 'gradingadmin',
            'name' => 'Grading Admin',
            'email' => 'grading-admin@test.com',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);
        $this->admin->assignRole('superadmin');
    }

    public function test_index_bootstraps_default_configs_and_renders_sections(): void
    {
        $this->assertSame(0, KonfigurasiPenilaian::count());

        $response = $this->actingAs($this->admin)->get('/admin/grading-settings');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Grading/Settings')
                ->has('sections', 5)
                ->where('sections.0.group', 'main')
                ->where('sections.0.total', 100)
                ->where('sections.1.group', 'dpl')
                ->where('sections.1.total', 100)
                ->where('sections.2.group', 'village')
                ->where('sections.2.total', 100)
                ->where('sections.3.group', 'lppm')
                ->where('sections.3.total', 100)
                ->where('sections.4.group', 'extras')
            );

        $this->assertGreaterThan(0, KonfigurasiPenilaian::count());
    }

    public function test_update_persists_percentages_when_group_totals_are_valid(): void
    {
        KonfigurasiPenilaian::ensureDefaults();

        $payload = [
            'configs' => KonfigurasiPenilaian::query()
                ->orderBy('id')
                ->get()
                ->map(function (KonfigurasiPenilaian $config) {
                    $overrides = [
                        'weight_main_dpl' => 45,
                        'weight_main_village' => 35,
                        'weight_main_lppm' => 20,
                        'weight_dpl_report' => 25,
                        'weight_dpl_execution' => 50,
                        'weight_dpl_article' => 25,
                        'weight_village_attitude' => 55,
                        'weight_village_discipline' => 45,
                        'weight_admin_workshop' => 40,
                        'weight_admin_administration' => 60,
                        'workshop_attendance_score' => 90,
                    ];

                    return [
                        'id' => $config->id,
                        'percentage' => $overrides[$config->config_key] ?? (float) $config->percentage,
                    ];
                })
                ->values()
                ->all(),
        ];

        $this->actingAs($this->admin)
            ->post('/admin/grading-settings', $payload)
            ->assertSessionHas('success', 'Konfigurasi penilaian berhasil diperbarui.');

        $this->assertSame('45.00', KonfigurasiPenilaian::where('config_key', 'weight_main_dpl')->value('percentage'));
        $this->assertSame('50.00', KonfigurasiPenilaian::where('config_key', 'weight_dpl_execution')->value('percentage'));
        $this->assertSame('90.00', KonfigurasiPenilaian::where('config_key', 'workshop_attendance_score')->value('percentage'));
    }

    public function test_update_rejects_invalid_group_totals(): void
    {
        KonfigurasiPenilaian::ensureDefaults();

        $payload = [
            'configs' => KonfigurasiPenilaian::query()
                ->orderBy('id')
                ->get()
                ->map(function (KonfigurasiPenilaian $config) {
                    $percentage = match ($config->config_key) {
                        'weight_main_dpl' => 60,
                        'weight_main_village' => 30,
                        'weight_main_lppm' => 20,
                        default => (float) $config->percentage,
                    };

                    return [
                        'id' => $config->id,
                        'percentage' => $percentage,
                    ];
                })
                ->values()
                ->all(),
        ];

        $this->actingAs($this->admin)
            ->from('/admin/grading-settings')
            ->post('/admin/grading-settings', $payload)
            ->assertRedirect('/admin/grading-settings')
            ->assertSessionHasErrors('configs');

        $this->assertSame('50.00', KonfigurasiPenilaian::where('config_key', 'weight_main_dpl')->value('percentage'));
    }
}
