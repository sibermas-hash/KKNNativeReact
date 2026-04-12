<?php

use App\Enums\KknType;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\TahunAkademik;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
});

function actingAsSuperadmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    test()->actingAs($user);

    return $user;
}

test('superadmin can duplicate a period with groups without reusing unique identifiers', function () {
    actingAsSuperadmin();

    $academicYear = TahunAkademik::factory()->create(['year' => '2026/2027']);
    $period = Periode::factory()->create([
        'academic_year_id' => $academicYear->id,
        'periode' => 57,
        'jenis' => KknType::REGULER,
        'program_type' => Periode::PROGRAM_TYPE_REGULER,
        'name' => 'Periode 57 - KKN Reguler',
        'kuota' => 2000,
    ]);

    $dosen = Dosen::factory()->create();
    $dplPeriod = DplPeriod::create([
        'dosen_id' => $dosen->id,
        'period_id' => $period->id,
        'max_groups' => 5,
        'is_active' => true,
    ]);

    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'dpl_id' => $dosen->id,
        'dpl_period_id' => $dplPeriod->id,
        'code' => 'KKN-ABCDE1',
        'token' => 'TOKEN123',
        'status' => 'active',
    ]);

    $this->from(route('admin.periode.index'))
        ->post(route('admin.periode.duplicate', ['periode' => $period->id]))
        ->assertRedirect(route('admin.periode.index'));

    $copy = Periode::whereKeyNot($period->id)->firstOrFail();
    $copiedGroup = KelompokKkn::where('period_id', $copy->id)->firstOrFail();

    expect($copy->name)->toBe('Periode 57 - KKN Reguler (Copy)')
        ->and($copy->is_active)->toBeFalse()
        ->and($copiedGroup->location_id)->toBe($group->location_id)
        ->and($copiedGroup->nama_kelompok)->toBe($group->nama_kelompok)
        ->and($copiedGroup->capacity)->toBe($group->capacity)
        ->and($copiedGroup->status)->toBe('draft')
        ->and($copiedGroup->dpl_id)->toBeNull()
        ->and($copiedGroup->dpl_period_id)->toBeNull()
        ->and($copiedGroup->code)->not->toBe($group->code)
        ->and($copiedGroup->token)->not->toBe($group->token);
});

test('superadmin can create and update period grading window data', function () {
    actingAsSuperadmin();

    $academicYear = TahunAkademik::factory()->create(['year' => '2026/2027']);

    $this->from(route('admin.periode.index'))
        ->post(route('admin.periode.store'), [
            'academic_year_id' => $academicYear->id,
            'periode' => 57,
            'program_type' => Periode::PROGRAM_TYPE_REGULER,
            'program_subtype' => null,
            'jenis' => 'KKN Reguler',
            'name' => 'Periode 57 - KKN Reguler',
            'start_date' => '2026-05-01',
            'end_date' => '2026-07-01',
            'registration_start' => '2026-03-18',
            'registration_end' => '2026-04-15',
            'grading_start' => '2026-06-15',
            'grading_end' => '2026-06-30',
            'kuota' => 2000,
            'is_active' => true,
        ])->assertRedirect(route('admin.periode.index'));

    $period = Periode::firstOrFail();

    expect($period->jenis)->toBe(KknType::REGULER)
        ->and($period->program_type)->toBe(Periode::PROGRAM_TYPE_REGULER)
        ->and($period->grading_start?->format('Y-m-d'))->toBe('2026-06-15')
        ->and($period->grading_end?->format('Y-m-d'))->toBe('2026-06-30');

    $this->from(route('admin.periode.index'))
        ->put(route('admin.periode.update', ['periode' => $period->id]), [
            'academic_year_id' => $academicYear->id,
            'periode' => 58,
            'program_type' => Periode::PROGRAM_TYPE_NUSANTARA,
            'program_subtype' => null,
            'jenis' => 'KKN Nusantara',
            'name' => 'Periode 58 - KKN Nusantara',
            'start_date' => '2026-08-01',
            'end_date' => '2026-09-30',
            'registration_start' => '2026-06-01',
            'registration_end' => '2026-07-01',
            'grading_start' => '2026-09-15',
            'grading_end' => '2026-09-29',
            'kuota' => 1500,
            'is_active' => false,
        ])->assertRedirect(route('admin.periode.index'));

    $period->refresh();

    expect($period->periode)->toBe(58)
        ->and($period->jenis)->toBe(KknType::NUSANTARA)
        ->and($period->program_type)->toBe(Periode::PROGRAM_TYPE_NUSANTARA)
        ->and($period->grading_start?->format('Y-m-d'))->toBe('2026-09-15')
        ->and($period->grading_end?->format('Y-m-d'))->toBe('2026-09-29')
        ->and($period->is_active)->toBeFalse();
});

