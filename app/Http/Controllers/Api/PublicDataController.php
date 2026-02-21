<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicDataController extends Controller
{
    /**
     * List / filter data from an allowed table.
     *
     * GET /api/v1/{table}?column=value&...
     */
    public function index(Request $request, string $table): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'read')) {
            return $error;
        }

        $query = DB::table($table);

        // Apply filters from query params (simple equality)
        $reserved = ['page', 'per_page', 'order_by', 'order'];
        foreach ($request->query() as $key => $value) {
            if (!in_array($key, $reserved, true)) {
                $query->where($key, $value);
            }
        }

        // Ordering
        if ($request->has('order_by')) {
            $direction = $request->get('order', 'asc');
            $query->orderBy($request->get('order_by'), $direction);
        }

        // Pagination
        $perPage = min((int)$request->get('per_page', 25), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Insert a new row into an allowed table.
     *
     * POST /api/v1/{table}
     */
    public function store(Request $request, string $table): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'write')) {
            return $error;
        }

        $data = $request->except(['_token', '_method']);

        if (empty($data)) {
            return response()->json(['error' => 'Data tidak boleh kosong.'], 400);
        }

        try {
            $id = DB::table($table)->insertGetId($data);
            $record = DB::table($table)->where('id', $id)->first();

            return response()->json([
                'message' => 'Data berhasil ditambahkan.',
                'data' => $record,
            ], 201);
        }
        catch (\Throwable $e) {
            return response()->json([
                'error' => 'Gagal menambahkan data.',
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update a row in an allowed table.
     *
     * PATCH /api/v1/{table}/{id}
     */
    public function update(Request $request, string $table, int $id): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'write')) {
            return $error;
        }

        $data = $request->except(['_token', '_method']);

        if (empty($data)) {
            return response()->json(['error' => 'Data update tidak boleh kosong.'], 400);
        }

        $existing = DB::table($table)->where('id', $id)->first();
        if (!$existing) {
            return response()->json(['error' => 'Data tidak ditemukan.'], 404);
        }

        try {
            DB::table($table)->where('id', $id)->update($data);
            $updated = DB::table($table)->where('id', $id)->first();

            return response()->json([
                'message' => 'Data berhasil diupdate.',
                'data' => $updated,
            ]);
        }
        catch (\Throwable $e) {
            return response()->json([
                'error' => 'Gagal mengupdate data.',
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete a row from an allowed table.
     *
     * DELETE /api/v1/{table}/{id}
     */
    public function destroy(Request $request, string $table, int $id): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'delete')) {
            return $error;
        }

        $existing = DB::table($table)->where('id', $id)->first();
        if (!$existing) {
            return response()->json(['error' => 'Data tidak ditemukan.'], 404);
        }

        try {
            DB::table($table)->where('id', $id)->delete();

            return response()->json([
                'message' => 'Data berhasil dihapus.',
            ]);
        }
        catch (\Throwable $e) {
            return response()->json([
                'error' => 'Gagal menghapus data.',
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Validate table access: check whitelist and permissions.
     */
    private function validateAccess(Request $request, string $table, string $permission): ?JsonResponse
    {
        // Check table whitelist
        $allowed = config('api_keys.allowed_tables', []);
        if (!in_array($table, $allowed, true)) {
            return response()->json([
                'error' => "Tabel '{$table}' tidak tersedia atau tidak diizinkan.",
            ], 403);
        }

        // Check permission on the API key
        /** @var ApiKey $apiKey */
        $apiKey = $request->attributes->get('api_key');
        if ($apiKey && !$apiKey->hasPermission($permission)) {
            return response()->json([
                'error' => "API key kamu tidak memiliki izin '{$permission}' untuk tabel ini.",
            ], 403);
        }

        return null;
    }
}