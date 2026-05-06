<?php

/**
 * Frontend Contract Test — Role-based Endpoints
 *
 * Memverifikasi semua endpoint yang dipakai frontend untuk role:
 * student, dpl, dosen, admin — terdaftar di backend (bukan 404).
 *
 * Semua endpoint ini memerlukan auth, sehingga tanpa token → 401 (bukan 404).
 * 401 = route ada tapi butuh auth ✅
 * 404 = route tidak terdaftar ❌
 */

// ─── STUDENT ENDPOINTS ───────────────────────────────────────────────────────

dataset('student_get_routes', [
    '/api/v1/student/dashboard',
    '/api/v1/student/registration/status',
    '/api/v1/student/registration/form',
    '/api/v1/student/posko',
    '/api/v1/student/domisili',
    '/api/v1/student/daily-reports',
    '/api/v1/student/work-programs',
    '/api/v1/student/leave-requests',
    '/api/v1/student/final-report',
    '/api/v1/student/certificates',
    '/api/v1/student/dpl-evaluation/form',
    '/api/v1/student/workshops',
]);

test('student GET route exists (returns 401 not 404): {0}', function (string $route) {
    $this->getJson($route)->assertStatus(401);
})->with('student_get_routes');

dataset('student_post_routes', [
    '/api/v1/student/registration',
    '/api/v1/student/posko',
    '/api/v1/student/domisili',
    '/api/v1/student/daily-reports',
    '/api/v1/student/work-programs',
    '/api/v1/student/leave-requests',
    '/api/v1/student/final-report',
    '/api/v1/student/dpl-evaluation',
]);

test('student POST route exists (returns 401 not 404): {0}', function (string $route) {
    $this->postJson($route, [])->assertStatus(401);
})->with('student_post_routes');

test('DELETE /api/v1/student/registration/{id} exists', function () {
    $this->deleteJson('/api/v1/student/registration/1')->assertStatus(401);
});

test('PUT /api/v1/student/daily-reports/{id} exists', function () {
    $this->putJson('/api/v1/student/daily-reports/1', [])->assertStatus(401);
});

test('DELETE /api/v1/student/daily-reports/{id} exists', function () {
    $this->deleteJson('/api/v1/student/daily-reports/1')->assertStatus(401);
});

test('GET /api/v1/student/work-programs/{id} exists', function () {
    $this->getJson('/api/v1/student/work-programs/1')->assertStatus(401);
});

test('POST /api/v1/student/work-programs/{id}/proposal exists', function () {
    $this->postJson('/api/v1/student/work-programs/1/proposal', [])->assertStatus(401);
});

test('POST /api/v1/student/workshops/{id}/attend exists', function () {
    $this->postJson('/api/v1/student/workshops/1/attend', [])->assertStatus(401);
});

test('GET /api/v1/student/workshops/{id} exists', function () {
    $this->getJson('/api/v1/student/workshops/1')->assertStatus(401);
});

test('POST /api/v1/student/registration/{id}/documents exists', function () {
    $this->postJson('/api/v1/student/registration/1/documents', [])->assertStatus(401);
});

test('PATCH /api/v1/student/peserta-kkn/{id}/notification-shown exists', function () {
    $this->patchJson('/api/v1/student/peserta-kkn/1/notification-shown', [])->assertStatus(401);
});

test('GET /api/v1/student/certificates/{id}/download exists', function () {
    $this->getJson('/api/v1/student/certificates/1/download')->assertStatus(401);
});

// ─── DPL ENDPOINTS ───────────────────────────────────────────────────────────

dataset('dpl_get_routes', [
    '/api/v1/dpl/dashboard',
    '/api/v1/dpl/groups',
    '/api/v1/dpl/daily-reports',
    '/api/v1/dpl/evaluations',
    '/api/v1/dpl/final-reports',
    '/api/v1/dpl/monitoring',
    '/api/v1/dpl/leave-requests',
    '/api/v1/dpl/feedback',
]);

test('dpl GET route exists (returns 401 not 404): {0}', function (string $route) {
    $this->getJson($route)->assertStatus(401);
})->with('dpl_get_routes');

test('POST /api/v1/dpl/evaluations exists', function () {
    $this->postJson('/api/v1/dpl/evaluations', [])->assertStatus(401);
});

test('POST /api/v1/dpl/evaluations/validate-import exists', function () {
    $this->postJson('/api/v1/dpl/evaluations/validate-import', [])->assertStatus(401);
});

test('POST /api/v1/dpl/evaluations/import exists', function () {
    $this->postJson('/api/v1/dpl/evaluations/import', [])->assertStatus(401);
});

test('PATCH /api/v1/dpl/daily-reports/{id}/approve exists', function () {
    $this->patchJson('/api/v1/dpl/daily-reports/1/approve', [])->assertStatus(401);
});

test('PATCH /api/v1/dpl/daily-reports/{id}/revision exists', function () {
    $this->patchJson('/api/v1/dpl/daily-reports/1/revision', [])->assertStatus(401);
});

test('POST /api/v1/dpl/daily-reports/batch-approve exists', function () {
    $this->postJson('/api/v1/dpl/daily-reports/batch-approve', [])->assertStatus(401);
});

test('PATCH /api/v1/dpl/final-reports/{id}/approve exists', function () {
    $this->patchJson('/api/v1/dpl/final-reports/1/approve', [])->assertStatus(401);
});

