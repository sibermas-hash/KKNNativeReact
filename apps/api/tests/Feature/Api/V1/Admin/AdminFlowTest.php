<?php

describe('Admin Flow (E2E)', function () {

    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('admin can view hub', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/hub')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can view dashboard statistics', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can list users', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/pengguna')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data']);
    });

    it('admin can list periods', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/periode')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can list registrations', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/pendaftaran')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can list mahasiswa', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/mahasiswa')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can list dosen', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/dosen')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can list kelompok', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/kelompok')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can list lokasi', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/lokasi')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can view audit log', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/audit-log')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin can view jenis kkn', function () {
        $this->actingAs($this->admin)->getJson('/api/v1/admin/jenis-kkn')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('admin cannot create period without required fields', function () {
        $this->actingAs($this->admin)->postJson('/api/v1/admin/periode', [])
            ->assertStatus(422);
    });

    it('admin cannot create user without required fields', function () {
        $this->actingAs($this->admin)->postJson('/api/v1/admin/pengguna', [])
            ->assertStatus(422);
    });

    it('student cannot access admin hub', function () {
        $student = createUserWithRole('student');
        $this->actingAs($student)->getJson('/api/v1/admin/hub')
            ->assertStatus(403);
    });

    it('dpl cannot access admin hub', function () {
        $dpl = createUserWithRole('dpl');
        $this->actingAs($dpl)->getJson('/api/v1/admin/hub')
            ->assertStatus(403);
    });

})->group('e2e', 'admin');
