<?php

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Services\ComprehensiveReportService;

describe('Comprehensive Report (R4)', function () {

    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
        $this->periode = createActivePeriod('grading');
    });

    it('admin can download comprehensive report PDF', function () {
        $response = $this->actingAs($this->admin)
            ->get("/api/v1/admin/report/comprehensive/{$this->periode->id}");

        $response->assertOk();
        expect($response->headers->get('content-type'))->toContain('application/pdf');
        expect($response->headers->get('content-disposition'))
            ->toContain("laporan-komprehensif-kkn-periode-{$this->periode->id}");
    });

    it('unauthenticated user cannot download report', function () {
        $response = $this->get("/api/v1/admin/report/comprehensive/{$this->periode->id}");

        // Depending on middleware, this will be 401 (unauthenticated) or redirect
        expect($response->status())->toBeIn([401, 302]);
    });

    it('non-admin user cannot download report', function () {
        $student = createUserWithRole('student');

        $this->actingAs($student)
            ->get("/api/v1/admin/report/comprehensive/{$this->periode->id}")
            ->assertForbidden();
    });

    it('report service returns correct structure for empty periode', function () {
        $service = app(ComprehensiveReportService::class);
        $pdf = $service->generateForPeriode($this->periode->id);

        // Output should be a non-empty PDF binary
        $output = $pdf->output();
        expect(strlen($output))->toBeGreaterThan(1000);
        expect(substr($output, 0, 4))->toBe('%PDF');
    });

    it('report service handles kelompok + peserta data', function () {
        // Create a lokasi + kelompok
        $lokasi = Lokasi::factory()->create([
            'village_name' => 'Desa Contoh',
            'district_name' => 'Kecamatan Test',
        ]);

        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $this->periode->id,
            'location_id' => $lokasi->id,
            'nama_kelompok' => 'Kelompok Uji',
            'code' => 'K001',
        ]);

        $service = app(ComprehensiveReportService::class);
        $pdf = $service->generateForPeriode($this->periode->id);

        expect(strlen($pdf->output()))->toBeGreaterThan(2000);
    });
});
