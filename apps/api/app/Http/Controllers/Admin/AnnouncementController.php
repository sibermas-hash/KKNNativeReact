<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Announcement;
use App\Traits\HandlesPagination;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    use HandlesPagination;

    public function index(Request $request)
    {
        Gate::authorize('manage-content');

        $filters = [
            'search' => trim((string) $request->string('search')->toString()),
            'status' => trim((string) $request->string('status')->toString()),
            'category' => trim((string) $request->string('category')->toString()),
        ];

        $announcements = Announcement::query()
            ->when($filters['search'] !== '', fn (Builder $query) => $this->applySearch($query, $filters['search']))
            ->when($filters['status'] !== '', fn (Builder $query) => $this->applyStatusFilter($query, $filters['status']))
            ->when($filters['category'] !== '', fn (Builder $query) => $query->where('category', $filters['category']))
            ->ordered()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Announcement $announcement) => $this->serializeForAdmin($announcement));

        $summaryQuery = Announcement::query();

        return Inertia::render('Admin/Website/Announcements/Index', [
            'announcements' => $this->formatPaginator($announcements),
            'filters' => $filters,
            'summary' => [
                'total' => (clone $summaryQuery)->count(),
                'published' => (clone $summaryQuery)->where('is_active', true)->where('published_at', '<=', now())->count(),
                'scheduled' => (clone $summaryQuery)->where('is_active', true)->where('published_at', '>', now())->count(),
                'draft' => (clone $summaryQuery)->where('is_active', false)->count(),
            ],
            'categories' => collect(Announcement::CATEGORY_OPTIONS)
                ->merge(Announcement::query()->pluck('category'))
                ->filter()
                ->unique()
                ->values(),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-content');

        $validated = $this->validatePayload($request);
        $validated['category'] = $this->normalizeCategory($validated['category']);
        $validated['slug'] = $this->resolveSlug($validated['slug'] ?? null, $validated['title']);
        $validated['excerpt'] = $this->resolveExcerpt($validated['excerpt'] ?? null, $validated['content']);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('announcements', 'public');
        }

        if ($request->hasFile('attachment')) {
            $validated['file_path'] = $request->file('attachment')->store('announcements/attachments', 'public');
            $validated['file_name'] = $request->file('attachment')->getClientOriginalName();
        }

        unset($validated['attachment'], $validated['remove_image'], $validated['remove_attachment']);

        Announcement::create($validated);

        return redirect()->route('admin.warta-utama.index')->with('success', 'Berita berhasil disimpan.');
    }

    public function update(Request $request, Announcement $announcement)
    {
        Gate::authorize('manage-content');

        $validated = $this->validatePayload($request, $announcement);
        $validated['category'] = $this->normalizeCategory($validated['category']);
        $validated['slug'] = $this->resolveSlug($validated['slug'] ?? null, $validated['title'], $announcement->id);
        $validated['excerpt'] = $this->resolveExcerpt($validated['excerpt'] ?? null, $validated['content']);

        if ($request->boolean('remove_image')) {
            $this->deleteFileIfExists($announcement->image);
            $validated['image'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteFileIfExists($announcement->image);
            $validated['image'] = $request->file('image')->store('announcements', 'public');
        }

        if ($request->boolean('remove_attachment')) {
            $this->deleteFileIfExists($announcement->file_path);
            $validated['file_path'] = null;
            $validated['file_name'] = null;
        }

        if ($request->hasFile('attachment')) {
            $this->deleteFileIfExists($announcement->file_path);
            $validated['file_path'] = $request->file('attachment')->store('announcements/attachments', 'public');
            $validated['file_name'] = $request->file('attachment')->getClientOriginalName();
        }

        unset($validated['attachment'], $validated['remove_image'], $validated['remove_attachment']);

        $announcement->update($validated);

        return redirect()->route('admin.warta-utama.index')->with('success', 'Berita berhasil diperbarui.');
    }

    public function preview(Announcement $announcement)
    {
        Gate::authorize('manage-content');

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
            'announcement' => $this->serializeForPublicView($announcement),
            'relatedAnnouncements' => $relatedAnnouncements,
            'previewMode' => true,
            'previewBackUrl' => route('admin.warta-utama.index'),
        ]);
    }

    public function destroy(Announcement $announcement)
    {
        Gate::authorize('manage-content');

        $this->deleteFileIfExists($announcement->image);
        $this->deleteFileIfExists($announcement->file_path);

        $announcement->delete();

        return redirect()->route('admin.warta-utama.index')->with('success', 'Berita berhasil dihapus.');
    }

    protected function validatePayload(Request $request, ?Announcement $announcement = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('announcements', 'slug')->ignore($announcement?->id),
            ],
            'category' => ['required', 'string', 'max:120'],
            'excerpt' => ['nullable', 'string', 'max:600'],
            'content' => ['required', 'string'],
            'is_active' => ['required', 'boolean'],
            'published_at' => ['required', 'date'],
            'image' => ['nullable', 'image', 'max:4096'],
            'attachment' => ['nullable', 'file', 'max:10240'],
            'remove_image' => ['nullable', 'boolean'],
            'remove_attachment' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:320'],
            'meta_keywords' => ['nullable', 'string', 'max:255'],
        ]);
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('title', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('excerpt', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%")
                ->orWhere('meta_title', 'like', "%{$search}%")
                ->orWhere('meta_description', 'like', "%{$search}%");
        });
    }

    protected function applyStatusFilter(Builder $query, string $status): void
    {
        match ($status) {
            'published' => $query->where('is_active', true)->where('published_at', '<=', now()),
            'scheduled' => $query->where('is_active', true)->where('published_at', '>', now()),
            'draft' => $query->where('is_active', false),
            default => null,
        };
    }

    protected function resolveSlug(?string $slug, string $title, ?int $ignoreId = null): string
    {
        $source = filled($slug) ? $slug : $title;

        return Announcement::makeUniqueSlug($source, $ignoreId);
    }

    protected function normalizeCategory(string $category): string
    {
        return Str::upper(trim($category));
    }

    protected function resolveExcerpt(?string $excerpt, string $content): string
    {
        if (filled($excerpt)) {
            return trim((string) $excerpt);
        }

        return Str::limit(
            trim(preg_replace('/\s+/', ' ', strip_tags($content))),
            220
        );
    }

    protected function deleteFileIfExists(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    protected function serializeForAdmin(Announcement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'slug' => $announcement->slug,
            'category' => $announcement->category,
            'excerpt' => $announcement->excerpt_text,
            'content' => $announcement->content,
            'is_active' => (bool) $announcement->is_active,
            'published_at' => $announcement->published_at?->toIso8601String(),
            'image' => $announcement->image,
            'image_url' => $announcement->image ? Storage::url($announcement->image) : null,
            'file_name' => $announcement->file_name,
            'attachment_url' => $announcement->file_path ? Storage::url($announcement->file_path) : null,
            'meta_title' => $announcement->meta_title,
            'meta_description' => $announcement->meta_description,
            'meta_keywords' => $announcement->meta_keywords,
            'status' => $announcement->publication_status,
            'reading_time' => $announcement->reading_time_minutes,
            'word_count' => $announcement->word_count,
            'public_url' => route('public.announcements.show', ['slug' => $announcement->slug]),
            'preview_url' => route('admin.warta-utama.preview', ['announcement' => $announcement->id]),
            'updated_at' => $announcement->updated_at?->toIso8601String(),
        ];
    }

    protected function serializeForPublicView(Announcement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'slug' => $announcement->slug,
            'category' => $announcement->category,
            'excerpt' => $announcement->excerpt_text,
            'content' => $announcement->content,
            'published_at' => $announcement->published_at?->toIso8601String(),
            'image_url' => $announcement->image ? Storage::url($announcement->image) : null,
            'meta_title' => $announcement->meta_title,
            'meta_description' => $announcement->meta_description,
            'meta_keywords' => $announcement->meta_keywords,
            'file_name' => $announcement->file_name,
            'attachment_url' => $announcement->file_path ? Storage::url($announcement->file_path) : null,
            'reading_time' => $announcement->reading_time_minutes,
            'word_count' => $announcement->word_count,
        ];
    }
}
