<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrationDocumentController extends Controller
{
    use ApiResponse;

    public function store(Request $request, int $id): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden();
        }

        $registration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $id)
            ->first();

        if (! $registration) {
            return $this->notFound('Pendaftaran tidak ditemukan.');
        }

        $validated = $request->validate([
            'health_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'parent_permission' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if ($request->hasFile('health_certificate')) {
            $path = $request->file('health_certificate')->store('documents/health', config('filesystems.default'));
            $mahasiswa->update(['health_certificate_path' => $path]);
        }

        if ($request->hasFile('parent_permission')) {
            $path = $request->file('parent_permission')->store('documents/parent', config('filesystems.default'));
            $mahasiswa->update(['parent_permission_path' => $path]);
        }

        return $this->noContent('Dokumen berhasil diunggah.');
    }
}
