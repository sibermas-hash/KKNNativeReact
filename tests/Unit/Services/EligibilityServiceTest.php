<?php

namespace Tests\Unit\Services;

use App\Models\KKN\DokumenPesertaKkn;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Services\EligibilityService;
use Tests\TestCase;

class EligibilityServiceTest extends TestCase
{
    private EligibilityService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EligibilityService;
    }

    public function test_check_eligibility_returns_correct_structure(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'John Doe',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa);

        $this->assertArrayHasKey('mahasiswa_id', $result);
        $this->assertArrayHasKey('nim', $result);
        $this->assertArrayHasKey('nama', $result);
        $this->assertArrayHasKey('sks_completed', $result);
        $this->assertArrayHasKey('gpa', $result);
        $this->assertArrayHasKey('is_bta_ppi_passed', $result);
        $this->assertArrayHasKey('has_health_certificate', $result);
        $this->assertArrayHasKey('has_parent_permission', $result);
        $this->assertArrayHasKey('checks', $result);
        $this->assertArrayHasKey('is_eligible', $result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('issue_count', $result);
    }

    public function test_student_with_all_requirements_met_is_eligible(): void
    {
        $periode = Periode::factory()->create([
            'is_active' => true,
            'registration_start' => now()->subDay(),
            'registration_end' => now()->addDay(),
        ]);

        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Jane Doe',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, $periode->id);

        $this->assertTrue($result['is_eligible']);
        $this->assertEmpty($result['issues']);
        $this->assertSame(0, $result['issue_count']);
    }

    public function test_student_fails_when_sks_below_minimum(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Low SKS Student',
            'sks_completed' => 80,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['min_sks']['passed']);
        $this->assertFalse($result['is_eligible']);
        $this->assertGreaterThan(0, $result['issue_count']);
    }

    public function test_student_fails_when_bta_ppi_not_passed(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'No BTA Student',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'BELUM_LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['bta_ppi']['passed']);
        $this->assertFalse($result['is_eligible']);
    }

    public function test_student_fails_when_documents_are_missing(): void
    {
        $jenisKkn = JenisKkn::factory()->create([
            'require_health_certificate' => true,
            'require_parent_permission' => true,
        ]);

        $periode = Periode::factory()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'is_active' => true,
            'registration_start' => now()->subDay(),
            'registration_end' => now()->addDay(),
        ]);

        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'No Docs Student',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => null,
            'parent_permission_path' => null,
            'is_paid_ukt' => true,
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, $periode->id);

        $this->assertFalse($result['checks']['documents']['passed']);
        $this->assertFalse($result['is_eligible']);
        $this->assertFalse($result['has_health_certificate']);
        $this->assertFalse($result['has_parent_permission']);
    }

    public function test_student_fails_when_dynamic_required_document_is_missing(): void
    {
        $jenisKkn = JenisKkn::factory()->create([
            'required_documents' => ['Scan KRS'],
        ]);

        $periode = Periode::factory()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'is_active' => true,
            'registration_start' => now()->subDay(),
            'registration_end' => now()->addDay(),
        ]);

        $mahasiswa = Mahasiswa::factory()->create([
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'is_paid_ukt' => true,
        ]);

        $result = $this->service->checkEligibility($mahasiswa, $periode->id);

        $this->assertFalse($result['checks']['documents']['passed']);
        $this->assertContains('Scan KRS', $result['checks']['documents']['missing_documents']);
    }

    public function test_student_passes_dynamic_document_check_after_upload(): void
    {
        $jenisKkn = JenisKkn::factory()->create([
            'required_documents' => ['Scan KRS'],
        ]);

        $periode = Periode::factory()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'is_active' => true,
            'registration_start' => now()->subDay(),
            'registration_end' => now()->addDay(),
        ]);

        $mahasiswa = Mahasiswa::factory()->create([
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'is_paid_ukt' => true,
        ]);

        $registration = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $periode->id,
            'status' => 'document_submitted',
        ]);

        DokumenPesertaKkn::create([
            'peserta_kkn_id' => $registration->id,
            'document_type' => 'krs',
            'file_path' => 'registration-documents/krs/krs.pdf',
            'file_name' => 'krs.pdf',
            'file_size' => 123456,
            'uploaded_at' => now(),
            'status' => 'pending',
        ]);

        $result = $this->service->checkEligibility($mahasiswa, $periode->id);

        $this->assertTrue($result['checks']['documents']['passed']);
        $this->assertSame([], $result['checks']['documents']['missing_documents']);
    }

    public function test_student_fails_when_no_active_registration_period(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'No Period Student',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, null);

        $this->assertFalse($result['checks']['registration_window']['passed']);
        $this->assertFalse($result['is_eligible']);
    }

    public function test_registration_window_fails_when_outside_period(): void
    {
        $periode = Periode::factory()->create([
            'is_active' => true,
            'registration_start' => now()->subDays(10),
            'registration_end' => now()->subDays(5),
        ]);

        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Late Student',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, $periode->id);

        $this->assertFalse($result['checks']['registration_window']['passed']);
        $this->assertFalse($result['is_eligible']);
    }

    public function test_registration_window_passes_when_within_period(): void
    {
        $periode = Periode::factory()->create([
            'is_active' => true,
            'registration_start' => now()->subDays(5),
            'registration_end' => now()->addDays(10),
        ]);

        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'On Time Student',
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, $periode->id);

        $this->assertTrue($result['checks']['registration_window']['passed']);
    }

    public function test_fails_when_student_already_completed_kkn(): void
    {
        $mahasiswa = Mahasiswa::factory()->create([
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'status' => 'completed',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['no_prior_completion']['passed']);
        $this->assertFalse($result['is_eligible']);
    }

    public function test_fails_when_student_has_active_registration(): void
    {
        $currentPeriod = Periode::factory()->create([
            'is_active' => true,
            'registration_start' => now()->subDay(),
            'registration_end' => now()->addDay(),
        ]);

        $otherPeriod = Periode::factory()->create();

        $mahasiswa = Mahasiswa::factory()->create([
            'sks_completed' => 120,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $otherPeriod->id,
            'status' => 'pending',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, $currentPeriod->id);

        $this->assertFalse($result['checks']['no_active_registration']['passed']);
        $this->assertFalse($result['is_eligible']);
    }

    public function test_gpa_check_is_skipped_when_disabled(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Low GPA Student',
            'sks_completed' => 120,
            'gpa' => 1.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertTrue($result['checks']['min_gpa']['passed']);
        $this->assertFalse($result['checks']['min_gpa']['enabled']);
    }

    public function test_gpa_check_fails_when_below_minimum(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Low GPA Student',
            'sks_completed' => 120,
            'gpa' => 1.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', true);
        SystemSetting::set('min_gpa_registration', 2.00);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['min_gpa']['passed']);
        $this->assertTrue($result['checks']['min_gpa']['enabled']);
    }

    public function test_sks_at_minimum_is_eligible(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Exact SKS Student',
            'sks_completed' => 100,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertTrue($result['checks']['min_sks']['passed']);
    }

    public function test_sks_slightly_below_minimum_fails(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Near SKS Student',
            'sks_completed' => 99,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['min_sks']['passed']);
    }

    public function test_sks_defaults_to_zero_when_null(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Null SKS Student',
            'sks_completed' => null,
            'gpa' => 3.50,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', false);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['min_sks']['passed']);
    }

    public function test_gpa_defaults_to_zero_when_null(): void
    {
        $mahasiswa = Mahasiswa::factory()->make([
            'id' => 1,
            'nim' => '1234567890',
            'nama' => 'Null GPA Student',
            'sks_completed' => 120,
            'gpa' => null,
            'status_bta_ppi' => 'LULUS',
            'health_certificate_path' => 'certs/health.pdf',
            'parent_permission_path' => 'certs/permission.pdf',
        ]);

        SystemSetting::set('min_sks_registration', 100);
        SystemSetting::set('enable_gpa_requirement', true);
        SystemSetting::set('min_gpa_registration', 2.00);

        $result = $this->service->checkEligibility($mahasiswa, 1);

        $this->assertFalse($result['checks']['min_gpa']['passed']);
        $this->assertSame(0.0, $result['checks']['min_gpa']['current_gpa']);
    }
}
