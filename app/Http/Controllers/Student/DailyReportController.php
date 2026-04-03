<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;

        $kegiatan = $mahasiswa
            ? KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
                ->with(['kelompok', 'fileKegiatan'])
                ->orderByDesc('date')
                ->paginate(10)
            : collect();

        // Check workshop status for UI warning
        $isWorkshopPassed = PesertaWorkshop::where('user_id', auth()->id())
            ->where('attendance_status', 'attended')
            ->exists();

        return Inertia::render('Student/DailyReports/Index', [
            'reports' => $kegiatan,
            'isWorkshopPassed' => $isWorkshopPassed,
        ]);
    }

    public function create(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->with('kelompok')->first();
        
        abort_if(!$pendaftaran, 403, 'Anda belum terdaftar dalam kelompok aktif.');

        // SOP ENFORCEMENT: Harus lulus Pembekalan/Workshop
        $isWorkshopPassed = PesertaWorkshop::where('user_id', auth()->id())
            ->where('attendance_status', 'attended')
            ->exists();

        if (!$isWorkshopPassed) {
            return Inertia::render('Student/DailyReports/Index', [
                'flash' => ['error' => 'Akses Terkunci: Anda wajib mengikuti dan dinyatakan LULUS Pembekalan/Workshop sebelum dapat mengisi laporan harian.'],
                'reports' => $mahasiswa->kegiatan()->orderByDesc('date')->paginate(10),
                'isWorkshopPassed' => false
            ]);
        }

        return Inertia::render('Student/DailyReports/Create', [
            'group' => $pendaftaran->kelompok,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        abort_if(!$mahasiswa, 403, 'Profil mahasiswa tidak ditemukan.');
        
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();
        abort_if(!$pendaftaran || !$pendaftaran->kelompok_id, 403, 'Anda belum ditempatkan di kelompok.');

        // SOP ENFORCEMENT: Safety check for API/Direct POST
        $isWorkshopPassed = PesertaWorkshop::where('user_id', auth()->id())
            ->where('attendance_status', 'attended')
            ->exists();
        
        if (!$isWorkshopPassed) {
            return redirect()->route('student.daily-reports.index')
                ->with('error', 'Anda belum diizinkan mengirim laporan harian karena belum lulus pembekalan.');
        }

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'location_name' => ['nullable', 'string', 'max:255'],
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
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'location_name' => $validated['location_name'] ?? null,
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
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'location_name' => ['nullable', 'string', 'max:255'],
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
