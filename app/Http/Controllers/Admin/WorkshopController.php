<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Workshop;
use App\Services\WorkshopService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkshopController extends Controller
{
    public function __construct(
        protected WorkshopService $workshopService
    ) {}

    public function index(): Response
    {
        Gate::authorize('manage-workshops');
        
        return Inertia::render('Admin/Workshops/Index', [
            'workshops' => $this->workshopService->getUpcomingWorkshops(null, true, true),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-workshops');
        
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string', 'max:100'],
            'workshop_date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->workshopService->createWorkshop($validated);

        return redirect()->back()->with('success', 'Jadwal pembekalan berhasil ditambahkan.');
    }

    public function update(Request $request, Workshop $workshop): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string', 'max:100'],
            'workshop_date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'max_participants' => ['nullable', 'integer', 'min:1'],
        ]);

        try {
            $this->workshopService->updateWorkshop($workshop, $validated);
            return redirect()->back()->with('success', 'Jadwal pembekalan berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function markAttendance(Request $request, int $participantId): RedirectResponse
    {
        $this->workshopService->markAttendance($participantId, $request->input('attended', true));

        return redirect()->back()->with('success', 'Status kehadiran berhasil diperbarui.');
    }

    public function bulkAttendance(Request $request, int $workshopId): RedirectResponse
    {
        $validated = $request->validate([
            'attended_user_ids' => ['required', 'array'],
            'attended_user_ids.*' => ['exists:users,id'],
        ]);

        $this->workshopService->bulkMarkAttendance($workshopId, $validated['attended_user_ids']);

        return redirect()->back()->with('success', 'Presensi massal berhasil diproses.');
    }

    public function previewAttendance(Request $request, int $workshopId): \Illuminate\Http\JsonResponse
    {
        Gate::authorize('manage-workshops');

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $rows = \Maatwebsite\Excel\Facades\Excel::toArray(new \stdClass(), $request->file('file'));
        $data = $rows[0] ?? [];
        
        if (empty($data)) {
            return response()->json(['error' => 'File Excel kosong.'], 422);
        }

        // Ambil header (baris pertama)
        $headers = array_map('strtolower', array_values($data[0]));
        $nimIndex = array_search('nim', $headers);

        if ($nimIndex === false) {
            return response()->json(['error' => 'Kolom "NIM" tidak ditemukan di baris pertama Excel.'], 422);
        }

        $results = [];
        $processedNims = [];

        // Skip header, mulai dari baris ke-2
        for ($i = 1; $i < count($data); $i++) {
            $row = $data[$i];
            $nim = trim((string) ($row[$nimIndex] ?? ''));

            if (empty($nim) || in_array($nim, $processedNims)) continue;
            $processedNims[] = $nim;

            $mahasiswa = \App\Models\KKN\Mahasiswa::where('nim', $nim)->first();
            
            if (!$mahasiswa) {
                $results[] = [
                    'nim' => $nim,
                    'name' => 'TIDAK DITEMUKAN',
                    'status' => 'error',
                    'message' => 'NIM tidak terdaftar di sistem KKN.'
                ];
                continue;
            }

            $peserta = \App\Models\KKN\PesertaWorkshop::where('workshop_id', $workshopId)
                ->where('user_id', $mahasiswa->user_id)
                ->first();

            if (!$peserta) {
                $results[] = [
                    'nim' => $nim,
                    'name' => $mahasiswa->nama,
                    'status' => 'warning',
                    'message' => 'Mahasiswa tidak mendaftar di sesi workshop ini.'
                ];
            } elseif ($peserta->attended) {
                $results[] = [
                    'nim' => $nim,
                    'name' => $mahasiswa->nama,
                    'status' => 'info',
                    'message' => 'Sudah melakukan absensi sebelumnya.'
                ];
            } else {
                $results[] = [
                    'nim' => $nim,
                    'name' => $mahasiswa->nama,
                    'status' => 'success',
                    'message' => 'Valid & Siap di-import.'
                ];
            }
        }

        return response()->json([
            'preview' => $results,
            'summary' => [
                'total' => count($results),
                'valid' => count(array_filter($results, fn($r) => $row['status'] === 'success' || $r['status'] === 'success')),
            ]
        ]);
    }

    public function importAttendance(Request $request, int $workshopId): RedirectResponse
    {
        Gate::authorize('manage-workshops');

        $validated = $request->validate([
            'nims' => ['required', 'array'],
            'nims.*' => ['string'],
        ]);

        $processedCount = 0;
        foreach ($validated['nims'] as $nim) {
            $mahasiswa = \App\Models\KKN\Mahasiswa::where('nim', $nim)->first();
            if ($mahasiswa) {
                $updated = \App\Models\KKN\PesertaWorkshop::where('workshop_id', $workshopId)
                    ->where('user_id', $mahasiswa->user_id)
                    ->update([
                        'attended' => true,
                        'attended_at' => now(),
                    ]);
                if ($updated) $processedCount++;
            }
        }

        return redirect()->back()->with('success', "Berhasil memproses absensi. {$processedCount} mahasiswa telah dicatat kehadirannya.");
    }

    public function destroy(Workshop $workshop): RedirectResponse
    {
        try {
            $this->workshopService->cancelWorkshop($workshop);
            return redirect()->back()->with('success', 'Pembekalan berhasil dibatalkan.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
