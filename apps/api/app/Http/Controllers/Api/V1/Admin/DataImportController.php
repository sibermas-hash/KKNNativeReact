<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Imports\DosenDataImport;
use App\Imports\NilaiKknHistorisImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataImportController extends Controller
{
    use ApiResponse;

    /**
     * POST /admin/import/dosen-data
     * Import data dosen dari file HTML (DB2 format).
     * Hanya mengisi field yang kosong, tidak overwrite.
     */
    public function importDosenData(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:html,htm', 'max:20480'],
        ]);

        $file = $request->file('file');
        $tempPath = $file->getRealPath();

        $import = new DosenDataImport;
        $import->import($tempPath);

        $response = [
            'updated' => $import->updatedCount,
            'skipped' => $import->skippedCount,
            'not_found' => $import->notFoundCount,
        ];

        if ($import->notFoundCount > 0) {
            $response['not_found_details'] = array_slice($import->notFoundDetails, 0, 20);
        }

        $message = "Import selesai: {$import->updatedCount} dosen diperbarui.";
        if ($import->notFoundCount > 0) {
            $message .= " {$import->notFoundCount} NIP tidak ditemukan di database.";
        }
        if ($import->skippedCount > 0) {
            $message .= " {$import->skippedCount} dilewati (data sudah lengkap/baris kosong).";
        }

        return $this->success($response, $message);
    }

    /**
     * POST /admin/import/nilai-kkn-historis
     * Import nilai KKN historis dari file HTML.
     * Menandai mahasiswa sebagai sudah pernah ikut KKN (completed).
     */
    public function importNilaiKknHistoris(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:html,htm', 'max:20480'],
            'periode_id' => ['nullable', 'exists:periode,id'],
            'angkatan' => ['nullable', 'string', 'max:50'],
        ]);

        $file = $request->file('file');
        $tempPath = $file->getRealPath();
        $periodeId = $request->input('periode_id') ? (int) $request->input('periode_id') : null;
        $angkatan = $request->input('angkatan', '');

        $import = new NilaiKknHistorisImport($periodeId, $angkatan);
        $import->import($tempPath);

        $response = [
            'imported' => $import->importedCount,
            'skipped' => $import->skippedCount,
            'not_found' => $import->notFoundCount,
        ];

        if ($import->notFoundCount > 0) {
            $response['not_found_details'] = array_slice($import->notFoundDetails, 0, 20);
        }

        $message = "Import selesai: {$import->importedCount} mahasiswa ditandai sudah KKN.";
        if ($import->notFoundCount > 0) {
            $message .= " {$import->notFoundCount} NIM tidak ditemukan di database.";
        }
        if ($import->skippedCount > 0) {
            $message .= " {$import->skippedCount} dilewati (sudah tercatat/baris kosong).";
        }

        return $this->success($response, $message);
    }
}
