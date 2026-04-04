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
     * Map table names to their respective Eloquent Models for integrity enforcement.
     */
    private const MODEL_MAP = [
        'mahasiswa'      => \App\Models\KKN\Mahasiswa::class,
        'dosen'          => \App\Models\KKN\Dosen::class,
        'fakultas'       => \App\Models\KKN\Fakultas::class,
        'prodi'          => \App\Models\KKN\Prodi::class,
        'kelompok_kkn'   => \App\Models\KKN\KelompokKkn::class,
        'lokasi'         => \App\Models\KKN\Lokasi::class,
        'periode'        => \App\Models\KKN\Periode::class,
        'tahun_akademik' => \App\Models\KKN\TahunAkademik::class,
    ];

    /**
     * Strict allowlist of writable columns per table via public API.
     * Prevents mass assignment of sensitive fields.
     */
    private const WRITABLE_COLUMNS = [
        'mahasiswa' => ['batch_year'], // Only safe fields, NO is_bta_ppi_passed/sks_completed/gpa
        'dosen' => [], // Not writable via API
        'fakultas' => ['code', 'name'],
        'prodi' => ['code', 'name', 'faculty_id'],
        'kelompok_kkn' => [], // Not writable via API
        'lokasi' => ['village_name', 'address', 'latitude', 'longitude'],
        'periode' => [], // Not writable via API
        'tahun_akademik' => ['year'],
    ];

    /**
     * Tables that can be deleted via public API (empty by default for safety).
     */
    private const DELETABLE_TABLES = [];

    private function getModel(string $table)
    {
        $class = self::MODEL_MAP[$table] ?? null;
        return $class ? new $class : null;
    }

    /**
     * Get writable columns for a table (strict allowlist).
     */
    private function getWritableColumns(string $table): array
    {
        return self::WRITABLE_COLUMNS[$table] ?? [];
    }

    /**
     * List / filter data from an allowed table using Eloquent.
     */
    public function index(Request $request, string $table): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'read')) {
            return $error;
        }

        $model = $this->getModel($table);
        $query = $model ? $model->query() : DB::table($table);

        // Get allowed columns for this table to prevent SQL injection
        $allowedColumns = $this->getTableColumns($table);

        // Apply filters — only allow whitelisted column names
        $reserved = ['page', 'per_page', 'order_by', 'order'];
        foreach ($request->query() as $key => $value) {
            if (!in_array($key, $reserved, true) && in_array($key, $allowedColumns, true)) {
                $query->where($key, $value);
            }
        }

        if ($request->has('order_by')) {
            $orderBy = $request->get('order_by');
            $direction = strtolower($request->get('order', 'asc')) === 'desc' ? 'desc' : 'asc';
            if (in_array($orderBy, $allowedColumns, true)) {
                $query->orderBy($orderBy, $direction);
            }
        }

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
     * Insert a new row using Eloquent Models to trigger events.
     */
    public function store(Request $request, string $table): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'write')) {
            return $error;
        }

        $modelClass = self::MODEL_MAP[$table] ?? null;
        if (!$modelClass) {
            return response()->json(['error' => 'Model mapping not found for this table.'], 500);
        }

        try {
            $allowedColumns = $this->getWritableColumns($table);
            if (empty($allowedColumns)) {
                return response()->json(['error' => 'Tabel ini tidak dapat ditulis melalui API.'], 403);
            }
            
            $record = $modelClass::create($request->only($allowedColumns));

            return response()->json([
                'message' => 'Data berhasil ditambahkan via Eloquent.',
                'data' => $record,
            ], 201);
        }
        catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PublicData API error', ['exception' => $e]);
            return response()->json([
                'error' => 'Terjadi kesalahan pada server.',
            ], 500);
        }
    }

    /**
     * Update a row using Eloquent to trigger business logic (Cache flush, sync, etc).
     */
    public function update(Request $request, string $table, int $id): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'write')) {
            return $error;
        }

        $modelClass = self::MODEL_MAP[$table] ?? null;
        $record = $modelClass ? $modelClass::find($id) : null;

        if (!$record) {
            return response()->json(['error' => 'Data tidak ditemukan.'], 404);
        }

        try {
            $allowedColumns = $this->getWritableColumns($table);
            if (empty($allowedColumns)) {
                return response()->json(['error' => 'Tabel ini tidak dapat ditulis melalui API.'], 403);
            }
            
            $record->update($request->only($allowedColumns));

            return response()->json([
                'message' => 'Data berhasil diupdate dan disinkronkan.',
                'data' => $record->fresh(),
            ]);
        }
        catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PublicData API error', ['exception' => $e]);
            return response()->json([
                'error' => 'Terjadi kesalahan pada server.',
            ], 500);
        }
    }

    public function destroy(Request $request, string $table, int $id): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'delete')) {
            return $error;
        }

        // Fix: Prevent deletion of reference tables via API
        if (!in_array($table, self::DELETABLE_TABLES, true)) {
            return response()->json(['error' => "Penghapusan data '{$table}' tidak diizinkan melalui API."], 403);
        }

        $modelClass = self::MODEL_MAP[$table] ?? null;
        $record = $modelClass ? $modelClass::find($id) : null;

        if (!$record) {
            return response()->json(['error' => 'Data tidak ditemukan.'], 404);
        }

        try {
            $record->delete();
            return response()->json(['message' => 'Data berhasil dihapus.']);
        }
        catch (\Throwable $e) {
            return response()->json(['error' => 'Gagal menghapus data.'], 500);
        }
    }

    /**
     * Get allowed column names for a table to prevent SQL injection.
     * SECURITY: Only returns explicitly defined fillable columns from models.
     * Never falls back to schema introspection to prevent exposure of sensitive columns.
     */
    private function getTableColumns(string $table): array
    {
        $model = $this->getModel($table);

        // Require model to exist - never introspect schema directly
        if (!$model) {
            return [];
        }

        $fillable = $model->getFillable();

        // Ensure model has explicitly defined fillable columns
        if (empty($fillable)) {
            \Illuminate\Support\Facades\Log::warning('API Security: Model has no fillable columns', [
                'table' => $table,
                'model' => get_class($model),
            ]);
            return [];
        }

        return $fillable;
    }

    private function validateAccess(Request $request, string $table, string $permission): ?JsonResponse
    {
        $allowed = config('api_keys.allowed_tables', []);
        if (!in_array($table, $allowed, true)) {
            return response()->json(['error' => "Tabel '{$table}' tidak tersedia atau tidak diizinkan."], 403);
        }

        /** @var ApiKey $apiKey */
        $apiKey = $request->attributes->get('api_key');
        if ($apiKey && !$apiKey->hasPermission($permission)) {
            return response()->json(['error' => "Izin '{$permission}' ditolak."], 403);
        }

        return null;
    }
}
