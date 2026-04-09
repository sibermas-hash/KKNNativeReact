<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PublicContentController extends Controller
{
    public function profile(): Response
    {
        Gate::authorize('manage-settings');

        return Inertia::render('Admin/Content/Profile', [
            'content' => [
                'about' => SystemSetting::get('site_about', $this->defaultProfileContent()['about']),
                'visi' => SystemSetting::get('site_visi', $this->defaultProfileContent()['visi']),
                'misi' => SystemSetting::get('site_misi', $this->defaultProfileContent()['misi']),
            ],
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $validated = $request->validate([
            'about' => ['required', 'string', 'max:4000'],
            'visi' => ['required', 'string', 'max:2000'],
            'misi' => ['required', 'string', 'max:2000'],
        ]);

        SystemSetting::set('site_about', $validated['about']);
        SystemSetting::set('site_visi', $validated['visi']);
        SystemSetting::set('site_misi', $validated['misi']);

        return back()->with('success', 'Konten halaman profil berhasil diperbarui.');
    }

    public function schemes(): Response
    {
        Gate::authorize('manage-settings');

        return Inertia::render('Admin/Content/Schemes', [
            'content' => [
                'title' => SystemSetting::get('site_schemes_title', $this->defaultSchemeContent()['title']),
                'intro' => SystemSetting::get('site_schemes_intro', $this->defaultSchemeContent()['intro']),
                'items' => $this->getSchemeItems(),
            ],
        ]);
    }

    public function updateSchemes(Request $request): RedirectResponse
    {
        Gate::authorize('manage-settings');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'intro' => ['required', 'string', 'max:2000'],
            'schemes' => ['required', 'array', 'min:1', 'max:8'],
            'schemes.*.title' => ['required', 'string', 'max:100'],
            'schemes.*.description' => ['required', 'string', 'max:500'],
            'schemes.*.color' => ['required', 'in:emerald,blue,amber,slate'],
        ]);

        $items = collect($validated['schemes'])
            ->map(fn (array $scheme) => [
                'title' => trim($scheme['title']),
                'description' => trim($scheme['description']),
                'color' => $scheme['color'],
            ])
            ->values()
            ->all();

        SystemSetting::set('site_schemes_title', $validated['title']);
        SystemSetting::set('site_schemes_intro', $validated['intro']);
        SystemSetting::set('site_schemes_items', json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return back()->with('success', 'Konten halaman skema KKN berhasil diperbarui.');
    }

    /**
     * @return array{about:string, visi:string, misi:string}
     */
    private function defaultProfileContent(): array
    {
        return [
            'about' => 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.',
            'visi' => 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat berbasis kearifan lokal.',
            'misi' => 'Mengembangkan riset aplikatif dan pengabdian masyarakat yang terukur.',
        ];
    }

    /**
     * @return array{title:string, intro:string, items:array<int,array{title:string,description:string,color:string}>}
     */
    private function defaultSchemeContent(): array
    {
        return [
            'title' => 'Skema Operasional Terintegrasi.',
            'intro' => 'Beragam pilihan skema pengabdian yang dirancang untuk menjawab tantangan spesifik di berbagai level masyarakat.',
            'items' => [
                [
                    'title' => 'KKN Reguler',
                    'description' => 'Penempatan wilayah regional dengan fokus pemberdayaan masyarakat lokal berbasis kearifan setempat.',
                    'color' => 'emerald',
                ],
                [
                    'title' => 'KKN Tematik',
                    'description' => 'Pengabdian berbasis tema atau proposal dosen, termasuk varian Kampung Zakat dan Desa Katana.',
                    'color' => 'blue',
                ],
                [
                    'title' => 'KKN Nusantara',
                    'description' => 'Program khusus lintas wilayah yang mengikuti seleksi dan tata kelola nasional/mitra.',
                    'color' => 'amber',
                ],
                [
                    'title' => 'KKN Kolaborasi PTKIN',
                    'description' => 'Program kemitraan antar-PTKIN dengan penempatan dan tata kelola yang mengikuti host program.',
                    'color' => 'slate',
                ],
                [
                    'title' => 'KKN Internasional',
                    'description' => 'Program luar negeri berbasis mitra yang dikelola melalui seleksi khusus dan penempatan host.',
                    'color' => 'rose',
                ],
            ],
        ];
    }

    /**
     * @return array<int,array{title:string,description:string,color:string}>
     */
    private function getSchemeItems(): array
    {
        $defaultItems = $this->defaultSchemeContent()['items'];
        $stored = SystemSetting::get('site_schemes_items');

        if (! is_string($stored) || $stored === '') {
            return $defaultItems;
        }

        $decoded = json_decode($stored, true);

        if (! is_array($decoded)) {
            return $defaultItems;
        }

        $items = collect($decoded)
            ->filter(fn ($item) => is_array($item))
            ->map(function (array $item) {
                $color = in_array($item['color'] ?? '', ['emerald', 'blue', 'amber', 'slate'], true)
                    ? $item['color']
                    : 'emerald';

                return [
                    'title' => (string) ($item['title'] ?? ''),
                    'description' => (string) ($item['description'] ?? ''),
                    'color' => $color,
                ];
            })
            ->filter(fn (array $item) => $item['title'] !== '' && $item['description'] !== '')
            ->values()
            ->all();

        return $items !== [] ? $items : $defaultItems;
    }
}
