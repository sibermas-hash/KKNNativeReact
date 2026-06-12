<?php

use App\Models\KKN\TahunAkademik;

describe('Admin Tahun Akademik API', function () {
    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('auto-activates a newly created academic year when none are active', function () {
        TahunAkademik::query()->update(['is_active' => false]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/tahun-akademik', [
                'year' => '2099/2100',
                'is_active' => false,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.year', '2099/2100')
            ->assertJsonPath('data.is_active', true);

        expect(TahunAkademik::where('year', '2099/2100')->first()?->is_active)->toBeTrue();
    });

    it('prevents disabling the only active academic year', function () {
        TahunAkademik::query()->update(['is_active' => false]);
        $tahunAkademik = TahunAkademik::factory()->create([
            'year' => '2098/2099',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/tahun-akademik/{$tahunAkademik->id}", [
                'is_active' => false,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.message', 'Sistem memerlukan minimal satu tahun akademik yang aktif.');

        expect($tahunAkademik->fresh()?->is_active)->toBeTrue();
    });

    it('includes created_at in the academic year resource', function () {
        $tahunAkademik = TahunAkademik::factory()->active()->create([
            'year' => '2097/2098',
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/tahun-akademik')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $tahunAkademik->id,
                'year' => '2097/2098',
                'is_active' => true,
                'created_at' => $tahunAkademik->created_at?->toIso8601String(),
            ]);
    });
})->group('admin');
