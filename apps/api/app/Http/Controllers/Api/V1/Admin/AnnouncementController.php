<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AnnouncementResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AnnouncementController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Announcement::when($request->input('search'), fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))->orderByDesc('published_at');
        return $this->successCollection(AnnouncementResource::collection($query->paginate(25)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $imagePath = $request->hasFile('image') ? $request->file('image')->store('announcements', config('filesystems.default')) : null;

        $announcement = Announcement::create(array_merge($validated, [
            'image' => $imagePath,
            'published_at' => now(),
            'slug' => Str::slug($validated['title']),
        ]));

        return $this->created(new AnnouncementResource($announcement), 'Berita berhasil dipublikasikan.');
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->update($request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ]));
        return $this->success(new AnnouncementResource($announcement->refresh()), 'Berita berhasil diperbarui.');
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        if ($announcement->image) Storage::disk(config('filesystems.default'))->delete($announcement->image);
        $announcement->delete();
        return $this->noContent('Berita berhasil dihapus.');
    }

    public function preview(Announcement $announcement): JsonResponse
    {
        return $this->success(new AnnouncementResource($announcement));
    }
}
