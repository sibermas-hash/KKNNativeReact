<?php

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Services\LogbookPdfService;

describe('Logbook PDF (R5)', function () {

    beforeEach(function () {
        $this->periode = createActivePeriod('execution');

        $this->studentUser = createUserWithRole('student');

        // Populate required profile fields so EnsureProfileCompleted middleware passes
        $this->studentUser->update([
            'avatar' => 'avatars/default.png',
            'phone' => '081234567890',
            'address' => 'Jl. Testing 1',
            'address_village_name' => 'Desa Testing',
            'address_district_name' => 'Kec Test',
            'address_regency_name' => 'Kab Test',
            'address_postal_code' => '12345',
            'address_lat' => -7.5,
            'address_lng' => 109.2,
            'address_verified_at' => now(),
        ]);

        // Buat mahasiswa record + link ke user
        $this->mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $this->studentUser->id,
            'nim' => '2200001234',
            'nik' => '1234567890123456',
            'mother_name' => 'Ibu Testing',
            'birth_place' => 'Purwokerto',
            'birth_date' => '2000-01-01',
            'gender' => 'L',
            'shirt_size' => 'L',
        ]);
    });

    it('service generates PDF bytes for valid mahasiswa + periode', function () {
        $service = app(LogbookPdfService::class);
        $pdf = $service->generate($this->mahasiswa, $this->periode);

        $output = $pdf->output();
        expect(strlen($output))->toBeGreaterThan(1500);
        expect(substr($output, 0, 4))->toBe('%PDF');
    });

    it('student can download own logbook PDF', function () {
        $this->actingAs($this->studentUser)
            ->get('/api/v1/student/logbook/pdf?periode='.$this->periode->id)
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    });

    it('admin can download any mahasiswa logbook', function () {
        $admin = createUserWithRole('superadmin');

        $this->actingAs($admin)
            ->get("/api/v1/admin/mahasiswa/{$this->mahasiswa->id}/logbook?periode={$this->periode->id}")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    });

    it('service returns non-empty PDF when kegiatan exist', function () {
        $lokasi = Lokasi::factory()->create();
        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $this->periode->id,
            'location_id' => $lokasi->id,
        ]);
        PesertaKkn::factory()->create([
            'mahasiswa_id' => $this->mahasiswa->id,
            'periode_id' => $this->periode->id,
            'kelompok_id' => $kelompok->id,
            'status' => 'approved',
        ]);

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $this->mahasiswa->id,
            'kelompok_id' => $kelompok->id,
            'date' => now()->subDays(2)->toDateString(),
            'title' => 'Penyuluhan Sehat',
            'activity' => 'Memberi penyuluhan gizi',
            'status' => 'approved',
        ]);

        $service = app(LogbookPdfService::class);
        $pdf = $service->generate($this->mahasiswa, $this->periode, approvedOnly: true);
        $output = $pdf->output();

        // PDF dengan isi harus lebih besar dari yang kosong
        expect(strlen($output))->toBeGreaterThan(2500);
        expect(substr($output, 0, 4))->toBe('%PDF');
    });
});
