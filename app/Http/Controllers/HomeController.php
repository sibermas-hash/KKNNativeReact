<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\Announcement;
use App\Models\KKN\Download;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        return Inertia::render('Home', [
            'stats' => Inertia::defer(function () {
                try {
                    return [
                        'students' => PesertaKkn::whereIn('status', ['approved', 'verifikasi_pusat', 'completed'])->count(),
                        'groups' => KelompokKkn::count(),
                        'locations' => Lokasi::count(),
                    ];
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Home statistics error: '.$e->getMessage());

                    return [
                        'students' => 0,
                        'groups' => 0,
                        'locations' => 0,
                    ];
                }
            }),
            'featuredAnnouncements' => (function () {
                $announcements = Announcement::active()->orderBy('published_at', 'desc')->take(3)->get();

                return $announcements->isNotEmpty()
                    ? $this->transformAnnouncements($announcements, false)
                    : $this->fallbackAnnouncements();
            })(),
            'featuredDownloads' => (function () {
                $downloads = Download::active()->orderBy('created_at', 'desc')->take(3)->get();

                return $downloads->isNotEmpty()
                    ? $this->transformDownloads($downloads, false)
                    : $this->fallbackDownloads();
            })(),
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat.'),
                'misi' => SystemSetting::get('site_misi', 'Mengembangkan riset aplikatif.'),
            ],
            'canLogin' => true,
            'canRegister' => true,
        ]);
    }

    public function about()
    {
        return Inertia::render('Public/About', [
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat.'),
                'misi' => SystemSetting::get('site_misi', 'Mengembangkan riset aplikatif.'),
            ],
        ]);
    }

    public function schemes()
    {
        return Inertia::render('Public/Schemes', [
            'content' => [
                'title' => SystemSetting::get('site_schemes_title', 'Skema Operasional Terintegrasi.'),
                'intro' => SystemSetting::get('site_schemes_intro', 'Beragam pilihan skema pengabdian yang dirancang untuk menjawab tantangan spesifik di berbagai level masyarakat.'),
                'items' => $this->resolveSchemeItems(),
            ],
        ]);
    }

    public function announcements()
    {
        $announcements = Announcement::active()->orderBy('published_at', 'desc')->paginate(10);

        if ($announcements->isEmpty()) {
            return Inertia::render('Public/Announcements', [
                'announcements' => [
                    'data' => $this->fallbackAnnouncements(),
                    'links' => [],
                    'meta' => ['is_demo' => true],
                ],
            ]);
        }

        $announcements->setCollection(
            collect($announcements->items())->map(fn (Announcement $announcement) => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'category' => $announcement->category,
                'published_at' => optional($announcement->published_at)->toIso8601String() ?? now()->toIso8601String(),
                'is_demo' => false,
            ])
        );

        return Inertia::render('Public/Announcements', [
            'announcements' => $announcements,
        ]);
    }

    public function downloads()
    {
        $downloads = Download::active()
            ->orderBy('created_at', 'desc')
            ->limit(1000)
            ->get();

        return Inertia::render('Public/Downloads', [
            'downloads' => $downloads->isNotEmpty()
                ? $this->transformDownloads($downloads, false)
                : $this->fallbackDownloads(),
        ]);
    }

    public function locations(Request $request)
    {
        $search = $request->input('search');

        $locations = Lokasi::withCount('groups')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('district', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Public/Locations', [
            'locations' => $locations,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * @return array<int, array{title:string,description:string,color:string}>
     */
    private function resolveSchemeItems(): array
    {
        $defaultItems = [
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
        ];

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

    /**
     * @return array<int, array{id:int,title:string,category:string,content:string,published_at:string,is_demo:bool}>
     */
    private function transformAnnouncements(Collection $announcements, bool $isDemo): array
    {
        return $announcements
            ->map(fn (Announcement $announcement) => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'category' => $announcement->category,
                'content' => $announcement->content,
                'published_at' => optional($announcement->published_at)->toIso8601String() ?? now()->toIso8601String(),
                'is_demo' => $isDemo,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id:int,title:string,file_type:string|null,external_url:string|null,file_path:string|null,is_demo:bool}>
     */
    private function transformDownloads(Collection $downloads, bool $isDemo): array
    {
        return $downloads
            ->map(fn (Download $download) => [
                'id' => $download->id,
                'title' => $download->title,
                'file_type' => $download->file_type,
                'external_url' => $download->external_url,
                'file_path' => $download->file_path,
                'is_demo' => $isDemo,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id:int,title:string,category:string,content:string,published_at:string,is_demo:bool}>
     */
    private function fallbackAnnouncements(): array
    {
        return [
            [
                'id' => 0,
                'title' => 'Pembukaan Pendaftaran KKN Gelombang 2026',
                'category' => 'PENDAFTARAN',
                'content' => 'Contoh pengumuman untuk menampilkan posisi banner, ringkasan informasi, dan struktur warta publik ketika data operasional belum tersedia.',
                'published_at' => now()->subDays(2)->toIso8601String(),
                'is_demo' => true,
            ],
            [
                'id' => 0,
                'title' => 'Sosialisasi Teknis Kelompok dan Penugasan DPL',
                'category' => 'PENGUMUMAN',
                'content' => 'Contoh informasi umum yang biasanya berisi jadwal, tahapan verifikasi, dan arahan teknis sebelum pelaksanaan KKN dimulai.',
                'published_at' => now()->subDays(5)->toIso8601String(),
                'is_demo' => true,
            ],
            [
                'id' => 0,
                'title' => 'Rilis Pedoman Pelaporan Harian Mahasiswa',
                'category' => 'PEDOMAN',
                'content' => 'Contoh pengumuman pedoman yang menjelaskan standar laporan harian, laporan akhir, dan unggahan dokumen pendukung.',
                'published_at' => now()->subDays(7)->toIso8601String(),
                'is_demo' => true,
            ],
        ];
    }

    /**
     * @return array<int, array{id:int,title:string,file_type:string|null,external_url:string|null,file_path:string|null,is_demo:bool}>
     */
    private function fallbackDownloads(): array
    {
        return [
            [
                'id' => 0,
                'title' => 'Panduan Operasional KKN 2026',
                'file_type' => 'PDF',
                'external_url' => null,
                'file_path' => null,
                'is_demo' => true,
            ],
            [
                'id' => 0,
                'title' => 'Template Laporan Harian Kelompok',
                'file_type' => 'DOCX',
                'external_url' => null,
                'file_path' => null,
                'is_demo' => true,
            ],
            [
                'id' => 0,
                'title' => 'Format Administrasi dan Surat Tugas',
                'file_type' => 'XLSX',
                'external_url' => null,
                'file_path' => null,
                'is_demo' => true,
            ],
        ];
    }
}
