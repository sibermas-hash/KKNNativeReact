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
use App\Models\KKN\Lokasi;
use App\Models\KKN\SertifikatKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/announcements
     * Published announcements, paginated. No auth required.
     */
    public function announcements(Request $request): JsonResponse
    {
        $announcements = Announcement::where('is_active', true)
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->paginate($request->input('per_page', 12));

        return $this->successCollection(AnnouncementResource::collection($announcements));
    }

    /**
     * GET /api/v1/public/announcements/{slug}
     * Single announcement by slug. No auth required.
     */
    public function announcementBySlug(string $slug): JsonResponse
    {
        $announcement = Announcement::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $announcement) {
            return $this->notFound('Berita tidak ditemukan.');
        }

        return $this->success(new AnnouncementResource($announcement));
    }

    /**
     * GET /api/v1/public/locations
     * All active locations. No auth required.
     */
    public function locations(Request $request): JsonResponse
    {
        $locations = Lokasi::with('fakultas')
            ->orderBy('village_name')
            ->paginate($request->input('per_page', 100));

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
        $announcements = Announcement::where('is_active', true)
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->limit(6)
            ->get();

        $downloads = Download::where('is_active', true)
            ->orderByDesc('created_at')
            ->limit(4)
            ->get();

        // Count students via peserta_kkn, groups via kelompok_kkn
        $studentCount = \App\Models\KKN\PesertaKkn::where('status', 'approved')->count();
        $groupCount = \App\Models\KKN\KelompokKkn::count();
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
}
