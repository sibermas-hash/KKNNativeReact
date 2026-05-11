<?php

declare(strict_types=1);

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;

/**
 * Regression test untuk audit R11-FULL-010 / R9-009 fix:
 * `PesertaKknController::makeLeader` harus atomic — promote target + demote
 * ketua existing di kelompok yang sama. Plus verifikasi partial unique index
 * di PostgreSQL.
 */

beforeEach(function () {
    // Use superadmin: permission map mendefinisikan 'view-participants' untuk
    // PesertaKknController, tapi PermissionSeeder belum memiliki permission
    // tersebut (seeder mismatch pre-existing). Superadmin bypass permission
    // check, cocok untuk regression test ini.
    $this->admin = createUserWithRole('superadmin');

    $periode = createActivePeriod('execution');
    $this->kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);

    $this->memberA = makePeserta($this->kelompok, $periode->id);
    $this->memberB = makePeserta($this->kelompok, $periode->id);
    $this->memberC = makePeserta($this->kelompok, $periode->id);
});

function makePeserta(KelompokKkn $kelompok, ?int $periodeId, string $role = 'Anggota'): PesertaKkn
{
    $user = createUserWithRole('student');
    $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);

    return PesertaKkn::create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $periodeId,
        'kelompok_id' => $kelompok->id,
        'status' => 'approved',
        'approved_at' => now(),
        'role' => $role,
    ]);
}

it('promotes a member to Ketua when no existing leader', function () {
    $this->actingAs($this->admin)
        ->postJson("/api/v1/admin/pendaftaran/{$this->memberA->id}/make-leader")
        ->assertOk();

    expect($this->memberA->fresh()->role)->toBe('Ketua');
});

it('demotes existing Ketua when promoting a new leader (atomic)', function () {
    // Set memberA sebagai Ketua dulu.
    $this->memberA->update(['role' => 'Ketua']);

    // Promote memberB → seharusnya A di-demote, B jadi Ketua.
    $this->actingAs($this->admin)
        ->postJson("/api/v1/admin/pendaftaran/{$this->memberB->id}/make-leader")
        ->assertOk();

    expect($this->memberA->fresh()->role)->toBe('Anggota');
    expect($this->memberB->fresh()->role)->toBe('Ketua');
    expect($this->memberC->fresh()->role)->toBe('Anggota'); // unchanged
});

it('ensures only one Ketua per kelompok after multiple promotions', function () {
    $this->actingAs($this->admin)->postJson("/api/v1/admin/pendaftaran/{$this->memberA->id}/make-leader")->assertOk();
    $this->actingAs($this->admin)->postJson("/api/v1/admin/pendaftaran/{$this->memberB->id}/make-leader")->assertOk();
    $this->actingAs($this->admin)->postJson("/api/v1/admin/pendaftaran/{$this->memberC->id}/make-leader")->assertOk();

    $ketuaCount = PesertaKkn::where('kelompok_id', $this->kelompok->id)
        ->where('role', 'Ketua')
        ->count();

    expect($ketuaCount)->toBe(1);
    expect($this->memberC->fresh()->role)->toBe('Ketua');
    expect($this->memberA->fresh()->role)->toBe('Anggota');
    expect($this->memberB->fresh()->role)->toBe('Anggota');
});

it('does not affect leaders of other groups', function () {
    $otherPeriode = createActivePeriod('execution');
    $otherKelompok = KelompokKkn::factory()->create(['periode_id' => $otherPeriode->id]);
    $otherLeader = makePeserta($otherKelompok, $otherPeriode->id, 'Ketua');

    $this->actingAs($this->admin)
        ->postJson("/api/v1/admin/pendaftaran/{$this->memberA->id}/make-leader")
        ->assertOk();

    // Ketua kelompok lain tidak boleh ikut ter-demote.
    expect($otherLeader->fresh()->role)->toBe('Ketua');
    expect($this->memberA->fresh()->role)->toBe('Ketua');
});

it('rejects makeLeader for peserta without kelompok', function () {
    $periode = createActivePeriod('placement');
    $user = createUserWithRole('student');
    $mahasiswa = Mahasiswa::factory()->create(['user_id' => $user->id]);
    $peserta = PesertaKkn::create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $periode->id,
        'kelompok_id' => null,
        'status' => 'approved',
        'approved_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->postJson("/api/v1/admin/pendaftaran/{$peserta->id}/make-leader")
        ->assertStatus(422);
});

it('forbids faculty_admin from promoting leader', function () {
    $facultyAdmin = createUserWithRole('faculty_admin');

    $this->actingAs($facultyAdmin)
        ->postJson("/api/v1/admin/pendaftaran/{$this->memberA->id}/make-leader")
        ->assertStatus(403);

    expect($this->memberA->fresh()->role)->toBe('Anggota');
});

it('postgresql partial unique index prevents manual duplicate Ketua', function () {
    // Safety net test: kalau controller atomic-reset gagal, index DB akan
    // mencegah duplicate. Test ini hanya bermakna di pgsql.
    if (DB::getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Partial unique index hanya di pgsql.');
    }

    // Verify index exists in schema
    $indexes = DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'peserta_kkn' AND indexname = 'peserta_kkn_kelompok_ketua_unique'");
    expect($indexes)->not->toBeEmpty('Migration belum apply partial unique index — pastikan migrate:fresh dijalankan.');

    $this->memberA->update(['role' => 'Ketua']);

    // Coba bypass atomic reset: langsung update memberB jadi Ketua tanpa demote A.
    try {
        DB::statement(
            "UPDATE peserta_kkn SET role = 'Ketua' WHERE id = ?",
            [$this->memberB->id]
        );
        expect(true)->toBeFalse('Expected unique violation');
    } catch (\Throwable $e) {
        expect($e->getMessage())->toContain('peserta_kkn_kelompok_ketua_unique');
    }
});
