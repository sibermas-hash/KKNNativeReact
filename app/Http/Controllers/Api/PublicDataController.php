<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicDataController extends Controller
{
    /**
     * Map table names to their respective Eloquent Models for integrity enforcement.
     */
    private const MODEL_MAP = [
        'mahasiswa' => Mahasiswa::class,
        'dosen' => Dosen::class,
        'fakultas' => Fakultas::class,
        'prodi' => Prodi::class,
        'kelompok_kkn' => KelompokKkn::class,
        'lokasi' => Lokasi::class,
        'periode' => Periode::class,
        'tahun_akademik' => TahunAkademik::class,
        '_projects' => Project::class,
    ];

    /**
     * Strict allowlist of writable columns per table via public API.
     */
    private const WRITABLE_COLUMNS = [
        'mahasiswa' => [],
        'dosen' => [],
        'fakultas' => [],
        'prodi' => [],
        'kelompok_kkn' => [],
        'lokasi' => [],
        'periode' => [],
        'tahun_akademik' => [],
        '_projects' => ['project_name', 'email', 'description'],
    ];

    /**
     * Tables that can be deleted via public API (None allowed for public).
     */
    private const DELETABLE_TABLES = [];

    /**
     * Standard API response wrapper untuk consistency across all endpoints.
     */
    private function apiResponse(bool $success, string $message, mixed $data = null, int $code = 200, array $extra = []): JsonResponse
    {
        $payload = [
            'success' => $success,
            'status' => $success ? 'success' : 'error',
            'code' => $code,
            'message' => $message,
            'data' => $data,
        ];

        if (! $success) {
            $payload['error'] = $message;
        }

        return response()->json(array_merge($payload, $extra), $code);
    }

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

        // SECURITY: Tables WITHOUT a mapped model are strictly forbidden
        if (! $model) {
            return $this->apiResponse(false, "Akses data mentah ke tabel '{$table}' dilarang.", null, 403);
        }

        $query = $model->query();

        // Get allowed columns for this table to prevent SQL injection
        $allowedColumns = $this->getTableColumns($table);

        // Apply filters — only allow whitelisted column names
        $reserved = ['page', 'per_page', 'order_by', 'order'];
        foreach ($request->query() as $key => $value) {
            if (! in_array($key, $reserved, true) && in_array($key, $allowedColumns, true)) {
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

        $perPage = min((int) $request->get('per_page', 25), 100);
        $paginated = $query->paginate($perPage);

        return $this->apiResponse(
            true,
            'Data berhasil diambil',
            $paginated->items(),
            200,
            [
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'last_page' => $paginated->lastPage(),
                ],
            ]
        );
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
        if (! $modelClass) {
            return $this->apiResponse(false, 'Model mapping tidak ditemukan untuk tabel ini.', null, 500);
        }

        try {
            $allowedColumns = $this->getWritableColumns($table);
            if (empty($allowedColumns)) {
                return $this->apiResponse(false, 'Tabel ini tidak dapat ditulis melalui API.', null, 403);
            }

            $record = $modelClass::create($request->only($allowedColumns));

            return $this->apiResponse(true, 'Data berhasil ditambahkan.', $record, 201);
        } catch (\Throwable $e) {
            Log::error('PublicData API error', ['exception' => $e]);

            return $this->apiResponse(false, 'Terjadi kesalahan pada server.', null, 500);
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

        if (! $record) {
            return $this->apiResponse(false, 'Data tidak ditemukan.', null, 404);
        }

        try {
            $allowedColumns = $this->getWritableColumns($table);
            if (empty($allowedColumns)) {
                return $this->apiResponse(false, 'Tabel ini tidak dapat ditulis melalui API.', null, 403);
            }

            $record->update($request->only($allowedColumns));

            return $this->apiResponse(true, 'Data berhasil diupdate dan disinkronkan.', $record->fresh());
        } catch (\Throwable $e) {
            Log::error('PublicData API error', ['exception' => $e]);

            return $this->apiResponse(false, 'Terjadi kesalahan pada server.', null, 500);
        }
    }

    public function destroy(Request $request, string $table, int $id): JsonResponse
    {
        if ($error = $this->validateAccess($request, $table, 'delete')) {
            return $error;
        }

        // Fix: Prevent deletion of reference tables via API
        if (! in_array($table, self::DELETABLE_TABLES, true)) {
            return $this->apiResponse(false, "Penghapusan data '{$table}' tidak diizinkan melalui API.", null, 403);
        }

        $modelClass = self::MODEL_MAP[$table] ?? null;
        $record = $modelClass ? $modelClass::find($id) : null;

        if (! $record) {
            return $this->apiResponse(false, 'Data tidak ditemukan.', null, 404);
        }

        try {
            $record->delete();

            return $this->apiResponse(true, 'Data berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->apiResponse(false, 'Gagal menghapus data.', null, 500);
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
        if (! $model) {
            return [];
        }

        $fillable = $model->getFillable();

        // Ensure model has explicitly defined fillable columns
        if (empty($fillable)) {
            Log::warning('API Security: Model has no fillable columns', [
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
        if (! in_array($table, $allowed, true)) {
            return $this->apiResponse(false, "Tabel '{$table}' tidak tersedia atau tidak diizinkan.", null, 403);
        }

        /** @var ApiKey $apiKey */
        $apiKey = $request->attributes->get('api_key');
        if ($apiKey && ! $apiKey->hasPermission($permission)) {
            return $this->apiResponse(false, "Izin '{$permission}' ditolak.", null, 403);
        }

        return null;
    }
}
