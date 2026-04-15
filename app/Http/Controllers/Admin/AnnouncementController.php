<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Announcement;
use App\Traits\HandlesPagination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    use HandlesPagination;

    public function index()
    {
        $announcements = Announcement::orderByDesc('published_at')->paginate(10);

        return Inertia::render('Admin/Website/Announcements/Index', [
            'announcements' => $this->formatPaginator($announcements),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-announcements');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'content' => 'required|string',
            'is_active' => 'required|boolean',
            'published_at' => 'required|date',
            'image' => 'nullable|image|max:2048',
            'slug' => 'nullable|string|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('announcements', 'public');
        }

        Announcement::create($validated);

        return redirect()->back()->with('success', 'Warta berhasil diterbitkan dengan parameter SEO.');
    }

    public function update(Request $request, Announcement $announcement)
    {
        Gate::authorize('manage-announcements');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'content' => 'required|string',
            'is_active' => 'required|boolean',
            'published_at' => 'required|date',
            'image' => 'nullable|image|max:2048',
            'slug' => 'nullable|string|max:255|unique:kkn.announcements,slug,'.$announcement->id,
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('announcements', 'public');
        }

        $announcement->update($validated);

        return redirect()->back()->with('success', 'Warta berhasil diperbarui.');
    }

    public function destroy(Announcement $announcement)
    {
        Gate::authorize('manage-announcements');

        $announcement->delete();

        return redirect()->back()->with('success', 'Pengumuman berhasil dihapus.');
    }
}
