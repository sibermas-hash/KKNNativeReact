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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/announcements
     * Published announcements (all types), paginated. No auth required.
     *
     * Supports optional `?type=berita|pengumuman` query param untuk filter
     * — gunakan `/public/berita` atau `/public/pengumuman` sebagai shortcut
     * semantik (mereka mengembalikan bentuk response yang sama).
     */
    public function announcements(Request $request): JsonResponse
    {
        $announcements = Announcement::where('is_active', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->ofType($request->input('type'))
            ->orderByDesc('published_at')
            ->paginate($request->input('per_page', 12));

        return $this->successCollection(AnnouncementResource::collection($announcements));
    }

    /**
     * GET /api/v1/public/berita
     * Shortcut untuk announcements dengan type=berita (semua kategori selain PENGUMUMAN).
     */
    public function berita(Request $request): JsonResponse
    {
        return $this->announcements($request->merge(['type' => Announcement::TYPE_BERITA]));
    }

    /**
     * GET /api/v1/public/pengumuman
     * Shortcut untuk announcements dengan type=pengumuman (kategori PENGUMUMAN).
     */
    public function pengumuman(Request $request): JsonResponse
    {
        return $this->announcements($request->merge(['type' => Announcement::TYPE_PENGUMUMAN]));
    }

    /**
     * GET /api/v1/public/announcements/{slug}
     * Single announcement by slug. No auth required.
     */
    public function announcementBySlug(string $slug): JsonResponse
    {
        $announcement = Announcement::where('slug', $slug)
            ->where('is_active', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->first();

        if (! $announcement) {
            return $this->notFound('Berita tidak ditemukan.');
        }

        return $this->success(new AnnouncementResource($announcement));
    }

    /**
     * GET /api/v1/public/locations
     * All active locations with group stats. No auth required.
     *
     * Eager-loads `kelompok` + peserta count so the public map page can
     * render pin markers with group/student counts without N+1 queries.
     */
    public function locations(Request $request): JsonResponse
    {
        $locations = Lokasi::with([
            'fakultas',
            'kelompok' => fn ($q) => $q->withCount('peserta'),
        ])
            ->orderBy('village_name')
            ->paginate($request->input('per_page', 200));

        return $this->successCollection(LokasiResource::collection($locations));
    }

    /**
     * GET /api/v1/public/downloads
     * Active downloads. No auth required.
     */
    public function downloads(): JsonResponse
    {
        $downloads = Download::where('is_active', true)
            ->orderByDesc('created_at')
            ->get();

        return $this->success(DownloadResource::collection($downloads));
    }

    /**
     * GET /api/v1/public/verify-certificate/{token}
     * Certificate verification. No auth required.
     */
    public function verifyCertificate(string $token): JsonResponse
    {
        $certificate = SertifikatKkn::where('verification_token', $token)
            ->valid()
            ->first();

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
     * Home page data. No auth required.
     */
    public function home(): JsonResponse
    {
        // Home feature list menampilkan berita — pengumuman di-handle terpisah
        // via popup modal (/public/popup-announcement), tidak di-embed sebagai
        // artikel preview di landing.
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

        // Count students via peserta_kkn, groups via kelompok_kkn
        $studentCount = PesertaKkn::where('status', 'approved')->count();
        $groupCount = KelompokKkn::count();
        $locationCount = Lokasi::count();

        return $this->success([
            'featuredAnnouncements' => AnnouncementResource::collection($announcements),
            'featuredDownloads' => DownloadResource::collection($downloads),
            'stats' => [
                'students' => $studentCount,
                'groups' => $groupCount,
                'locations' => $locationCount,
            ],
            'aboutContent' => [
                'visi' => config('app.visi', 'Menjadi Lembaga Penelitian dan Pengabdian kepada Masyarakat yang unggul dan kompetitif dalam pengembangan ilmu pengetahuan, teknologi, dan seni yang berbasis pada nilai-nilai moderasi Islam dan kearifan lokal.'),
            ],
        ]);
    }

    /**
     * GET /api/v1/public/popup-announcement
     *
     * Returns the single latest announcement flagged as a home popup that
     * is currently active (published, not past popup_until). No auth.
     *
     * The payload is intentionally minimal — only what the popup modal
     * needs to render. Full content is fetched via
     * `/public/announcements/{slug}` when the user clicks "Baca selengkapnya".
     *
     * Response shape:
     *   { data: null }            — no active popup
     *   { data: { id, title, ... } } — otherwise
     */
    public function popupAnnouncement(): JsonResponse
    {
        $announcement = Announcement::activePopup()
            ->orderByDesc('published_at')
            ->first();

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
            'read_more_url' => '/berita/'.$announcement->slug,
        ]);
    }
}
