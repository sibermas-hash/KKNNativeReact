<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Workshop;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Dosen;
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
        if (!auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola workshop.');
        }
        
        return Inertia::render('Admin/Workshops/Index', [
            'workshops' => $this->workshopService->getUpcomingWorkshops(null, true, true),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (!auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola workshop.');
        }
        
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

    public function previewAttendance(Request $request, int $workshopId): \Illuminate\Http\JsonResponse
    {
        if (!auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola workshop.');
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $rows = \Maatwebsite\Excel\Facades\Excel::toArray(new \stdClass(), $request->file('file'));
        $data = $rows[0] ?? [];
        
        if (empty($data)) {
            return response()->json(['error' => 'File Excel kosong.'], 422);
        }

        $headers = array_map('strtolower', array_values($data[0]));
        $nipIndex = array_search('nip', $headers);

        if ($nipIndex === false) {
            return response()->json(['error' => 'Kolom "NIP" tidak ditemukan di baris pertama Excel.'], 422);
        }

        $results = [];
        $processedNips = [];

        for ($i = 1; $i < count($data); $i++) {
            $row = $data[$i];
            $nip = trim((string) ($row[$nipIndex] ?? ''));

            if (empty($nip) || in_array($nip, $processedNips)) continue;
            $processedNips[] = $nip;

            $dosen = Dosen::where('nip', $nip)->first();
            
            if (!$dosen) {
                $results[] = [
                    'nip' => $nip,
                    'name' => 'TIDAK DITEMUKAN',
                    'status' => 'error',
                    'message' => 'NIP tidak terdaftar di database master dosen.'
                ];
                continue;
            }

            if ($dosen->is_cpns) {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'error',
                    'message' => 'CPNS tidak diperbolehkan menjadi DPL.'
                ];
                continue;
            }

            if ($dosen->is_tugas_belajar) {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'error',
                    'message' => 'Sedang Tugas Belajar (Tidak Layak DPL).'
                ];
                continue;
            }

            $peserta = PesertaWorkshop::where('workshop_id', $workshopId)
                ->where('user_id', $dosen->user_id)
                ->first();

            if ($peserta && $peserta->attendance_status === 'attended') {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'info',
                    'message' => 'Sudah lulus kualifikasi workshop sebelumnya.'
                ];
            } else {
                $results[] = [
                    'nip' => $nip,
                    'name' => $dosen->nama,
                    'status' => 'success',
                    'message' => 'Layak & Siap di-import.'
                ];
            }
        }

        return response()->json([
            'preview' => $results,
            'summary' => [
                'total' => count($results),
                'valid' => count(array_filter($results, fn($r) => $r['status'] === 'success')),
            ]
        ]);
    }

    public function importAttendance(Request $request, int $workshopId): RedirectResponse
    {
        if (!auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola workshop.');
        }

        $validated = $request->validate([
            'nims' => ['required', 'array'],
            'nims.*' => ['string'],
        ]);

        $processedCount = 0;
        foreach ($validated['nims'] as $nip) {
            $dosen = Dosen::where('nip', $nip)->first();
            if ($dosen) {
                PesertaWorkshop::updateOrCreate(
                    ['workshop_id' => $workshopId, 'user_id' => $dosen->user_id],
                    [
                        'attendance_status' => 'attended',
                        'checked_in_at' => now(),
                        'registered_at' => now()
                    ]
                );
                $processedCount++;
            }
        }

        return redirect()->back()->with('success', "Berhasil memproses kualifikasi workshop. {$processedCount} dosen telah dicatat kehadirannya.");
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
