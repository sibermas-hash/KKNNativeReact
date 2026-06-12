<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\CollaborationLetter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CollaborationLetterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CollaborationLetter::query()
            ->with(['externalUniversity', 'creator:id,name,username', 'verifier:id,name,username'])
            ->withCount('participants')
            ->when($request->filled('external_university_id'), fn ($q) => $q->where('external_university_id', $request->integer('external_university_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->latest('id');

        return response()->json($query->paginate(min((int) $request->query('per_page', 15), 100)));
    }

    public function show(CollaborationLetter $letter): JsonResponse
    {
        return response()->json($letter->load(['externalUniversity', 'creator:id,name,username', 'verifier:id,name,username'])->loadCount('participants'));
    }

    public function verify(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $request->validate(['notes' => ['nullable', 'string']]);

        abort_unless(in_array($letter->status, ['submitted', 'draft'], true), 403, 'Surat tidak dapat diverifikasi.');

        $letter->update([
            'status' => 'verified',
            'notes' => $request->input('notes', $letter->notes),
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return response()->json($letter->fresh()->load(['externalUniversity', 'verifier:id,name,username']));
    }

    public function reject(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $data = $request->validate(['notes' => ['required', 'string']]);

        abort_unless(in_array($letter->status, ['submitted', 'draft'], true), 403, 'Surat tidak dapat ditolak.');

        $letter->update([
            'status' => 'rejected',
            'notes' => $data['notes'],
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return response()->json($letter->fresh()->load(['externalUniversity', 'verifier:id,name,username']));
    }

    public function update(Request $request, CollaborationLetter $letter): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['draft', 'submitted', 'verified', 'rejected'])],
            'notes' => ['nullable', 'string'],
        ]);

        $letter->update($data);

        return response()->json($letter->fresh()->load(['externalUniversity']));
    }
}
