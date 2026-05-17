<?php

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;

describe('Admin mahasiswa index filters', function () {
    beforeEach(function () {
        $this->superadmin = createUserWithRole('superadmin');
    });

    it('keeps numeric search scoped to fakultas and prodi filters', function () {
        $fakultasA = Fakultas::factory()->create();
        $fakultasB = Fakultas::factory()->create();
        $prodiA = Prodi::factory()->create(['fakultas_id' => $fakultasA->id]);
        $prodiB = Prodi::factory()->create(['fakultas_id' => $fakultasB->id]);

        $targetUser = User::factory()->create([
            'username' => 'mahasiswa-filter-target',
            'name' => 'Mahasiswa Filter Target',
            'fakultas_id' => $fakultasA->id,
        ]);
        $targetUser->assignRole('student');

        $targetMahasiswa = Mahasiswa::factory()->create([
            'user_id' => $targetUser->id,
            'nim' => '221234567890',
            'nama' => 'Mahasiswa Filter Target',
            'fakultas_id' => $fakultasA->id,
            'prodi_id' => $prodiA->id,
            'batch_year' => 2022,
            'semester' => 7,
            'status_bta_ppi' => 'LULUS',
        ]);

        $decoyUser = User::factory()->create([
            'username' => 'mahasiswa-filter-decoy',
            'name' => 'Mahasiswa Filter Decoy',
            'fakultas_id' => $fakultasB->id,
        ]);
        $decoyUser->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $decoyUser->id,
            'nim' => '331234567890',
            'nama' => '221234567890',
            'fakultas_id' => $fakultasB->id,
            'prodi_id' => $prodiB->id,
            'batch_year' => 2021,
            'semester' => 7,
            'status_bta_ppi' => 'LULUS',
        ]);

        $response = $this->actingAs($this->superadmin)
            ->getJson("/api/v1/admin/mahasiswa?search=221234567890&fakultas_id={$fakultasA->id}&prodi_id={$prodiA->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $targetMahasiswa->id)
            ->assertJsonPath('data.0.fakultas_id', $fakultasA->id)
            ->assertJsonPath('data.0.prodi_id', $prodiA->id);
    });
})->group('admin');
