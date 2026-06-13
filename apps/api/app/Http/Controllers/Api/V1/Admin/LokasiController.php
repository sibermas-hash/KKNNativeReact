<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\QueryHelper;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LokasiResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\Region\IndonesiaDistrict;
use App\Models\Region\IndonesiaRegency;
use App\Models\Region\IndonesiaVillage;
use App\Services\Region\NominatimGeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LokasiController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function denyFacultyAdminMutation(): void
    {
        abort_if($this->facultyScopeId(), 403, 'Admin fakultas hanya memiliki akses baca untuk data lokasi.');
    }

    private function scopeByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->where(function ($q) use ($facultyId) {
                $q->whereNull('fakultas_id')->orWhere('fakultas_id', $facultyId);
            });
        }
    }

    public function index(Request $request): JsonResponse
    {
        $lokasi = Lokasi::with('fakultas')
            ->when($request->input('province_code'), fn ($q, $code) => $q->where('province_code', $code))
            ->when($request->input('regency_code'), fn ($q, $code) => $q->where('regency_code', $code))
            ->when($request->input('district_code'), fn ($q, $code) => $q->where('district_code', $code))
            ->when($request->input('search'), fn ($q, $s) => $q->where('village_name', 'like', '%'.QueryHelper::escapeLike($s).'%'))
            ->orderBy('regency_name')
            ->orderBy('district_name')
            ->orderBy('village_name');

        $this->scopeByFaculty($lokasi);

        $lokasi = $lokasi->paginate($request->input('per_page', 25));

        return $this->successCollection(LokasiResource::collection($lokasi));
    }

    public function updateSelection(Request $request): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:lokasi,id'],
            'is_selected_for_kkn' => ['required', 'boolean'],
        ]);

        if ((bool) $validated['is_selected_for_kkn']) {
            $missingCoordinates = Lokasi::query()
                ->whereIn('id', $validated['ids'])
                ->where(fn ($q) => $q->whereNull('latitude')->orWhereNull('longitude'))
                ->count();

            if ($missingCoordinates > 0) {
                return $this->error(
                    'LOCATION_COORDINATES_REQUIRED',
                    "{$missingCoordinates} lokasi belum dapat diverifikasi sebagai wilayah kerja KKN. Sistem akan memproses koordinat di backend; coba simpan ulang lokasi atau hubungi admin teknis.",
                    422,
                );
            }
        }

        $updated = Lokasi::whereIn('id', $validated['ids'])
            ->update(['is_selected_for_kkn' => (bool) $validated['is_selected_for_kkn']]);

        return $this->success(['updated' => $updated], 'Pilihan lokasi berhasil disimpan.');
    }

    public function store(Request $request): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $validated = $this->validatedPayload($request);
        $validated = $this->ensureCoordinates($validated);

        return $this->created(new LokasiResource(Lokasi::create($validated)), 'Lokasi berhasil dibuat.');
    }

    public function update(Request $request, Lokasi $lokasi): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $payload = $this->validatedPayload($request, false);
        $nextLatitude = array_key_exists('latitude', $payload) ? $payload['latitude'] : $lokasi->latitude;
        $nextLongitude = array_key_exists('longitude', $payload) ? $payload['longitude'] : $lokasi->longitude;

        if ($lokasi->is_selected_for_kkn && (blank($nextLatitude) || blank($nextLongitude))) {
            return $this->error('LOCATION_COORDINATES_REQUIRED', 'Lokasi terpilih untuk KKN belum terverifikasi sebagai wilayah kerja.', 422);
        }

        $lokasi->update($payload);

        return $this->success(new LokasiResource($lokasi->refresh()), 'Lokasi berhasil diperbarui.');
    }

    /** @return array<string, mixed> */
    private function validatedPayload(Request $request, bool $creating = true): array
    {
        $required = $creating ? 'required_without:village_code' : 'sometimes';
        $validated = $request->validate([
            'province_code' => ['nullable', 'string', 'size:2', 'exists:indonesia_provinces,code'],
            'regency_code' => ['nullable', 'string', 'size:5', 'exists:indonesia_regencies,code'],
            'district_code' => ['nullable', 'string', 'size:8', 'exists:indonesia_districts,code'],
            'village_code' => ['nullable', 'string', 'max:13', 'exists:indonesia_villages,code'],
            'village_name' => [$required, 'string', 'max:255'],
            'district_name' => ['nullable', 'string', 'max:255'],
            'regency_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-11,6.5'],
            'longitude' => ['nullable', 'numeric', 'between:95,141.5'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
            'is_selected_for_kkn' => ['sometimes', 'boolean'],
        ]);

        if (! empty($validated['village_code'])) {
            $village = IndonesiaVillage::query()->findOrFail($validated['village_code']);
            $district = IndonesiaDistrict::query()->findOrFail($village->district_code);
            $regency = IndonesiaRegency::query()->findOrFail($district->regency_code);

            $validated['village_name'] = $village->name;
            $validated['district_code'] = $district->code;
            $validated['district_name'] = $district->name;
            $validated['regency_code'] = $regency->code;
            $validated['regency_name'] = $regency->name;
            $validated['province_code'] = $regency->province_code;
        }

        return $validated;
    }

    /** @param array<string, mixed> $payload @return array<string, mixed> */
    private function ensureCoordinates(array $payload): array
    {
        if (filled($payload['latitude'] ?? null) && filled($payload['longitude'] ?? null)) {
            return $payload;
        }

        $query = collect([
            $payload['village_name'] ?? null,
            $payload['district_name'] ?? null,
            $payload['regency_name'] ?? null,
            'Indonesia',
        ])->filter(fn ($value) => filled($value))->implode(', ');

        $result = app(NominatimGeocodingService::class)->search($query);
        abort_if(! $result, 422, 'Lokasi belum dapat diverifikasi otomatis sebagai wilayah kerja KKN. Coba simpan ulang beberapa saat lagi.');

        $payload['latitude'] = $result['latitude'];
        $payload['longitude'] = $result['longitude'];

        return $payload;
    }

    public function destroy(Lokasi $lokasi): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        // Audit R11-GROUP-018 fix: block delete kalau ada kelompok yang
        // masih mereferensikan lokasi ini. Sebelumnya delete langsung
        // (dan FK cascadeOnDelete akan menghapus kelompok + peserta terkait
        // — data loss silent). Sekarang return 422 dengan info berapa
        // kelompok terkait supaya admin pindahkan dulu.
        $groupsUsing = KelompokKkn::where('location_id', $lokasi->id)->count();
        if ($groupsUsing > 0) {
            return $this->error(
                'VALIDATION_ERROR',
                "Lokasi tidak dapat dihapus: masih digunakan oleh {$groupsUsing} kelompok KKN. Pindahkan kelompok ke lokasi lain terlebih dahulu.",
                422,
            );
        }

        try {
            $lokasi->delete();

            return $this->noContent('Lokasi berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->error('VALIDATION_ERROR', 'Gagal menghapus: '.$e->getMessage(), 422);
        }
    }

    public function geocode(Lokasi $lokasi, NominatimGeocodingService $geocoding): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $query = collect([
            $lokasi->village_name,
            $lokasi->district_name,
            $lokasi->regency_name,
            'Indonesia',
        ])->filter(fn ($value) => filled($value))->implode(', ');

        $result = $geocoding->search($query);
        if (! $result) {
            return $this->error('GEOCODING_NOT_FOUND', 'Koordinat tidak ditemukan. Isi latitude/longitude manual atau cek nama wilayah.', 422);
        }

        $lokasi->update([
            'latitude' => $result['latitude'],
            'longitude' => $result['longitude'],
        ]);

        return $this->success([
            'location' => new LokasiResource($lokasi->refresh()),
            'geocoding' => $result,
        ], 'Koordinat lokasi berhasil ditemukan.');
    }

    public function import(Request $request): JsonResponse
    {
        $this->denyFacultyAdminMutation();

        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240']]);

        return $this->success(['imported' => 0], 'Import lokasi selesai.');
    }

    public function export(): JsonResponse
    {
        $query = Lokasi::with('fakultas')->orderBy('village_name');
        $this->scopeByFaculty($query);

        return $this->success(LokasiResource::collection($query->get()));
    }

    public function regulerPool(Request $request): JsonResponse
    {
        $lokasi = Lokasi::query()
            ->with('fakultas')
            ->when($request->input('search'), fn ($q, $s) => $q->where('village_name', 'like', '%'.QueryHelper::escapeLike($s).'%'))
            ->orderBy('village_name');

        $this->scopeByFaculty($lokasi);

        $lokasi = $lokasi->get();

        return $this->success(LokasiResource::collection($lokasi));
    }
}
