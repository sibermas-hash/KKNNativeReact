<?php

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
        'jenis' => 'REGULER',
        'name' => 'Periode 57 - REGULER',
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

    $this->from(route('admin.periods.index'))
        ->post(route('admin.periods.duplicate', ['periode' => $period->id]))
        ->assertRedirect(route('admin.periods.index'));

    $copy = Periode::whereKeyNot($period->id)->firstOrFail();
    $copiedGroup = KelompokKkn::where('period_id', $copy->id)->firstOrFail();

    expect($copy->name)->toBe('Periode 57 - REGULER (Copy)')
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

    $this->from(route('admin.periods.index'))
        ->post(route('admin.periods.store'), [
            'academic_year_id' => $academicYear->id,
            'periode' => 57,
            'jenis' => 'REGULER',
            'name' => 'Periode 57 - REGULER',
            'start_date' => '2026-05-01',
            'end_date' => '2026-07-01',
            'registration_start' => '2026-03-18',
            'registration_end' => '2026-04-15',
            'grading_start' => '2026-06-15',
            'grading_end' => '2026-06-30',
            'kuota' => 2000,
            'is_active' => true,
        ])->assertRedirect(route('admin.periods.index'));

    $period = Periode::firstOrFail();

    expect($period->grading_start?->format('Y-m-d'))->toBe('2026-06-15')
        ->and($period->grading_end?->format('Y-m-d'))->toBe('2026-06-30');

    $this->from(route('admin.periods.index'))
        ->put(route('admin.periods.update', ['periode' => $period->id]), [
            'academic_year_id' => $academicYear->id,
            'periode' => 58,
            'jenis' => 'MANDIRI',
            'name' => 'Periode 58 - MANDIRI',
            'start_date' => '2026-08-01',
            'end_date' => '2026-09-30',
            'registration_start' => '2026-06-01',
            'registration_end' => '2026-07-01',
            'grading_start' => '2026-09-15',
            'grading_end' => '2026-09-29',
            'kuota' => 1500,
            'is_active' => false,
        ])->assertRedirect(route('admin.periods.index'));

    $period->refresh();

    expect($period->periode)->toBe(58)
        ->and($period->jenis)->toBe('MANDIRI')
        ->and($period->grading_start?->format('Y-m-d'))->toBe('2026-09-15')
        ->and($period->grading_end?->format('Y-m-d'))->toBe('2026-09-29')
        ->and($period->is_active)->toBeFalse();
});

test('superadmin cannot delete active or dependent periods', function () {
    actingAsSuperadmin();

    $activePeriod = Periode::factory()->active()->create([
        'periode' => 57,
        'jenis' => 'REGULER',
        'kuota' => 2000,
    ]);

    $this->from(route('admin.periods.index'))
        ->delete(route('admin.periods.destroy', ['periode' => $activePeriod->id]))
        ->assertRedirect(route('admin.periods.index'))
        ->assertSessionHas('error');

    expect(Periode::find($activePeriod->id))->not->toBeNull();

    $inactivePeriod = Periode::factory()->create([
        'periode' => 58,
        'jenis' => 'MANDIRI',
        'kuota' => 1200,
    ]);

    KelompokKkn::factory()->create(['period_id' => $inactivePeriod->id]);

    $this->from(route('admin.periods.index'))
        ->delete(route('admin.periods.destroy', ['periode' => $inactivePeriod->id]))
        ->assertRedirect(route('admin.periods.index'))
        ->assertSessionHas('error');

    expect(Periode::find($inactivePeriod->id))->not->toBeNull();
});

test('period actions flush cached context keys', function () {
    actingAsSuperadmin();

    $academicYear = TahunAkademik::factory()->create(['year' => '2026/2027']);
    $period = Periode::factory()->create([
        'academic_year_id' => $academicYear->id,
        'periode' => 57,
        'jenis' => 'REGULER',
        'kuota' => 2000,
    ]);

    Cache::put('active_period', $period->id, 3600);
    Cache::put('default_period_id', $period->id, 3600);
    Cache::put('available_periods', ['cached'], 3600);

    $this->from(route('admin.periods.index'))
        ->put(route('admin.periods.update', ['periode' => $period->id]), [
            'academic_year_id' => $academicYear->id,
            'periode' => 57,
            'jenis' => 'REGULER',
            'name' => $period->name,
            'start_date' => $period->start_date->format('Y-m-d'),
            'end_date' => $period->end_date->format('Y-m-d'),
            'registration_start' => $period->registration_start->format('Y-m-d'),
            'registration_end' => $period->registration_end->format('Y-m-d'),
            'grading_start' => null,
            'grading_end' => null,
            'kuota' => 2100,
            'is_active' => false,
        ])->assertRedirect(route('admin.periods.index'));

    expect(Cache::has('active_period'))->toBeFalse()
        ->and(Cache::has('default_period_id'))->toBeFalse()
        ->and(Cache::has('available_periods'))->toBeFalse();
});
