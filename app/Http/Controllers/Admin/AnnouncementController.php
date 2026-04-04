<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => Announcement::orderByDesc('published_at')->paginate(10),
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
        ]);

        Announcement::create($validated);

        return redirect()->back()->with('success', 'Pengumuman berhasil dibuat.');
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
        ]);

        $announcement->update($validated);

        return redirect()->back()->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Announcement $announcement)
    {
        Gate::authorize('manage-announcements');

        $announcement->delete();
        return redirect()->back()->with('success', 'Pengumuman berhasil dihapus.');
    }
}
