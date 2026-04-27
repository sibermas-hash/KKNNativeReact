<?php

namespace Tests\Unit\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\PlacementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlacementServiceTest extends TestCase
{
    use RefreshDatabase;

    private PlacementService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PlacementService::class);
    }

    public function test_self_determined_placement_assigns_correctly()
    {
        // Arrange
        $mahasiswa = Mahasiswa::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'kapasitas' => 1, // Self-determined usually 1 or specific small number
        ]);
        $peserta = PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => null,
            'status' => 'terdaftar',
        ]);

        // Act
        $result = $this->service->placeStudentSelfDetermined($peserta, $kelompok);

        // Assert
        $this->assertTrue($result);
        $this->assertEquals($kelompok->id, $peserta->fresh()->kelompok_id);
    }
}
