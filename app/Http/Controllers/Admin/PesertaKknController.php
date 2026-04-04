<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PesertaKknController extends Controller
{
    /**
     * Download registration documents from local storage.
     */
    public function downloadDocument(Request $request): StreamedResponse
    {
        $path = $request->input('path');
        
        if (!$path || !Storage::disk('local')->exists($path)) {
            abort(404, 'Dokumen tidak ditemukan.');
        }

        // Security check: Only allow specific folders
        if (!str_starts_with($path, 'health-certificates/') && !str_starts_with($path, 'parent-permissions/')) {
            abort(403, 'Akses ditolak.');
        }

        return Storage::disk('local')->download($path);
    }

    public function index(Request $request): Response
    {
        $registrations = PesertaKkn::with('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('period_id'), fn ($q, $periodId) => $q->where('period_id', $periodId))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        // Map data to match React frontend expectations
        $registrations->through(function ($reg) {
            return [
                'id' => $reg->id,
                'status' => $reg->status,
                'registration_date' => $reg->registration_date,
                'student' => [
                    'nim' => $reg->mahasiswa?->nim,
                    'name' => $reg->mahasiswa?->nama ?? $reg->mahasiswa?->user?->name ?? '-',
                    'faculty' => $reg->mahasiswa?->fakultas ? ['name' => $reg->mahasiswa->fakultas->nama] : null,
                    'program' => $reg->mahasiswa?->prodi ? ['name' => $reg->mahasiswa->prodi->nama] : null,
                ],
                'period' => $reg->periode ? ['name' => $reg->periode->name, 'id' => $reg->periode->id] : ['name' => '-', 'id' => null],
                'group' => $reg->kelompok ? ['name' => $reg->kelompok->nama_kelompok] : null,
            ];
        });

        // Statistics - OPTIMIZED: Use database-level aggregation instead of loading all records
        $stats = [
            'total' => PesertaKkn::count(),
            'pending' => PesertaKkn::where('status', 'pending')->count(),
            'approved' => PesertaKkn::where('status', 'approved')->count(),
            'rejected' => PesertaKkn::where('status', 'rejected')->count(),
            'by_faculty' => PesertaKkn::selectRaw('mahasiswa.faculty_id, COUNT(*) as count')
                ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                ->leftJoin('fakultas', 'mahasiswa.faculty_id', '=', 'fakultas.id')
                ->selectRaw('COALESCE(fakultas.nama, \'Tidak Diketahui\') as faculty_name')
                ->groupBy('mahasiswa.faculty_id', 'fakultas.nama')
                ->orderByDesc('count')
                ->get()
                ->map(function ($row) {
                    return [
                        'faculty_name' => $row->faculty_name,
                        'count' => $row->count,
                    ];
                }),
        ];

        return Inertia::render('Admin/Registrations/Index', [
            'registrations' => $registrations,
            'filters' => $request->only('status', 'period_id'),
            'stats' => $stats,
        ]);
    }

    /**
     * Bulk approve registrations
     */
    public function bulkApprove(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        // WRAP IN TRANSACTION for atomicity
        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            PesertaKkn::whereIn('id', $validated['ids'])
                ->where('status', 'pending')
                ->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);
        });

        $count = count($validated['ids']);
        return redirect()->back()->with('success', "{$count} pendaftaran berhasil disetujui.");
    }

    /**
     * Bulk reject registrations
     */
    public function bulkReject(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        // WRAP IN TRANSACTION for atomicity
        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            PesertaKkn::whereIn('id', $validated['ids'])
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'notes' => $validated['notes'],
                ]);
        });

        $count = count($validated['ids']);
        return redirect()->back()->with('success', "{$count} pendaftaran ditolak.");
    }

    /**
     * Export registrations to Excel
     */
    public function export(Request $request): BinaryFileResponse
    {
        $query = PesertaKkn::with('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok')
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status));

        $registrations = $query->orderByDesc('created_at')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Header
        $headers = ['No', 'NIM', 'Nama', 'Fakultas', 'Program Studi', 'Periode', 'Kelompok', 'Status', 'Tanggal Daftar'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}1", $header);
            $col++;
        }

        // Styling header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => '2563EB']],
        ];
        $sheet->getStyle('A1:I1')->applyFromArray($headerStyle);

        // Data
        $row = 2;
        foreach ($registrations as $index => $reg) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $reg->mahasiswa?->nim ?? '-');
            $sheet->setCellValue("C{$row}", $reg->mahasiswa?->nama ?? '-');
            $sheet->setCellValue("D{$row}", $reg->mahasiswa?->fakultas?->nama ?? '-');
            $sheet->setCellValue("E{$row}", $reg->mahasiswa?->prodi?->nama ?? '-');
            $sheet->setCellValue("F{$row}", $reg->periode?->name ?? '-');
            $sheet->setCellValue("G{$row}", $reg->kelompok?->nama_kelompok ?? 'Belum ada');
            $sheet->setCellValue("H{$row}", ucfirst($reg->status));
            $sheet->setCellValue("I{$row}", $reg->created_at->format('d M Y H:i'));

            // Color code status
            $statusColor = [
                'pending' => 'FFA500',
                'approved' => '22C55E',
                'rejected' => 'EF4444',
            ][$reg->status] ?? '000000';

            $sheet->getStyle("H{$row}")->getFont()->getColor()->setRGB($statusColor);
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'data-pendaftaran-kkn-' . date('Y-m-d-His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'kkn_export_');
        $writer->save($tempFile . '.xlsx');
        $finalFile = $tempFile . '.xlsx';

        return response()->download($finalFile, $filename)->deleteFileAfterSend(true);
    }

    public function show(PesertaKkn $registration): Response
    {
        $registration->load('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'dokumen');

        return Inertia::render('Admin/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(PesertaKkn $registration): RedirectResponse
    {
        // Proteksi: Cek Kapasitas Kelompok jika mahasiswa sudah diplot ke kelompok
        if ($registration->kelompok_id) {
            $kelompok = $registration->kelompok()->withCount(['peserta' => function ($q) {
                $q->where('status', 'approved');
            }])->first();

            if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
                return redirect()->back()->withErrors(['error' => "Gagal menyetujui. Kelompok {$kelompok->nama_kelompok} sudah mencapai batas maksimal kapasitas ({$kelompok->capacity})."]);
            }
        }

        $registration->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function reject(Request $request, PesertaKkn $registration): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $registration->update([
            'status' => 'rejected',
            'notes' => $validated['notes'],
        ]);

        return redirect()->back()->with('success', 'Pendaftaran ditolak.');
    }

    public function assignGroup(Request $request, PesertaKkn $registration): RedirectResponse
    {
        $validated = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
        ]);

        // Proteksi: Cek Kapasitas Kelompok Tujuan
        $kelompok = \App\Models\KKN\KelompokKkn::withCount(['peserta' => function ($q) {
            $q->where('status', 'approved');
        }])->find($validated['kelompok_id']);

        if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
            return redirect()->back()->withErrors(['error' => "Gagal menempatkan. Kelompok tujuan {$kelompok->nama_kelompok} sudah penuh."]);
        }

        $registration->update([
            'kelompok_id' => $validated['kelompok_id'],
            'role' => 'Anggota', // Reset to Anggota when moving group
        ]);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }

    public function makeLeader(PesertaKkn $registration): RedirectResponse
    {
        // Fix: Validate student is approved and in a group
        if (!$registration->kelompok_id) {
            return redirect()->back()->withErrors(['error' => 'Mahasiswa harus ditempatkan di kelompok terlebih dahulu.']);
        }

        if ($registration->status !== 'approved') {
            return redirect()->back()->withErrors(['error' => 'Hanya mahasiswa yang sudah disetujui yang dapat menjadi ketua kelompok.']);
        }

        // WRAP IN TRANSACTION: Ensure atomicity
        \Illuminate\Support\Facades\DB::transaction(function () use ($registration) {
            // Reset all other members in the SAME group to 'Anggota'
            PesertaKkn::where('kelompok_id', $registration->kelompok_id)
                ->where('id', '!=', $registration->id)
                ->update(['role' => 'Anggota']);

            // Set this student as 'Ketua'
            $registration->update(['role' => 'Ketua']);
        });

        return redirect()->back()->with('success', "{$registration->mahasiswa->nama} kini resmi menjadi Ketua Kelompok.");
    }
}
