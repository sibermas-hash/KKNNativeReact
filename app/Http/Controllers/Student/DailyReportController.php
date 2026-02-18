<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\FileKegiatanKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;

        $kegiatan = $mahasiswa
            ? KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
                ->with(['kelompok', 'fileKegiatan'])
                ->orderByDesc('date')
                ->paginate(10)
            : collect();

        return Inertia::render('Student/DailyReports/Index', [
            'reports' => $kegiatan,
        ]);
    }

    public function create(): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->with('kelompok')->first();

        return Inertia::render('Student/DailyReports/Create', [
            'group' => $pendaftaran?->kelompok,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();
        abort_if(!$pendaftaran || !$pendaftaran->kelompok_id, 403, 'Anda belum ditempatkan di kelompok.');

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
            'files.*' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,doc,docx', 'max:5120'],
        ]);

        $kegiatan = KegiatanKkn::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $pendaftaran->kelompok_id,
            'date' => $validated['date'],
            'title' => $validated['title'],
            'activity' => $validated['activity'],
            'reflection' => $validated['reflection'] ?? null,
            'output' => $validated['output'] ?? null,
            'status' => 'submitted',
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('daily-reports', 'public');
                FileKegiatanKkn::create([
                    'kegiatan_kkn_id' => $kegiatan->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                ]);
            }
        }

        // Notify DPL
        $dpl = $kegiatan->kelompok->dpl->user;
        if ($dpl) {
            $dpl->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'info',
                'title' => 'Laporan Harian Baru',
                'message' => "{$mahasiswa->user->name} telah mengirim laporan harian untuk tanggal " . $kegiatan->date->format('d/m/Y'),
                'icon' => 'document-text',
                'url' => route('dpl.daily-reports.index', ['status' => 'submitted']),
            ]));
        }

        return redirect()->route('student.daily-reports.index')
            ->with('success', 'Laporan harian berhasil dikirim.');
    }

    public function edit(KegiatanKkn $dailyReport): Response
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if($dailyReport->mahasiswa_id !== $mahasiswa->id, 403);
        $dailyReport->load('fileKegiatan');

        return Inertia::render('Student/DailyReports/Edit', [
            'report' => $dailyReport,
        ]);
    }

    public function update(Request $request, KegiatanKkn $dailyReport): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if($dailyReport->mahasiswa_id !== $mahasiswa->id, 403);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
        ]);

        $dailyReport->update([
            ...$validated,
            'status' => 'submitted',
        ]);

        return redirect()->route('student.daily-reports.index')
            ->with('success', 'Laporan harian berhasil diperbarui.');
    }

    public function destroy(KegiatanKkn $dailyReport): RedirectResponse
    {
        $mahasiswa = auth()->user()->mahasiswa;
        abort_if($dailyReport->mahasiswa_id !== $mahasiswa->id, 403);

        foreach ($dailyReport->fileKegiatan as $file) {
            Storage::disk('public')->delete($file->file_path);
        }

        $dailyReport->delete();

        return redirect()->route('student.daily-reports.index')
            ->with('success', 'Laporan harian berhasil dihapus.');
    }
}
