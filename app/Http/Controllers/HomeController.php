<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\Announcement;
use App\Models\KKN\Download;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * REFACTORED HOME CONTROLLER - Standard Standar 2026
 * Force Sync to resolve Blank Page issues.
 */
class HomeController extends Controller
{
    public function index()
    {
        // FORCE SYNC DATA - No Defer/Concurrency for stability
        $stats = [
            'students' => PesertaKkn::whereIn('status', ['approved', 'completed'])->count(),
            'groups' => KelompokKkn::count(),
            'locations' => Lokasi::count(),
            'academic_years' => 1,
        ];

        $announcements = Announcement::active()->orderBy('published_at', 'desc')->take(3)->get();
        $downloads = Download::active()->orderBy('created_at', 'desc')->take(3)->get();

        return Inertia::render('Home', [
            'stats' => $stats,
            'featuredAnnouncements' => $announcements->map(fn($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'category' => $a->category,
                'published_at' => $a->published_at?->toIso8601String(),
            ]),
            'featuredDownloads' => $downloads->map(fn($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'file_type' => $d->file_type,
            ]),
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'LPPM UIN Prof. K.H. Saifuddin Zuhri Purwokerto'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat keunggulan dalam riset dan pengabdian masyarakat yang inovatif.'),
                'misi' => SystemSetting::get('site_misi', 'Mengembangkan pengabdian masyarakat berbasis kearifan lokal dan teknologi inovatif.'),
            ],
            'canLogin' => true,
            'canRegister' => true,
        ]);
    }

    public function about()
    {
        return Inertia::render('Public/About', [
            'aboutContent' => [
                'about' => SystemSetting::get('site_about', 'LPPM UIN Saizu merupakan lembaga yang mengoordinasikan kegiatan penelitian dan pengabdian masyarakat.'),
                'visi' => SystemSetting::get('site_visi', 'Menjadi pusat unggulan riset dan pengabdian masyarakat yang inovatif dan transformatif.'),
                'misi' => SystemSetting::get('site_misi', 'Menyelenggarakan pengabdian masyarakat berbasis riset untuk pemberdayaan masyarakat desa.'),
            ],
        ]);
    }

    public function schemes()
    {
        return Inertia::render('Public/Schemes', [
            'content' => [
                'title' => 'Skema Pelaksanaan KKN UIN Saizu',
                'intro' => 'Sistem Informasi Manajemen memberikan fleksibilitas untuk berbagai jenis pengabdian masyarakat.',
                'items' => [
                    [
                        'id' => 1,
                        'name' => 'KKN Reguler',
                        'description' => 'Program pengabdian masyarakat yang dilakukan secara berkala sesuai kalender akademik.',
                        'is_active' => true,
                    ],
                    [
                        'id' => 2,
                        'name' => 'KKN Tematik',
                        'description' => 'Program KKN yang berfokus pada tema tertentu sesuai dengan kebutuhan masyarakat atau instansi.',
                        'is_active' => true,
                    ],
                ]
            ],
        ]);
    }

    public function announcements()
    {
        $announcements = Announcement::active()->orderBy('published_at', 'desc')->paginate(12);
        return Inertia::render('Public/Announcements', [
            'announcements' => $announcements,
        ]);
    }

    public function downloads()
    {
        $downloads = Download::active()->orderBy('created_at', 'desc')->get();
        return Inertia::render('Public/Downloads', [
            'downloads' => $downloads->map(fn($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'file_type' => $d->file_type,
                'file_path' => $d->file_path,
                'external_url' => $d->external_url,
            ]),
        ]);
    }

    public function locations()
    {
        $query = Lokasi::orderBy('village_name', 'asc');

        if (request('search')) {
            $search = request('search');
            $query->where(function($q) use ($search) {
                $q->where('village_name', 'like', "%{$search}%")
                  ->orWhere('district_name', 'like', "%{$search}%")
                  ->orWhere('regency_name', 'like', "%{$search}%");
            });
        }

        $locations = $query->withCount('kelompok')->paginate(12);
        
        return Inertia::render('Public/Locations', [
            'locations' => [
                'data' => $locations->map(fn($loc) => [
                    'id' => $loc->id,
                    'name' => $loc->village_name,
                    'address' => $loc->address,
                    'district' => $loc->district_name,
                    'city' => $loc->regency_name,
                    'groups_count' => $loc->kelompok_count,
                ]),
                'links' => $locations->toArray()['links'],
                'meta' => [
                    'current_page' => $locations->currentPage(),
                    'from' => $locations->firstItem(),
                    'last_page' => $locations->lastPage(),
                    'path' => $locations->path(),
                    'per_page' => $locations->perPage(),
                    'to' => $locations->lastItem(),
                    'total' => $locations->total(),
                    'links' => $locations->toArray()['links'],
                ],
            ],
            'filters' => request()->all('search'),
        ]);
    }
}
