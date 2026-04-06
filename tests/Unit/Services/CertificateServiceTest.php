<?php

namespace Tests\Unit\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\User;
use App\Services\CertificateService;
use Barryvdh\DomPDF\PDF;
use RuntimeException;
use Tests\TestCase;

class CertificateServiceTest extends TestCase
{
    private CertificateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CertificateService();
    }

    private function seedCertificateConfig(array $overrides = []): void
    {
        $defaults = [
            'cert_title' => 'SERTIFIKAT',
            'cert_body' => 'Body text',
            'cert_signer_left_name' => 'Signer 1',
            'cert_signer_left_title' => 'Title 1',
            'cert_signer_right_name' => 'Signer 2',
            'cert_signer_right_title' => 'Title 2',
        ];

        foreach (array_merge($defaults, $overrides) as $key => $value) {
            KonfigurasiSertifikat::create([
                'config_key' => $key,
                'label' => str($key)->replace('_', ' ')->title()->toString(),
                'value' => $value,
                'type' => 'text',
            ]);
        }
    }

    public function test_generate_verification_token_is_deterministic(): void
    {
        $score = NilaiKkn::factory()->make([
            'id' => 1,
            'user_id' => 1,
        ]);

        $token1 = CertificateService::generateVerificationToken($score);
        $token2 = CertificateService::generateVerificationToken($score);

        $this->assertSame($token1, $token2);
    }

    public function test_generate_verification_token_is_sixteen_chars(): void
    {
        $score = NilaiKkn::factory()->make([
            'id' => 5,
            'user_id' => 10,
        ]);

        $token = CertificateService::generateVerificationToken($score);

        $this->assertSame(16, strlen($token));
    }

    public function test_generate_verification_token_is_uppercase_hex(): void
    {
        $score = NilaiKkn::factory()->make([
            'id' => 123,
            'user_id' => 456,
        ]);

        $token = CertificateService::generateVerificationToken($score);

        $this->assertMatchesRegularExpression('/^[A-F0-9]{16}$/', $token);
    }

    public function test_generate_verification_token_differs_for_different_scores(): void
    {
        $scoreA = NilaiKkn::factory()->make(['id' => 1, 'user_id' => 1]);
        $scoreB = NilaiKkn::factory()->make(['id' => 2, 'user_id' => 1]);

        $tokenA = CertificateService::generateVerificationToken($scoreA);
        $tokenB = CertificateService::generateVerificationToken($scoreB);

        $this->assertNotSame($tokenA, $tokenB);
    }

    public function test_generate_verification_token_differs_for_different_users(): void
    {
        $scoreA = NilaiKkn::factory()->make(['id' => 1, 'user_id' => 1]);
        $scoreB = NilaiKkn::factory()->make(['id' => 1, 'user_id' => 2]);

        $tokenA = CertificateService::generateVerificationToken($scoreA);
        $tokenB = CertificateService::generateVerificationToken($scoreB);

        $this->assertNotSame($tokenA, $tokenB);
    }

    public function test_generate_certificate_throws_when_mahasiswa_not_found(): void
    {
        $user = User::factory()->create();

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Data mahasiswa untuk nilai ini tidak ditemukan.');

        $this->service->generateForStudent($score);
    }

    public function test_generate_certificate_throws_when_laporan_akhir_not_approved(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 85,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Laporan akhir belum disetujui');

        $this->service->generateForStudent($score);
    }

    public function test_generate_certificate_throws_when_score_below_minimum(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        // Create approved laporan akhir
        LaporanAkhir::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'status' => 'approved',
        ]);

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 60,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('nilai minimal B');

        $this->service->generateForStudent($score);
    }

    public function test_generate_certificate_throws_when_no_laporan_akhir(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 85,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Laporan akhir belum disetujui');

        $this->service->generateForStudent($score);
    }

    public function test_generate_certificate_returns_pdf_instance(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        // Create approved laporan akhir
        LaporanAkhir::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'status' => 'approved',
        ]);

        $this->seedCertificateConfig();

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 85,
            'letter_grade' => 'A',
        ]);

        $pdf = $this->service->generateForStudent($score);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_certificate_score_exactly_at_minimum(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        LaporanAkhir::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'status' => 'approved',
        ]);

        $this->seedCertificateConfig([
            'cert_body' => 'Body',
            'cert_signer_left_name' => 'S1',
            'cert_signer_left_title' => 'T1',
            'cert_signer_right_name' => 'S2',
            'cert_signer_right_title' => 'T2',
        ]);

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 70,
            'letter_grade' => 'B',
        ]);

        $pdf = $this->service->generateForStudent($score);

        $this->assertInstanceOf(PDF::class, $pdf);
    }

    public function test_generate_certificate_score_one_below_minimum(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        LaporanAkhir::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'status' => 'approved',
        ]);

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 69,
            'letter_grade' => 'B-',
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('nilai minimal B');

        $this->service->generateForStudent($score);
    }

    public function test_generate_certificate_laporan_akhir_for_different_group(): void
    {
        $user = User::factory()->create();
        $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        $otherKelompok = KelompokKkn::factory()->create([
            'period_id' => $periode->id,
            'location_id' => $lokasi->id,
        ]);

        // Create approved laporan akhir for a different group
        LaporanAkhir::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $otherKelompok->id,
            'status' => 'approved',
        ]);

        $score = NilaiKkn::factory()->create([
            'user_id' => $user->id,
            'kelompok_id' => $kelompok->id,
            'total_score' => 85,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Laporan akhir belum disetujui');

        $this->service->generateForStudent($score);
    }
}
