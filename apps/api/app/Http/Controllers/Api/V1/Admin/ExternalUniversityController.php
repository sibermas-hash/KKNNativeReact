<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\ExternalUniversity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExternalUniversityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExternalUniversity::query()
            ->withCount('admins')
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = (string) $request->query('search');
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('pic_name', 'like', "%{$search}%")
                        ->orWhere('pic_email', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->latest('id');

        $perPage = min((int) $request->query('per_page', 15), 100);

        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:external_universities,code'],
            'name' => ['required', 'string', 'max:200'],
            'address' => ['nullable', 'string'],
            'pic_name' => ['nullable', 'string', 'max:150'],
            'pic_email' => ['nullable', 'email', 'max:150'],
            'pic_phone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $university = ExternalUniversity::create($data + ['status' => 'active']);

        return response()->json($university, 201);
    }

    public function show(ExternalUniversity $externalUniversity): JsonResponse
    {
        return response()->json($externalUniversity->loadCount('admins'));
    }

    public function update(Request $request, ExternalUniversity $externalUniversity): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('external_universities', 'code')->ignore($externalUniversity->id)],
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'address' => ['nullable', 'string'],
            'pic_name' => ['nullable', 'string', 'max:150'],
            'pic_email' => ['nullable', 'email', 'max:150'],
            'pic_phone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $externalUniversity->update($data);

        return response()->json($externalUniversity->fresh()->loadCount('admins'));
    }

    public function destroy(ExternalUniversity $externalUniversity): JsonResponse
    {
        $externalUniversity->delete();

        return response()->json(['message' => 'External university deleted.']);
    }
}
