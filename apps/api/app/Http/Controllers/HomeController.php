<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\Announcement;
use App\Models\KKN\Download;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Models\KKN\TahunAkademik;
use App\Traits\HandlesPagination;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * REFACTORED HOME CONTROLLER - Standard Standar 2026
 * Force Sync to resolve Blank Page issues.
 */
class HomeController extends Controller
{
    use HandlesPagination;

    public function index()
    {
        try {
            $stats = [
                'students' => PesertaKkn::whereIn('status', ['approved', 'completed'])->count(),
                'groups' => KelompokKkn::count(),
                'locations' => Lokasi::count(),
                'academic_years' => TahunAkademik::count() ?: 1,
            ];

            $announcements = Announcement::active()->ordered()->take(5)->get();
            $downloads = Download::active()->orderBy('created_at', 'desc')->take(3)->get();

            return Inertia::render('Home', [
                'stats' => $stats,
                'featuredAnnouncements' => $announcements->map(fn ($announcement) => $this->serializeAnnouncementCard($announcement)),
                'featuredDownloads' => $downloads->map(fn ($d) => [
                    'id' => $d->id,
                    'title' => $d->title,
                    'file_type' => $d->file_type,
                    'file_path' => $d->file_path ? Storage::url($d->file_path) : null,
                    'external_url' => $d->external_url,
                ]),
                'aboutContent' => [
                    'about' => SystemSetting::get('site_about', 'LPPM UIN Prof. K.H. Saifuddin Zuhri Purwokerto'),
                    'visi' => SystemSetting::get('site_visi', 'Menjadi pusat keunggulan dalam riset dan pengabdian masyarakat yang inovatif.'),
                    'misi' => SystemSetting::get('site_misi', 'Mengembangkan pengabdian masyarakat berbasis kearifan lokal dan teknologi inovatif.'),
                ],
                'canLogin' => true,
                'canRegister' => true,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return Inertia::render('Home', [
                'stats' => ['students' => 0, 'groups' => 0, 'locations' => 0, 'academic_years' => 0],
                'featuredAnnouncements' => [],
                'featuredDownloads' => [],
                'aboutContent' => [
                    'about' => 'LPPM UIN Saizu',
                    'visi' => 'Menjadi pusat keunggulan.',
                    'misi' => 'Mengembangkan pengabdian masyarakat.',
                ],
                'canLogin' => true,
                'canRegister' => true,
                'error' => 'Gagal memuat data. Silakan refresh halaman.',
            ]);
        }
    }

    public function announcements()
    {
        $announcements = Announcement::active()
            ->ordered()
            ->paginate(8)
            ->through(fn (Announcement $announcement) => [
                ...$this->serializeAnnouncementCard($announcement),
                'meta_title' => $announcement->meta_title,
                'meta_description' => $announcement->meta_description,
                'file_name' => $announcement->file_name,
                'attachment_url' => $announcement->file_path ? Storage::url($announcement->file_path) : null,
            ]);

        return Inertia::render('Public/Announcements', [
            'announcements' => $this->formatPaginator($announcements),
        ]);
    }

    public function announcementShow(string $slug)
    {
        $announcement = Announcement::active()
            ->where('slug', $slug)
            ->firstOrFail();

        $relatedAnnouncements = Announcement::active()
            ->where('id', '!=', $announcement->id)
            ->ordered()
            ->take(3)
            ->get()
            ->map(fn (Announcement $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'category' => $item->category,
                'excerpt' => $item->excerpt_text,
                'published_at' => $item->published_at?->toIso8601String(),
            ]);

        return Inertia::render('Public/AnnouncementShow', [
            'announcement' => [
                ...$this->serializeAnnouncementCard($announcement),
                'content' => $announcement->content,
                'meta_title' => $announcement->meta_title,
                'meta_description' => $announcement->meta_description,
                'meta_keywords' => $announcement->meta_keywords,
                'file_name' => $announcement->file_name,
                'attachment_url' => $announcement->file_path ? Storage::url($announcement->file_path) : null,
            ],
            'relatedAnnouncements' => $relatedAnnouncements,
        ]);
    }

    public function downloads()
    {
        $downloads = Download::active()->orderBy('created_at', 'desc')->get();

        return Inertia::render('Public/Downloads', [
            'downloads' => $downloads->map(fn ($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'file_type' => $d->file_type,
                'file_path' => $d->file_path,
                'external_url' => $d->external_url,
            ]),
        ]);
    }

    /**
     * Display interactive map of KKN locations.
     */
    public function map()
    {
        $locations = Lokasi::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with(['kelompok' => function ($q) {
                $q->withCount('peserta');
            }])
            ->get();

        return Inertia::render('Public/LocationsMap', [
            'locations' => $locations->map(fn ($loc) => $this->serializePublicLocation($loc)),
            'config' => [
                'center' => [
                    (float) SystemSetting::get('map_center_lat', -7.4243),
                    (float) SystemSetting::get('map_center_lng', 109.2302),
                ],
                'zoom' => (int) SystemSetting::get('map_default_zoom', 11),
            ],
            'filters' => request()->only('search', 'district', 'regency'),
            'activeLocationId' => null,
        ]);
    }

    public function mapShow(string $locationPath)
    {
        $locations = Lokasi::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->with(['kelompok' => function ($q) {
                $q->withCount('peserta');
            }])
            ->get();

        $activeLocation = $this->findPublicLocationFromPath($locations, $locationPath);

        return Inertia::render('Public/LocationsMap', [
            'locations' => $locations->map(fn ($loc) => $this->serializePublicLocation($loc)),
            'config' => [
                'center' => [
                    (float) SystemSetting::get('map_center_lat', -7.4243),
                    (float) SystemSetting::get('map_center_lng', 109.2302),
                ],
                'zoom' => (int) SystemSetting::get('map_default_zoom', 11),
            ],
            'filters' => request()->only('search', 'district', 'regency'),
            'activeLocationId' => $activeLocation->id,
        ]);
    }

    protected function serializeAnnouncementCard(Announcement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'slug' => $announcement->slug,
            'category' => $announcement->category,
            'excerpt' => $announcement->excerpt_text,
            'image_url' => $announcement->image ? Storage::url($announcement->image) : null,
            'published_at' => $announcement->published_at?->toIso8601String(),
            'reading_time' => $announcement->reading_time_minutes,
            'word_count' => $announcement->word_count,
        ];
    }

    protected function serializePublicLocation(Lokasi $location): array
    {
        $groups = $location->kelompok->map(fn ($group) => [
            'id' => $group->id,
            'nama' => $group->nama_kelompok,
            'students_count' => $group->peserta_count,
        ])->values();

        $slug = Str::slug($location->village_name ?: 'lokasi');

        return [
            'id' => $location->id,
            'slug' => $slug,
            'path' => route('public.locations.show', ['locationPath' => "{$location->id}-{$slug}"]),
            'name' => $location->village_name,
            'district' => $location->district_name,
            'regency' => $location->regency_name,
            'full_name' => $location->full_name,
            'latitude' => (float) $location->latitude,
            'longitude' => (float) $location->longitude,
            'address' => $location->address,
            'capacity' => $location->capacity,
            'maps_url' => sprintf('https://www.google.com/maps/search/?api=1&query=%s,%s', $location->latitude, $location->longitude),
            'groups' => $groups,
            'students_count' => $groups->sum('students_count'),
        ];
    }

    protected function findPublicLocationFromPath(Collection $locations, string $locationPath): Lokasi
    {
        if (preg_match('/^(?<id>\d+)(?:-.+)?$/', $locationPath, $matches) === 1) {
            $location = $locations->firstWhere('id', (int) $matches['id']);

            if ($location) {
                return $location;
            }
        }

        abort(404);
    }
}
