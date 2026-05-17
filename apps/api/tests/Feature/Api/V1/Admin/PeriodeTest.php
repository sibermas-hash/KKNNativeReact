<?php

use App\Models\KKN\JenisKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\TahunAkademik;

function periodePayload(TahunAkademik $academicYear, JenisKkn $jenisKkn, array $overrides = []): array
{
    return array_merge([
        'academic_year_id' => $academicYear->id,
        'jenis_kkn_id' => $jenisKkn->id,
        'periode' => 1,
        'name' => 'KKN Audit Periode',
        'start_date' => '2026-07-01',
        'end_date' => '2026-08-31',
        'registration_start' => '2026-06-01',
        'registration_end' => '2026-06-20',
        'kuota' => 100,
        'current_phase' => 'upcoming',
        'is_active' => false,
    ], $overrides);
}

describe('Admin Periode API', function () {
    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
        $this->academicYear = TahunAkademik::firstOrCreate(
            ['year' => '2026/2027'],
            ['is_active' => true],
        );
        $this->jenisReguler = JenisKkn::firstOrCreate(
            ['code' => 'REGULER'],
            [
                'name' => 'KKN Reguler',
                'description' => 'KKN Reguler',
                'registration_mode' => Periode::REGISTRATION_MODE_OPEN,
                'placement_mode' => Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL,
                'min_sks' => 100,
                'min_gpa' => 2.0,
                'color' => '#0891b2',
                'is_active' => true,
                'sort_order' => 0,
            ],
        );
        $this->jenisTematik = JenisKkn::create([
            'code' => 'TEM'.fake()->unique()->numerify('##'),
            'name' => 'KKN Tematik Audit',
            'description' => 'Skema tematik untuk audit periode',
            'registration_mode' => 'selective',
            'placement_mode' => 'manual_admin',
            'requirements_config' => [
                'min_sks' => 100,
                'min_gpa' => 2.0,
            ],
            'attendance_config' => [
                'geofence_enabled' => true,
                'radius_meters' => 500,
                'location_source' => 'posko',
                'require_photo' => true,
                'allow_offline_sync' => true,
            ],
            'color' => '#7c3aed',
            'is_active' => true,
            'sort_order' => 90,
        ]);
    });

    it('validates unique angkatan per jenis kkn before hitting the database', function () {
        Periode::factory()->create([
            'academic_year_id' => $this->academicYear->id,
            'jenis_kkn_id' => $this->jenisReguler->id,
            'periode' => 7,
            'name' => 'KKN Reguler Angkatan 7',
        ]);

        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/periode', periodePayload($this->academicYear, $this->jenisReguler, [
                'periode' => 7,
                'name' => 'Duplikat Angkatan',
            ]))
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['errors' => ['periode']]]);
    });

    it('rejects start date that is before registration closes', function () {
        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/periode', periodePayload($this->academicYear, $this->jenisReguler, [
                'registration_end' => '2026-06-20',
                'start_date' => '2026-06-10',
            ]))
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonStructure(['error' => ['errors' => ['start_date']]]);
    });

    it('returns participant counts and foreign keys in the periods index payload', function () {
        $period = Periode::factory()->create([
            'academic_year_id' => $this->academicYear->id,
            'jenis_kkn_id' => $this->jenisReguler->id,
            'periode' => 11,
            'name' => 'KKN Reguler Angkatan 11',
        ]);
        PesertaKkn::factory()->count(2)->create([
            'periode_id' => $period->id,
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/periode?per_page=10')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $period->id,
                'academic_year_id' => $this->academicYear->id,
                'jenis_kkn_id' => $this->jenisReguler->id,
                'participants_count' => 2,
            ]);
    });

    it('deactivates the previous active period in the target jenis when moving an active period', function () {
        $source = Periode::factory()->create([
            'academic_year_id' => $this->academicYear->id,
            'jenis_kkn_id' => $this->jenisReguler->id,
            'periode' => 13,
            'name' => 'Sumber Aktif',
            'is_active' => true,
        ]);
        $target = Periode::factory()->create([
            'academic_year_id' => $this->academicYear->id,
            'jenis_kkn_id' => $this->jenisTematik->id,
            'periode' => 21,
            'name' => 'Target Aktif',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/periode/{$source->id}", [
                'jenis_kkn_id' => $this->jenisTematik->id,
                'is_active' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.jenis_kkn_id', $this->jenisTematik->id)
            ->assertJsonPath('data.is_active', true);

        expect($source->fresh()->jenis_kkn_id)->toBe($this->jenisTematik->id);
        expect($source->fresh()->is_active)->toBeTrue();
        expect($target->fresh()->is_active)->toBeFalse();
    });

    it('duplicates a period using the next available angkatan number', function () {
        $original = Periode::factory()->create([
            'academic_year_id' => $this->academicYear->id,
            'jenis_kkn_id' => $this->jenisReguler->id,
            'periode' => 30,
            'name' => 'Periode Asli',
        ]);
        Periode::factory()->create([
            'academic_year_id' => $this->academicYear->id,
            'jenis_kkn_id' => $this->jenisReguler->id,
            'periode' => 31,
            'name' => 'Periode Lain',
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/periode/{$original->id}/duplicate")
            ->assertCreated()
            ->assertJsonPath('data.periode', 32)
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.current_phase', 'upcoming');

        expect(Periode::where('jenis_kkn_id', $this->jenisReguler->id)->where('periode', 32)->exists())->toBeTrue();
    });
})->group('admin');
