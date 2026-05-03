<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KknRequirement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KknRequirementController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(['requirements' => KknRequirement::ordered()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['name' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'is_active' => ['nullable', 'boolean'], 'sort_order' => ['nullable', 'integer']]);
        return $this->created(['id' => KknRequirement::create($validated)->id], 'Persyaratan berhasil dibuat.');
    }

    public function update(Request $request, KknRequirement $requirement): JsonResponse
    {
        $requirement->update($request->validate(['name' => ['sometimes', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'is_active' => ['nullable', 'boolean']]));
        return $this->success(['requirement' => $requirement->refresh()], 'Persyaratan berhasil diperbarui.');
    }

    public function destroy(KknRequirement $requirement): JsonResponse
    {
        $requirement->delete();
        return $this->noContent('Persyaratan berhasil dihapus.');
    }

    public function toggle(KknRequirement $requirement): JsonResponse
    {
        $requirement->update(['is_active' => ! $requirement->is_active]);
        return $this->success(['requirement' => $requirement->refresh()], 'Status persyaratan berhasil diubah.');
    }
}
