<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FinalReportController extends Controller
{
    /**
     * Validate file magic bytes to prevent MIME spoofing.
     */
    private function validateFileMagicBytes($file, ?array $allowedSignatures = null): void
    {
        if ($allowedSignatures === null) {
            $allowedSignatures = [
                'pdf' => [0x25, 0x50, 0x44], // %PD
                'docx' => [0x50, 0x4B, 0x03, 0x04], // PK (ZIP)
            ];
        }

        try {
            $stream = fopen($file->getRealPath(), 'rb');
            $bytes = array_values(unpack('C4', fread($stream, 4)));
            fclose($stream);

            $valid = false;
            foreach ($allowedSignatures as $signature) {
                if (count($bytes) >= count($signature)) {
                    if (array_slice($bytes, 0, count($signature)) === array_values($signature)) {
                        $valid = true;
                        break;
                    }
                }
            }

            abort_if(!$valid, 422, 'File format tidak valid atau tidak sesuai dengan type yang dideklarasikan.');
        } catch (\Exception $e) {
            abort(422, 'Gagal memvalidasi file.');
        }
    }
    public function create(): Response
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $pendaftaran = $mahasiswa?->peserta()->where('status', 'approved')->first();
        
        // Check if student is the leader of the group
        $isLeader = $pendaftaran && $pendaftaran->role === 'Ketua';

        $laporanAda = $pendaftaran
            ? LaporanAkhir::where('kelompok_id', $pendaftaran->kelompok_id)->latest()->first()
            : null;

        return Inertia::render('Student/FinalReport/Create', [
            'group' => $pendaftaran?->kelompok,
            'existingReport' => $laporanAda,
            'isLeader' => $isLeader,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        abort_if(!$mahasiswa, 403, 'Profil mahasiswa tidak ditemukan.');
        
        $pendaftaran = $mahasiswa->peserta()->where('status', 'approved')->first();
        
        abort_if(!$pendaftaran || !$pendaftaran->kelompok_id, 403, 'Anda belum terdaftar dalam kelompok.');
        abort_if($pendaftaran->role !== 'Ketua', 403, 'Hanya Ketua Kelompok yang diizinkan mengunggah Laporan Akhir.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:300'],
            'abstract' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:20480'],
        ]);

        $file = $request->file('file');

        // Security: Validate magic bytes to prevent MIME spoofing
        $this->validateFileMagicBytes($file);

        // Security: Store with UUID filename - prevents path traversal and filename injection
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $safeFilename = Str::uuid() . '.' . $extension;

        $path = $file->storeAs('final-reports', $safeFilename, 'local');

        LaporanAkhir::updateOrCreate(
            ['kelompok_id' => $pendaftaran->kelompok_id],
            [
                'mahasiswa_id' => $mahasiswa->id,
                'title' => $validated['title'],
                'abstract' => $validated['abstract'] ?? null,
                'file_path' => $path,
                'file_name' => Str::limit($originalName, 255),
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        return redirect()->route('student.dashboard')
            ->with('success', 'Laporan akhir kelompok berhasil dikirim.');
    }
}
