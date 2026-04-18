<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Services\DailyReportCompilationService;
use Barryvdh\DomPDF\PDF;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use RuntimeException;
use Tests\TestCase;

class DailyReportCompilationServiceTest extends TestCase
{
    private DailyReportCompilationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DailyReportCompilationService;
    }

    public function test_generate_for_student_returns_pdf_instance(): void
    {
        $user = User::factory()->create();
        Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        $pdf = $this->service->generateForStudent($user->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_student_includes_reports(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        KegiatanKkn::factory()->count(3)->create([
            'mahasiswa_id' => $mahasiswa->id,
        ]);

        $pdf = $this->service->generateForStudent($user->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_student_throws_when_user_not_found(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->service->generateForStudent(999999);
    }

    public function test_generate_for_student_throws_when_user_has_no_mahasiswa(): void
    {
        $user = User::factory()->create();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('User tidak memiliki data mahasiswa.');

        $this->service->generateForStudent($user->id);
    }

    public function test_generate_for_student_with_no_reports(): void
    {
        $user = User::factory()->create();
        Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        $pdf = $this->service->generateForStudent($user->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_student_with_mixed_status_reports(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'status' => 'approved',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'status' => 'submitted',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'status' => 'revision',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'status' => 'draft',
        ]);

        $pdf = $this->service->generateForStudent($user->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_group_returns_pdf_instance(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $pdf = $this->service->generateForGroup($kelompok->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_group_includes_all_student_reports(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $mahasiswaA = Mahasiswa::factory()->create();
        $mahasiswaB = Mahasiswa::factory()->create();

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswaA->id,
            'periode_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswaB->id,
            'periode_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        KegiatanKkn::factory()->count(2)->create([
            'mahasiswa_id' => $mahasiswaA->id,
        ]);

        KegiatanKkn::factory()->count(3)->create([
            'mahasiswa_id' => $mahasiswaB->id,
        ]);

        $pdf = $this->service->generateForGroup($kelompok->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_group_throws_when_group_not_found(): void
    {
        $this->expectException(ModelNotFoundException::class);

        $this->service->generateForGroup(999999);
    }

    public function test_generate_for_group_with_no_reports(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $pdf = $this->service->generateForGroup($kelompok->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_group_with_dpl(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $kelompok->dosen()->attach($dosen->id, ['role' => 'Ketua']);

        $pdf = $this->service->generateForGroup($kelompok->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_student_orders_reports_by_date(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'date' => '2024-01-05',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'date' => '2024-01-01',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'date' => '2024-01-03',
        ]);

        $pdf = $this->service->generateForStudent($user->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_for_group_orders_reports_by_date(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $mahasiswa = Mahasiswa::factory()->create();

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'date' => '2024-01-10',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'date' => '2024-01-01',
        ]);

        $pdf = $this->service->generateForGroup($kelompok->id);

        $this->assertInstanceOf(PDF::class, $pdf);
    }
}
