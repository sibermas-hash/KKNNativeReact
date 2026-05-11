<?php

use App\Models\KKN\BimbinganSession;
use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;

describe('Sistem Bimbingan Online (R6)', function () {

    beforeEach(function () {
        $this->periode = createActivePeriod('execution');

        // DPL (dosen) setup
        $this->dplUser = createUserWithRole('dpl');
        $this->dosen = Dosen::factory()->create([
            'user_id' => $this->dplUser->id,
        ]);

        // Kelompok
        $this->lokasi = Lokasi::factory()->create();
        $this->kelompok = KelompokKkn::factory()->create([
            'periode_id' => $this->periode->id,
            'location_id' => $this->lokasi->id,
        ]);
        // Link DPL to kelompok as ketua
        $this->kelompok->dosen()->attach($this->dosen->id, ['role' => 'Ketua']);

        // Mahasiswa peserta
        $this->studentUser = createUserWithRole('student');
        $this->studentUser->update([
            'avatar' => 'a.png', 'phone' => '081', 'address' => 'addr',
            'address_village_name' => 'v', 'address_district_name' => 'd',
            'address_regency_name' => 'r', 'address_postal_code' => '12345',
            'address_lat' => -7.5, 'address_lng' => 109.2, 'address_verified_at' => now(),
        ]);
        $this->mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $this->studentUser->id,
            'nik' => '1234567890123456', 'mother_name' => 'ibu',
            'birth_place' => 'pwk', 'birth_date' => '2000-01-01',
            'gender' => 'L', 'shirt_size' => 'L',
        ]);
        PesertaKkn::factory()->create([
            'mahasiswa_id' => $this->mahasiswa->id,
            'periode_id' => $this->periode->id,
            'kelompok_id' => $this->kelompok->id,
            'status' => 'approved',
        ]);
    });

    it('DPL can create bimbingan session', function () {
        $this->actingAs($this->dplUser)
            ->postJson('/api/v1/dpl/bimbingan', [
                'kelompok_id' => $this->kelompok->id,
                'periode_id' => $this->periode->id,
                'scheduled_at' => now()->addDays(2)->toIso8601String(),
                'duration_minutes' => 90,
                'topik' => 'Diskusi Program Kerja Minggu 1',
                'agenda' => 'Evaluasi progress + next steps',
                'mode' => 'online',
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            ])
            ->assertStatus(201)
            ->assertJson(['success' => true]);

        $this->assertDatabaseCount('bimbingan_sessions', 1);
    });

    it('DPL cannot create session for kelompok they do not supervise', function () {
        $otherLokasi = Lokasi::factory()->create();
        $otherKelompok = KelompokKkn::factory()->create([
            'periode_id' => $this->periode->id,
            'location_id' => $otherLokasi->id,
        ]);

        $this->withoutExceptionHandling();

        try {
            $this->actingAs($this->dplUser)
                ->postJson('/api/v1/dpl/bimbingan', [
                    'kelompok_id' => $otherKelompok->id,
                    'periode_id' => $this->periode->id,
                    'scheduled_at' => now()->addDays(2)->toIso8601String(),
                    'topik' => 'Test',
                ]);
            $this->fail('Expected 403 HttpException but got success');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            expect($e->getStatusCode())->toBe(403);
        }
    });

    it('DPL can mark session as completed with notulensi', function () {
        $session = BimbinganSession::create([
            'kelompok_id' => $this->kelompok->id,
            'dosen_id' => $this->dosen->id,
            'periode_id' => $this->periode->id,
            'scheduled_at' => now()->subDay(),
            'duration_minutes' => 60,
            'topik' => 'Sesi 1',
            'status' => BimbinganSession::STATUS_SCHEDULED,
            'mode' => 'online',
            'created_by' => $this->dplUser->id,
        ]);

        $this->actingAs($this->dplUser)
            ->patchJson("/api/v1/dpl/bimbingan/{$session->id}/complete", [
                'notulensi' => 'Diskusi berlangsung lancar. Program kerja A disetujui, B perlu revisi.',
                'action_items' => 'Revisi proposal B minggu depan',
            ])
            ->assertOk();

        $session->refresh();
        expect($session->status)->toBe(BimbinganSession::STATUS_COMPLETED);
        expect($session->completed_at)->not->toBeNull();
    });

    it('progress endpoint reports meets_requirement=true when >=4 completed', function () {
        // Buat 4 sesi completed
        for ($i = 0; $i < 4; $i++) {
            BimbinganSession::create([
                'kelompok_id' => $this->kelompok->id,
                'dosen_id' => $this->dosen->id,
                'periode_id' => $this->periode->id,
                'scheduled_at' => now()->subDays(10 - $i),
                'duration_minutes' => 60,
                'topik' => "Sesi $i",
                'status' => BimbinganSession::STATUS_COMPLETED,
                'completed_at' => now()->subDays(10 - $i),
                'mode' => 'online',
                'notulensi' => str_repeat('Notulensi contoh. ', 5),
                'created_by' => $this->dplUser->id,
            ]);
        }

        $this->actingAs($this->dplUser)
            ->getJson("/api/v1/dpl/bimbingan/kelompok/{$this->kelompok->id}/progress")
            ->assertOk()
            ->assertJson([
                'data' => [
                    'completed_sessions' => 4,
                    'required_min' => 4,
                    'meets_requirement' => true,
                    'percentage' => 100,
                ],
            ]);
    });

    it('student can list sessions for their kelompok', function () {
        BimbinganSession::create([
            'kelompok_id' => $this->kelompok->id,
            'dosen_id' => $this->dosen->id,
            'periode_id' => $this->periode->id,
            'scheduled_at' => now()->addDays(3),
            'duration_minutes' => 60,
            'topik' => 'Sesi Akan Datang',
            'status' => BimbinganSession::STATUS_SCHEDULED,
            'mode' => 'online',
            'created_by' => $this->dplUser->id,
        ]);

        $this->actingAs($this->studentUser)
            ->getJson('/api/v1/student/bimbingan')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('student progress endpoint reports status', function () {
        $this->actingAs($this->studentUser)
            ->getJson('/api/v1/student/bimbingan/progress')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['completed_sessions', 'required_min', 'meets_requirement'],
            ]);
    });

    it('DPL cannot complete session without notulensi', function () {
        $session = BimbinganSession::create([
            'kelompok_id' => $this->kelompok->id,
            'dosen_id' => $this->dosen->id,
            'periode_id' => $this->periode->id,
            'scheduled_at' => now()->subDay(),
            'topik' => 'Sesi',
            'status' => BimbinganSession::STATUS_SCHEDULED,
            'mode' => 'online',
            'created_by' => $this->dplUser->id,
        ]);

        $this->actingAs($this->dplUser)
            ->patchJson("/api/v1/dpl/bimbingan/{$session->id}/complete", [
                'notulensi' => 'short', // Too short
            ])
            ->assertStatus(422);
    });
});
