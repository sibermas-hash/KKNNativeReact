<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use App\Services\MasterApiService;
use App\Services\StudentSyncService;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class StudentSyncServiceTest extends TestCase
{
    private MasterApiService $masterApiMock;

    private StudentSyncService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->masterApiMock = Mockery::mock(MasterApiService::class);
        $this->service = new StudentSyncService($this->masterApiMock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_sync_from_api_calls_master_api(): void
    {
        $mockStudents = [
            ['nim' => '1234567890', 'name' => 'John Doe', 'email' => 'john@student.com', 'organization_id' => null, 'prodi_id' => null],
        ];

        $this->masterApiMock
            ->shouldReceive('yieldSyncMahasiswa')
            ->once()
            ->andReturn((function () use ($mockStudents) {
                foreach ($mockStudents as $s) {
                    yield $s;
                }
            })());

        $result = $this->service->syncFromApi();

        $this->assertSame(1, $result['total']);
    }

    public function test_sync_from_api_filters_by_nim_list(): void
    {
        $mockStudents = [
            ['nim' => '1111111111', 'name' => 'Student One', 'email' => 'one@student.com', 'organization_id' => null, 'prodi_id' => null],
            ['nim' => '3333333333', 'name' => 'Student Three', 'email' => 'three@student.com', 'organization_id' => null, 'prodi_id' => null],
        ];

        $this->masterApiMock
            ->shouldReceive('getStudentsByNimList')
            ->once()
            ->with(['1111111111', '3333333333'])
            ->andReturn($mockStudents);

        $result = $this->service->syncFromApi(['1111111111', '3333333333']);

        $this->assertSame(2, $result['total']);
    }

    public function test_sync_from_api_returns_error_count_on_failure(): void
    {
        $mockStudents = [
            ['nim' => '1234567890', 'name' => 'John Doe', 'email' => 'john@student.com', 'organization_id' => null, 'prodi_id' => null],
        ];

        $this->masterApiMock
            ->shouldReceive('yieldSyncMahasiswa')
            ->once()
            ->andReturn((function () use ($mockStudents) {
                foreach ($mockStudents as $s) {
                    yield $s;
                }
            })());

        Log::shouldReceive('warning')->andReturn(null);

        $result = $this->service->syncFromApi();

        $this->assertArrayHasKey('synced', $result);
        $this->assertArrayHasKey('errors', $result);
        $this->assertArrayHasKey('log', $result);
    }

    public function test_upsert_student_creates_new_user_and_mahasiswa(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => '9999999999',
            'name' => 'New Student',
            'email' => 'new@student.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
            'sks_completed' => 100,
            'gpa' => 3.50,
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $this->assertDatabaseHas('users', [
            'username' => '9999999999',
            'name' => 'New Student',
        ]);

        $this->assertDatabaseHas('mahasiswa', [
            'nim' => '9999999999',
            'nama' => 'New Student',
            'sks_completed' => 100,
            'gpa' => 3.50,
        ]);
    }

    public function test_upsert_student_updates_existing_record(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $user = User::factory()->create(['username' => '8888888888']);
        Mahasiswa::factory()->create([
            'nim' => '8888888888',
            'user_id' => $user->id,
            'nama' => 'Old Name',
            'sks_completed' => 80,
        ]);

        $data = [
            'nim' => '8888888888',
            'name' => 'Updated Name',
            'email' => 'updated@student.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'P',
            'sks_completed' => 120,
            'gpa' => 3.80,
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', '8888888888')->first();
        $this->assertSame('Updated Name', $mahasiswa->nama);
        $this->assertSame(120, $mahasiswa->sks_completed);
        $this->assertSame(3.80, $mahasiswa->gpa);
    }

    public function test_upsert_student_resolves_faculty_by_master_id(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $fakultas = Fakultas::factory()->create(['master_id' => 'FAC-001']);

        $data = [
            'nim' => '7777777777',
            'name' => 'Faculty Student',
            'email' => 'faculty@student.com',
            'organization_id' => 'FAC-001',
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', '7777777777')->first();
        $this->assertSame($fakultas->id, $mahasiswa->fakultas_id);
    }

    public function test_upsert_student_resolves_prodi_by_master_id(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $prodi = Prodi::factory()->create(['master_id' => 'PRODI-001']);

        $data = [
            'nim' => '6666666666',
            'name' => 'Prodi Student',
            'email' => 'prodi@student.com',
            'organization_id' => null,
            'prodi_id' => 'PRODI-001',
            'batch_year' => 2024,
            'gender' => 'P',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', '6666666666')->first();
        $this->assertSame($prodi->id, $mahasiswa->prodi_id);
    }

    public function test_upsert_student_logs_warning_for_unmapped_faculty(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->with(Mockery::on(fn ($msg) => str_contains($msg, 'unmapped organization_id')));

        $data = [
            'nim' => '5555555555',
            'name' => 'No Faculty Student',
            'email' => 'nofaculty@student.com',
            'organization_id' => 'NONEXISTENT',
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', '5555555555')->first();
        $this->assertNull($mahasiswa->fakultas_id);
    }

    public function test_upsert_student_logs_warning_for_unmapped_prodi(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->with(Mockery::on(fn ($msg) => str_contains($msg, 'unmapped prodi_id')));

        $data = [
            'nim' => '4444444444',
            'name' => 'No Prodi Student',
            'email' => 'noprodu@student.com',
            'organization_id' => null,
            'prodi_id' => 'NONEXISTENT',
            'batch_year' => 2024,
            'gender' => 'P',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', '4444444444')->first();
        $this->assertNull($mahasiswa->prodi_id);
    }

    public function test_upsert_student_assigns_student_role(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => '3333333333',
            'name' => 'Role Student',
            'email' => 'role@student.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $user = User::where('username', '3333333333')->first();
        $this->assertTrue($user->hasRole('student'));
    }

    public function test_upsert_student_uses_fallback_email(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => '2222222222',
            'name' => 'Fallback Email Student',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'P',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $user = User::where('username', '2222222222')->first();
        $this->assertSame('2222222222@student.uinsaizu.ac.id', $user->email);
    }

    public function test_upsert_student_uses_provided_email(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => '1111111111',
            'name' => 'Custom Email Student',
            'email' => 'custom@email.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $user = User::where('username', '1111111111')->first();
        $this->assertSame('custom@email.com', $user->email);
    }

    public function test_upsert_student_handles_alternative_field_names(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => '0000000001',
            'name' => 'Alt Fields Student',
            'email' => 'alt@student.com',
            'alamat' => 'Jl. Alternative Address',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'P',
            'sks' => 90,
            'ipk' => 3.20,
            'bta_ppi_passed' => true,
            'nama_ibu' => 'Mother Name',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', '0000000001')->first();
        $this->assertSame(90, $mahasiswa->sks_completed);
        $this->assertSame(3.20, $mahasiswa->gpa);
        $this->assertTrue($mahasiswa->status_bta_ppi === 'LULUS');
        $this->assertSame('Mother Name', $mahasiswa->mother_name);
    }

    public function test_validate_and_prepare_import_data_validates_rows(): void
    {
        $rows = [
            ['nim' => '123', 'nama' => 'Valid Student'],
            ['nim' => '', 'nama' => 'Invalid Student'],
            ['nim' => '456', 'nama' => ''],
            ['nim' => '789', 'nama' => 'Another Valid'],
        ];

        $result = $this->service->validateAndPrepareImportData($rows);

        $this->assertCount(2, $result['data']);
        $this->assertCount(2, $result['errors']);
    }

    public function test_validate_and_prepare_import_data_all_valid(): void
    {
        $rows = [
            ['nim' => '123', 'nama' => 'Student One'],
            ['nim' => '456', 'nama' => 'Student Two'],
        ];

        $result = $this->service->validateAndPrepareImportData($rows);

        $this->assertCount(2, $result['data']);
        $this->assertEmpty($result['errors']);
    }

    public function test_validate_and_prepare_import_data_all_invalid(): void
    {
        $rows = [
            ['nim' => '', 'nama' => ''],
            ['nim' => null, 'nama' => null],
        ];

        $result = $this->service->validateAndPrepareImportData($rows);

        $this->assertEmpty($result['data']);
        $this->assertCount(2, $result['errors']);
    }

    public function test_validate_and_prepare_import_data_empty_rows(): void
    {
        $result = $this->service->validateAndPrepareImportData([]);

        $this->assertEmpty($result['data']);
        $this->assertEmpty($result['errors']);
    }

    public function test_validate_and_prepare_import_data_error_includes_line_number(): void
    {
        $rows = [
            ['nim' => '', 'nama' => 'Invalid'],
        ];

        $result = $this->service->validateAndPrepareImportData($rows);

        $this->assertStringContainsString('Baris 2', $result['errors'][0]);
    }

    public function test_upsert_student_handles_nik_field(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => 'NIKTEST001',
            'name' => 'NIK Test Student',
            'email' => 'nik@student.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
            'nik' => '1234567890123456',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', 'NIKTEST001')->first();
        $this->assertSame('1234567890123456', $mahasiswa->nik);
    }

    public function test_upsert_student_handles_national_id_fallback(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => 'NICTEST001',
            'name' => 'National ID Test Student',
            'email' => 'nationalid@student.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'P',
            'national_id' => '9876543210987654',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', 'NICTEST001')->first();
        $this->assertSame('9876543210987654', $mahasiswa->nik);
    }

    public function test_upsert_student_sets_master_synced_at(): void
    {
        Log::shouldReceive('warning')->andReturn(null);

        $data = [
            'nim' => 'SYNCTEST001',
            'name' => 'Sync Test Student',
            'email' => 'sync@student.com',
            'organization_id' => null,
            'prodi_id' => null,
            'batch_year' => 2024,
            'gender' => 'L',
            'id' => 'EXT-001',
        ];

        $result = $this->service->upsertStudent($data);

        $this->assertTrue($result);

        $mahasiswa = Mahasiswa::where('nim', 'SYNCTEST001')->first();
        $this->assertNotNull($mahasiswa->master_synced_at);
        $this->assertSame('EXT-001', $mahasiswa->master_id);
    }
}
