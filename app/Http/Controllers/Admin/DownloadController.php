<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Download;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Gate;

class DownloadController extends Controller
{
    public function index()
    {
        Gate::authorize('manage-settings');
        
        return Inertia::render('Admin/Downloads/Index', [
            'downloads' => Download::orderBy('created_at', 'desc')->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage-settings');
        
        $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:10240',
            'external_url' => 'nullable|url',
        ]);

        $data = [
            'title' => $request->title,
            'external_url' => $request->external_url,
            'is_active' => true,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('public/downloads');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_path'] = Storage::url($path);
            $data['file_type'] = $file->getClientOriginalExtension();
        }

        Download::create($data);

        return back()->with('success', 'File berhasil ditambahkan.');
    }

    public function update(Request $request, Download $download)
    {
        Gate::authorize('manage-settings');
        
        $request->validate([
            'title' => 'required|string|max:255',
            'external_url' => 'nullable|url',
            'is_active' => 'required|boolean',
        ]);

        $download->update($request->only('title', 'external_url', 'is_active'));

        return back()->with('success', 'Data berhasil diperbarui.');
    }

    public function destroy(Download $download)
    {
        Gate::authorize('manage-settings');
        
        $download->delete();

        return back()->with('success', 'File berhasil dihapus.');
    }
}
