<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DownloadResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Download;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DownloadController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $downloads = Download::orderByDesc('created_at')->paginate($request->input('per_page', 25));

        return $this->successCollection(DownloadResource::collection($downloads));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            // 102400 KB = 100 MB. Cukup untuk APK mobile app, PDF panduan,
            // dan dokumen Word. MIME types di-whitelist: document, image,
            // archive, dan APK Android (vnd.android.package-archive).
            'file' => [
                'nullable',
                'file',
                'max:102400',
                'mimetypes:application/pdf,application/msword,'
                    .'application/vnd.openxmlformats-officedocument.wordprocessingml.document,'
                    .'application/vnd.ms-excel,'
                    .'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,'
                    .'application/zip,'
                    .'application/vnd.android.package-archive,'
                    .'image/jpeg,image/png',
            ],
            'external_url' => ['nullable', 'url'],
            // `file_type` bebas string — konvensi: 'mobile-app' untuk APK,
            // 'panduan' untuk PDF manual, 'formulir' untuk template.
            'file_type' => ['nullable', 'string', 'max:50'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $filePath = $request->hasFile('file') ? $request->file('file')->store('downloads', config('filesystems.default')) : null;

        $download = Download::create(array_merge($validated, [
            'file_path' => $filePath,
            'file_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
        ]));

        return $this->created(new DownloadResource($download), 'Unduhan berhasil ditambahkan.');
    }

    public function update(Request $request, Download $download): JsonResponse
    {
        $download->update($request->validate(['title' => ['sometimes', 'string', 'max:255'], 'external_url' => ['nullable', 'url'], 'is_active' => ['nullable', 'boolean']]));

        return $this->success(new DownloadResource($download->refresh()), 'Unduhan berhasil diperbarui.');
    }

    public function destroy(Download $download): JsonResponse
    {
        if ($download->file_path) {
            Storage::disk(config('filesystems.default'))->delete($download->file_path);
        }
        $download->delete();

        return $this->noContent('Unduhan berhasil dihapus.');
    }
}