test('superadmin cannot delete active or dependent periods', function () {
    actingAsSuperadmin();

    $activePeriod = Periode::factory()->active()->create([
        'periode' => 57,
        'jenis' => KknType::REGULER,
        'kuota' => 2000,
    ]);

    $this->from(route('admin.periode.index'))
        ->delete(route('admin.periode.destroy', ['periode' => $activePeriod->id]))
        ->assertRedirect(route('admin.periode.index'))
        ->assertSessionHas('error');

    expect(Periode::find($activePeriod->id))->not->toBeNull();

    $inactivePeriod = Periode::factory()->create([
        'periode' => 58,
        'jenis' => KknType::NUSANTARA,
        'program_type' => Periode::PROGRAM_TYPE_NUSANTARA,
        'kuota' => 1200,
    ]);

    KelompokKkn::factory()->create(['period_id' => $inactivePeriod->id]);

    $this->from(route('admin.periode.index'))
        ->delete(route('admin.periode.destroy', ['periode' => $inactivePeriod->id]))
        ->assertRedirect(route('admin.periode.index'))
        ->assertSessionHas('error');

    expect(Periode::find($inactivePeriod->id))->not->toBeNull();
});

test('period actions flush cached context keys', function () {
    actingAsSuperadmin();

    $academicYear = TahunAkademik::factory()->create(['year' => '2026/2027']);
    $period = Periode::factory()->create([
        'academic_year_id' => $academicYear->id,
        'periode' => 57,
        'jenis' => KknType::REGULER,
        'program_type' => Periode::PROGRAM_TYPE_REGULER,
        'kuota' => 2000,
    ]);

    Cache::put('active_period', $period->id, 3600);
    Cache::put('default_period_id', $period->id, 3600);
    Cache::put('available_periods', ['cached'], 3600);

    $this->from(route('admin.periode.index'))
        ->put(route('admin.periode.update', ['periode' => $period->id]), [
            'academic_year_id' => $academicYear->id,
            'periode' => 57,
            'program_type' => Periode::PROGRAM_TYPE_REGULER,
            'program_subtype' => null,
            'jenis' => 'KKN Reguler',
            'name' => $period->name,
            'start_date' => $period->start_date->format('Y-m-d'),
            'end_date' => $period->end_date->format('Y-m-d'),
            'registration_start' => $period->registration_start->format('Y-m-d'),
            'registration_end' => $period->registration_end->format('Y-m-d'),
            'grading_start' => null,
            'grading_end' => null,
            'kuota' => 2100,
            'is_active' => false,
        ])->assertRedirect(route('admin.periode.index'));

    expect(Cache::has('active_period'))->toBeFalse()
        ->and(Cache::has('default_period_id'))->toBeFalse()
        ->and(Cache::has('available_periods'))->toBeFalse();
});

test('legacy responsif type is normalized to thematic governance', function () {
    actingAsSuperadmin();

    $academicYear = TahunAkademik::factory()->create(['year' => '2026/2027']);

    $this->from(route('admin.periode.index'))
        ->post(route('admin.periode.store'), [
            'academic_year_id' => $academicYear->id,
            'periode' => 59,
            'program_type' => null,
            'program_subtype' => null,
            'jenis' => 'KKN Responsif',
            'name' => 'Periode 59 - KKN Responsif',
            'start_date' => '2026-10-01',
            'end_date' => '2026-11-15',
            'registration_start' => '2026-08-01',
            'registration_end' => '2026-08-31',
            'grading_start' => null,
            'grading_end' => null,
            'kuota' => 400,
            'is_active' => false,
        ])->assertRedirect(route('admin.periode.index'));

    $period = Periode::query()->latest('id')->firstOrFail();
    $governance = $period->governance();

    expect($period->jenis)->toBe(KknType::TEMATIK)
        ->and($period->program_type)->toBe(Periode::PROGRAM_TYPE_TEMATIK)
        ->and($period->program_subtype)->toBeNull()
        ->and($period->registration_mode)->toBe(Periode::REGISTRATION_MODE_PROPOSAL_BASED)
        ->and($period->placement_mode)->toBe(Periode::PLACEMENT_MODE_PROPOSAL_DEFINED)
        ->and($governance['jenis_label'])->toBe('KKN Tematik')
        ->and($governance['program_type_label'])->toBe('KKN Tematik');
});
