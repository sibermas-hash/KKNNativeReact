<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\Prodi;
use App\Services\DashboardStatisticsService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class DashboardStatisticsServiceTest extends TestCase
{
    private DashboardStatisticsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DashboardStatisticsService();
    }

    public function test_get_period_statistics_returns_structure(): void
    {
        $periode = Periode::factory()->create();

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('students_by_status', $result);
        $this->assertArrayHasKey('grade_distribution', $result);
        $this->assertArrayHasKey('dpl_workload', $result);
        $this->assertArrayHasKey('sdg_distribution', $result);
    }

    public function test_summary_stats_returns_zero_for_empty_period(): void
    {
        $periode = Periode::factory()->create();

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(0, $result['summary']['total_students']);
        $this->assertSame(0, $result['summary']['total_groups']);
        $this->assertSame(0, $result['summary']['total_reports']);
        $this->assertSame(0, $result['summary']['pending_registrations']);
        $this->assertSame(0, $result['summary']['total_work_programs']);
        $this->assertSame(0, $result['summary']['total_final_reports']);
        $this->assertSame(0, $result['summary']['assigned_students']);
        $this->assertSame(0, $result['summary']['unassigned_students']);
    }

    public function test_summary_stats_counts_students(): void
    {
        $periode = Periode::factory()->create();

        PesertaKkn::factory()->count(3)->create([
            'period_id' => $periode->id,
            'status' => 'pending',
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(3, $result['summary']['total_students']);
        $this->assertSame(3, $result['summary']['pending_registrations']);
    }

    public function test_summary_stats_counts_groups(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();

        KelompokKkn::factory()->count(2)->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(2, $result['summary']['total_groups']);
    }

    public function test_summary_stats_counts_reports(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $mahasiswa = Mahasiswa::factory()->create();

        KegiatanKkn::factory()->count(5)->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
        ]);
        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(5, $result['summary']['total_reports']);
    }

    public function test_summary_stats_counts_assigned_vs_unassigned(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        PesertaKkn::factory()->create([
            'period_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        PesertaKkn::factory()->create([
            'period_id' => $periode->id,
            'kelompok_id' => null,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(1, $result['summary']['assigned_students']);
        $this->assertSame(1, $result['summary']['unassigned_students']);
    }

    public function test_students_by_status_returns_empty_for_empty_period(): void
    {
        $periode = Periode::factory()->create();

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertIsArray($result['students_by_status']);
    }

    public function test_students_by_status_groups_by_status(): void
    {
        $periode = Periode::factory()->create();

        PesertaKkn::factory()->count(2)->create([
            'period_id' => $periode->id,
            'status' => 'pending',
        ]);

        PesertaKkn::factory()->count(3)->create([
            'period_id' => $periode->id,
            'status' => 'approved',
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $statusCounts = $result['students_by_status'];
        $this->assertArrayHasKey('pending', $statusCounts);
        $this->assertArrayHasKey('approved', $statusCounts);
    }

    public function test_grade_distribution_returns_empty_for_no_grades(): void
    {
        $periode = Periode::factory()->create();

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertIsArray($result['grade_distribution']);
    }

    public function test_grade_distribution_counts_by_letter_grade(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompokA = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);
        $kelompokB = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        NilaiKkn::factory()->create([
            'kelompok_id' => $kelompokA->id,
            'letter_grade' => 'A',
            'is_finalized' => true,
        ]);

        NilaiKkn::factory()->create([
            'kelompok_id' => $kelompokB->id,
            'letter_grade' => 'B',
            'is_finalized' => true,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $grades = $result['grade_distribution'];
        $this->assertArrayHasKey('A', $grades);
        $this->assertArrayHasKey('B', $grades);
    }

    public function test_grade_distribution_excludes_non_finalized(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        NilaiKkn::factory()->create([
            'kelompok_id' => $kelompok->id,
            'letter_grade' => 'A',
            'is_finalized' => false,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $grades = $result['grade_distribution'];
        $this->assertArrayNotHasKey('A', $grades);
    }

    public function test_dpl_workload_returns_empty_for_no_dpls(): void
    {
        $periode = Periode::factory()->create();

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertIsArray($result['dpl_workload']);
        $this->assertEmpty($result['dpl_workload']);
    }

    public function test_dpl_workload_counts_groups_and_students(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();

        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
            'dpl_id' => $dosen->id,
        ]);

        PesertaKkn::factory()->count(3)->create([
            'period_id' => $periode->id,
            'kelompok_id' => $kelompok->id,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertCount(1, $result['dpl_workload']);
        $this->assertSame(1, (int) $result['dpl_workload'][0]['total_groups']);
        $this->assertSame(3, (int) $result['dpl_workload'][0]['total_students']);
    }

    public function test_sdg_distribution_returns_empty_for_no_programs(): void
    {
        $periode = Periode::factory()->create();

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertIsArray($result['sdg_distribution']);
        $this->assertEmpty($result['sdg_distribution']);
    }

    public function test_sdg_distribution_counts_goals(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        ProgramKerja::factory()->create([
            'kelompok_id' => $kelompok->id,
            'sdg_goals' => [1, 4, 10],
        ]);

        ProgramKerja::factory()->create([
            'kelompok_id' => $kelompok->id,
            'sdg_goals' => [4, 10],
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $sdgs = $result['sdg_distribution'];
        $sdgMap = collect($sdgs)->pluck('count', 'id')->toArray();

        $this->assertSame(1, $sdgMap[1]);
        $this->assertSame(2, $sdgMap[4]);
        $this->assertSame(2, $sdgMap[10]);
    }

    public function test_clear_cache_removes_cached_entry(): void
    {
        $periode = Periode::factory()->create();

        // First call caches the data
        $this->service->getPeriodStatistics($periode->id);

        $cacheKey = "dashboard:period:{$periode->id}:faculty:global";
        $this->assertTrue(Cache::has($cacheKey));

        // Clear the cache
        $this->service->clearCache($periode->id);

        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_clear_cache_with_faculty_id(): void
    {
        $periode = Periode::factory()->create();
        $facultyId = 5;

        $this->service->getPeriodStatistics($periode->id, $facultyId);

        $cacheKey = "dashboard:period:{$periode->id}:faculty:{$facultyId}";
        $this->assertTrue(Cache::has($cacheKey));

        $this->service->clearCache($periode->id, $facultyId);

        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_statistics_are_cached(): void
    {
        $periode = Periode::factory()->create();

        $firstResult = $this->service->getPeriodStatistics($periode->id);
        $secondResult = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame($firstResult, $secondResult);
    }

    public function test_statistics_with_faculty_filter(): void
    {
        $periode = Periode::factory()->create();
        $fakultas = Fakultas::factory()->create();
        $program = Prodi::factory()->create([
            'faculty_id' => $fakultas->id,
        ]);
        $otherFaculty = Fakultas::factory()->create();
        $otherProgram = Prodi::factory()->create([
            'faculty_id' => $otherFaculty->id,
        ]);

        $mahasiswaWithFaculty = Mahasiswa::factory()->create([
            'faculty_id' => $fakultas->id,
            'program_id' => $program->id,
        ]);

        $mahasiswaOtherFaculty = Mahasiswa::factory()->create([
            'faculty_id' => $otherFaculty->id,
            'program_id' => $otherProgram->id,
        ]);

        PesertaKkn::factory()->create([
            'period_id' => $periode->id,
            'mahasiswa_id' => $mahasiswaWithFaculty->id,
        ]);

        PesertaKkn::factory()->create([
            'period_id' => $periode->id,
            'mahasiswa_id' => $mahasiswaOtherFaculty->id,
        ]);

        // Global count includes all
        $globalResult = $this->service->getPeriodStatistics($periode->id);
        $this->assertSame(2, $globalResult['summary']['total_students']);

        // Faculty-filtered count includes only matching faculty
        $facultyResult = $this->service->getPeriodStatistics($periode->id, $fakultas->id);
        $this->assertSame(1, $facultyResult['summary']['total_students']);
    }

    public function test_summary_stats_counts_work_programs(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        ProgramKerja::factory()->count(4)->create([
            'kelompok_id' => $kelompok->id,
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(4, $result['summary']['total_work_programs']);
    }

    public function test_summary_stats_counts_final_reports(): void
    {
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $mahasiswa = Mahasiswa::factory()->create();

        LaporanAkhir::factory()->create([
            'kelompok_id' => $kelompok->id,
            'mahasiswa_id' => $mahasiswa->id,
            'status' => 'approved',
        ]);

        $result = $this->service->getPeriodStatistics($periode->id);

        $this->assertSame(1, $result['summary']['total_final_reports']);
    }
}
