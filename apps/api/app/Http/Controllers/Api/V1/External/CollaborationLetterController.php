<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\External;

use App\Http\Controllers\Controller;
use App\Models\KKN\CollaborationLetter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CollaborationLetterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $externalUniversityId = $this->externalUniversityId($request);

        $query = CollaborationLetter::query()
            ->withCount('participants')
            ->where('external_university_id', $externalUniversityId)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->latest('id');

        return response()->json($query->paginate(min((int) $request->query('per_page', 15), 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $externalUniversityId = $this->externalUniversityId($request);

        $data = $request->validate([
            'letter_number' => ['nullable', 'string', 'max:100'],
            'letter_date' => ['nullable', 'date'],
            'subject' => ['nullable', 'string', 'max:200'],
            'sender_name' => ['nullable', 'string', 'max:150'],
            'sender_position' => ['nullable', 'string', 'max:150'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('collaboration-letters', 'private');
        }

        $letter = CollaborationLetter::create($data + [
            'external_university_id' => $externalUniversityId,
            'created_by' => $request->user()->id,
            'status' => 'draft',
        ]);

        return response()->json($letter, 201);
    }

    public function show(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $this->abortUnlessScoped($request, $letter);

        return response()->json($letter->loadCount('participants'));
    }

    public function update(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $this->abortUnlessScoped($request, $letter);
        abort_unless(in_array($letter->status, ['draft', 'rejected'], true), 403, 'Surat tidak dapat diedit.');

        $data = $request->validate([
            'letter_number' => ['nullable', 'string', 'max:100'],
            'letter_date' => ['nullable', 'date'],
            'subject' => ['nullable', 'string', 'max:200'],
            'sender_name' => ['nullable', 'string', 'max:150'],
            'sender_position' => ['nullable', 'string', 'max:150'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if ($request->hasFile('file')) {
            if ($letter->file_path) {
                Storage::disk('private')->delete($letter->file_path);
            }
            $data['file_path'] = $request->file('file')->store('collaboration-letters', 'private');
        }

        $letter->update($data);

        return response()->json($letter->fresh());
    }

    public function submit(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $this->abortUnlessScoped($request, $letter);
        abort_unless(in_array($letter->status, ['draft', 'rejected'], true), 403, 'Surat tidak dapat disubmit.');

        $letter->update(['status' => 'submitted']);

        return response()->json($letter->fresh());
    }

    public function destroy(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $this->abortUnlessScoped($request, $letter);
        abort_unless(in_array($letter->status, ['draft', 'rejected'], true), 403, 'Surat tidak dapat dihapus.');

        $letter->delete();

        return response()->json(['message' => 'Collaboration letter deleted.']);
    }

    private function externalUniversityId(Request $request): int
    {
        $id = (int) $request->user()->external_university_id;
        abort_if($id <= 0, 403, 'Akun belum terhubung ke kampus luar.');

        return $id;
    }

    private function abortUnlessScoped(Request $request, CollaborationLetter $letter): void
    {
        abort_unless((int) $letter->external_university_id === $this->externalUniversityId($request), 404);
    }
}
