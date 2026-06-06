<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AnnouncementResource;
use App\Http\Resources\Api\V1\DownloadResource;
use App\Http\Resources\Api\V1\LokasiResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Announcement;
use App\Models\KKN\Download;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SertifikatKkn;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PublicController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/announcements
     */
    public function announcements(Request $request): JsonResponse
    {
        $type = $request->input('type', 'all');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 12);
        $cacheKey = "public:announcements:{$type}:p{$page}:pp{$perPage}";

        $announcements = Cache::remember($cacheKey, 300, fn () =>
            Announcement::where('is_active', true)
                ->whereNotNull('published_at')
                ->where('published_at', '<=', now())
                ->ofType($request->input('type'))
                ->orderByDesc('published_at')
                ->paginate($perPage)
        );

        return $this->successCollection(AnnouncementResource::collection($announcements));
    }

    /**
     * GET /api/v1/public/berita
     */
    public function berita(Request $request): JsonResponse
    {
        return $this->announcements($request->merge(['type' => Announcement::TYPE_BERITA]));
    }

    /**
     * GET /api/v1/public/pengumuman
     */
    public function pengumuman(Request $request): JsonResponse
    {
        return $this->announcements($request->merge(['type' => Announcement::TYPE_PENGUMUMAN]));
    }

    /**
     * GET /api/v1/public/announcements/{slug}
     */
    public function announcementBySlug(string $slug): JsonResponse
    {
        $announcement = Cache::remember("public:announcement:{$slug}", 600, fn () =>
            Announcement::where('slug', $slug)
                ->where('is_active', true)
                ->whereNotNull('published_at')
                ->where('published_at', '<=', now())
                ->first()
        );

        if (! $announcement) {
            return $this->notFound('Berita tidak ditemukan.');
        }

        return $this->success(new AnnouncementResource($announcement));
    }

    /**
     * GET /api/v1/public/locations
     */
    public function locations(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 200);
        $page = $request->input('page', 1);

        $locations = Cache::remember("public:locations:p{$page}:pp{$perPage}", 900, fn () =>
            Lokasi::with([
                'fakultas',
                'kelompok' => fn ($q) => $q->withCount('peserta'),
            ])
                ->orderBy('village_name')
                ->paginate($perPage)
        );

        return $this->successCollection(LokasiResource::collection($locations));
    }

    /**
     * GET /api/v1/public/downloads
     */
    public function downloads(): JsonResponse
    {
        $downloads = Cache::remember('public:downloads', 900, fn () =>
            Download::where('is_active', true)
                ->orderByDesc('created_at')
                ->get()
        );

        return $this->success(DownloadResource::collection($downloads));
    }

    /**
     * GET /api/v1/public/verify-certificate/{token}
     */
    public function verifyCertificate(string $token): JsonResponse
    {
        $certificate = Cache::remember("public:cert:{$token}", 3600, fn () =>
            SertifikatKkn::where('verification_token', $token)
                ->valid()
                ->first()
        );

        if (! $certificate) {
            return $this->error('NOT_FOUND', 'Sertifikat tidak valid atau telah dibatalkan.', 404);
        }

        return $this->success([
            'nama_mahasiswa' => $certificate->nama_mahasiswa,
            'nim' => $certificate->nim,
            'nama_prodi' => $certificate->nama_prodi,
            'nama_fakultas' => $certificate->nama_fakultas,
            'certificate_number' => $certificate->certificate_number,
            'total_score' => $certificate->total_score,
            'letter_grade' => $certificate->letter_grade,
            'lokasi_kkn' => $certificate->lokasi_kkn,
            'issued_at' => $certificate->issued_at?->toIso8601String(),
        ]);
    }

    /**
     * GET /api/v1/public/home
     */
    public function home(): JsonResponse
    {
        $data = Cache::remember('public:home', 300, function () {
            $announcements = Announcement::where('is_active', true)
                ->whereNotNull('published_at')
                ->where('published_at', '<=', now())
                ->ofType(Announcement::TYPE_BERITA)
                ->orderByDesc('published_at')
                ->limit(6)
                ->get();

            $downloads = Download::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(4)
                ->get();

            $studentCount = PesertaKkn::where('status', 'approved')->count();
            $groupCount = KelompokKkn::count();
            $locationCount = Lokasi::count();

            return [
                'announcements' => $announcements,
                'downloads' => $downloads,
                'stats' => [
                    'students' => $studentCount,
                    'groups' => $groupCount,
                    'locations' => $locationCount,
                ],
                'schemesContent' => [
                    'title' => SystemSetting::get('site_schemes_title', ''),
                    'intro' => SystemSetting::get('site_schemes_intro', ''),
                    'items' => json_decode((string) SystemSetting::get('site_schemes_items', '[]'), true) ?? [],
                ],
            ];
        });

        return $this->success([
            'featuredAnnouncements' => AnnouncementResource::collection($data['announcements']),
            'featuredDownloads' => DownloadResource::collection($data['downloads']),
            'stats' => $data['stats'],
            'schemesContent' => $data['schemesContent'],
            'aboutContent' => [
                'visi' => config('app.visi', 'Menjadi Lembaga Penelitian dan Pengabdian kepada Masyarakat yang unggul dan kompetitif dalam pengembangan ilmu pengetahuan, teknologi, dan seni yang berbasis pada nilai-nilai moderasi Islam dan kearifan lokal.'),
            ],
        ]);
    }

    /**
     * GET /api/v1/public/popup-announcement
     */
    public function popupAnnouncement(): JsonResponse
    {
        $announcement = Cache::remember('public:popup', 120, fn () =>
            Announcement::activePopup()
                ->forTarget(Announcement::TARGET_PUBLIC_HOME)
                ->orderByDesc('published_at')
                ->first()
        );

        if (! $announcement) {
            return $this->success(null);
        }

        return $this->success([
            'id' => $announcement->id,
            'title' => $announcement->title,
            'slug' => $announcement->slug,
            'excerpt' => $announcement->excerpt_text,
            'category' => $announcement->category,
            'image_url' => $announcement->image
                ? asset('storage/'.$announcement->image)
                : null,
            'published_at' => $announcement->published_at?->toIso8601String(),
            'popup_until' => $announcement->popup_until?->toIso8601String(),
            'popup_dismissable' => (bool) $announcement->popup_dismissable,
            'read_more_url' => Announcement::resolveType($announcement->category) === Announcement::TYPE_PENGUMUMAN
                ? '/pengumuman/'.$announcement->slug
                : '/berita/'.$announcement->slug,
            'updated_at' => $announcement->updated_at?->toIso8601String(),
        ]);
    }
}