test('PATCH /api/v1/dpl/final-reports/{id}/revision exists', function () {
    $this->patchJson('/api/v1/dpl/final-reports/1/revision', [])->assertStatus(401);
});

test('PATCH /api/v1/dpl/leave-requests/{id}/approve exists', function () {
    $this->patchJson('/api/v1/dpl/leave-requests/1/approve', [])->assertStatus(401);
});

test('PATCH /api/v1/dpl/leave-requests/{id}/reject exists', function () {
    $this->patchJson('/api/v1/dpl/leave-requests/1/reject', [])->assertStatus(401);
});

// ─── DOSEN ENDPOINTS ─────────────────────────────────────────────────────────

test('GET /api/v1/dosen/dashboard exists', function () {
    $this->getJson('/api/v1/dosen/dashboard')->assertStatus(401);
});

// ─── ADMIN ENDPOINTS ─────────────────────────────────────────────────────────

dataset('admin_get_routes', [
    '/api/v1/admin/hub',
    '/api/v1/admin/dashboard',
    '/api/v1/admin/periode',
    '/api/v1/admin/tahun-akademik',
    '/api/v1/admin/jenis-kkn',
    '/api/v1/admin/fakultas',
    '/api/v1/admin/prodi',
    '/api/v1/admin/lokasi',
    '/api/v1/admin/kkn-requirements',
    '/api/v1/admin/pendaftaran',
    '/api/v1/admin/kelompok',
    '/api/v1/admin/dosen/pendaftaran-dpl',
    '/api/v1/admin/dosen/penugasan',
    '/api/v1/admin/laporan/harian',
    '/api/v1/admin/laporan/akhir',
    '/api/v1/admin/pengguna',
    '/api/v1/admin/mahasiswa',
    '/api/v1/admin/dosen',
    '/api/v1/admin/nilai',
    '/api/v1/admin/grade-reports',
    '/api/v1/admin/warta-utama',
    '/api/v1/admin/pengaturan/sistem',
    '/api/v1/admin/pengaturan/sertifikat',
    '/api/v1/admin/audit-log',
]);

test('admin GET route exists (returns 401 not 404): {0}', function (string $route) {
    $this->getJson($route)->assertStatus(401);
})->with('admin_get_routes');

dataset('admin_post_routes', [
    '/api/v1/admin/dashboard/switch-phase',
    '/api/v1/admin/periode',
    '/api/v1/admin/tahun-akademik',
    '/api/v1/admin/jenis-kkn',
    '/api/v1/admin/fakultas',
    '/api/v1/admin/prodi',
    '/api/v1/admin/lokasi',
    '/api/v1/admin/lokasi/import',
    '/api/v1/admin/kkn-requirements',
    '/api/v1/admin/pendaftaran/bulk-approve',
    '/api/v1/admin/pendaftaran/bulk-reject',
    '/api/v1/admin/kelompok',
    '/api/v1/admin/nilai',
    '/api/v1/admin/grade-reports/finalize-mass',
    '/api/v1/admin/warta-utama',
    '/api/v1/admin/pengguna',
    '/api/v1/admin/pengaturan/sistem/ai/test',
]);

test('admin POST route exists (returns 401 not 404): {0}', function (string $route) {
    $this->postJson($route, [])->assertStatus(401);
})->with('admin_post_routes');

test('PATCH /api/v1/admin/pendaftaran/{id}/approve exists', function () {
    $this->patchJson('/api/v1/admin/pendaftaran/1/approve', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/pendaftaran/{id}/reject exists', function () {
    $this->patchJson('/api/v1/admin/pendaftaran/1/reject', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/pendaftaran/{id}/assign-group exists', function () {
    $this->patchJson('/api/v1/admin/pendaftaran/1/assign-group', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/kkn-requirements/{id}/toggle exists', function () {
    $this->patchJson('/api/v1/admin/kkn-requirements/1/toggle', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/grade-reports/{id}/finalize exists', function () {
    $this->patchJson('/api/v1/admin/grade-reports/1/finalize', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/laporan/akhir/{id}/status exists', function () {
    $this->patchJson('/api/v1/admin/laporan/akhir/1/status', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/pengguna/{id}/ubah-status exists', function () {
    $this->patchJson('/api/v1/admin/pengguna/1/ubah-status', [])->assertStatus(401);
});

test('POST /api/v1/admin/pengguna/{id}/reset-password exists', function () {
    $this->postJson('/api/v1/admin/pengguna/1/reset-password', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/pengaturan/sistem exists', function () {
    $this->patchJson('/api/v1/admin/pengaturan/sistem', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/pengaturan/sistem/ai/update exists', function () {
    $this->patchJson('/api/v1/admin/pengaturan/sistem/ai/update', [])->assertStatus(401);
});

test('GET /api/v1/admin/pengaturan/sistem/ai/config exists', function () {
    $this->getJson('/api/v1/admin/pengaturan/sistem/ai/config')->assertStatus(401);
});

test('POST /api/v1/admin/periode/{id}/duplicate exists', function () {
    $this->postJson('/api/v1/admin/periode/1/duplicate', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/dosen/pendaftaran-dpl/{id}/setujui exists', function () {
    $this->patchJson('/api/v1/admin/dosen/pendaftaran-dpl/1/setujui', [])->assertStatus(401);
});

test('PATCH /api/v1/admin/dosen/pendaftaran-dpl/{id}/tolak exists', function () {
    $this->patchJson('/api/v1/admin/dosen/pendaftaran-dpl/1/tolak', [])->assertStatus(401);
});
