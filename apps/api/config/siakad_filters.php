<?php

/*
|--------------------------------------------------------------------------
| SIAKAD record filters
|--------------------------------------------------------------------------
|
| These rules decide which SIAKAD records are allowed into the local DB.
| Rejected records are counted and logged with a reason, but never touched.
|
| Goal: keep production data clean without touching SIAKAD itself. Every
| knob here is env-overridable so ops can tune without a redeploy.
|
| Applied at four entry points:
|   - sync:master-data artisan command (CLI)
|   - StudentSyncService::upsertStudent (admin HTTP + webhook)
|   - WebhookController::syncDosen (SIAKAD push)
|   - SyncDosenJob / SyncMahasiswaJob (queued sync)
*/

return [
    'students' => [
        /*
         | Reject mahasiswa whose batch_year is older than this. Default 2018
         | keeps "7-year" students (max KKN registration age from most faculty
         | rules). Set to 0 to disable.
         */
        'min_batch_year' => (int) env('SIAKAD_STUDENT_MIN_BATCH_YEAR', 2018),

        /*
         | Reject mahasiswa whose batch_year is in the far future (typo/ghost
         | records in SIAKAD). Current year + this offset.
         */
        'max_batch_year_offset' => (int) env('SIAKAD_STUDENT_MAX_BATCH_YEAR_OFFSET', 1),

        /*
         | NOTE: status_aktif whitelist filter telah dihapus (2026-05-12).
         | SIAKAD kadang kirim record dengan status "Cuti", "Non-Aktif",
         | "Lulus", "Aktif" — semua mahasiswa boleh masuk DB; keputusan
         | eligible/tidak untuk KKN dilakukan di logic pendaftaran, bukan
         | di sync layer.
         */

        /*
         | Reject mahasiswa in a non-KKN-eligible jenjang (S2/S3 programs).
         | The list of non-eligible jenjang strings is compared
         | case-insensitively.
         */
        'skip_non_kkn_jenjang' => (bool) env('SIAKAD_STUDENT_SKIP_NON_KKN_JENJANG', true),
        'non_kkn_jenjangs' => ['S2', 'S3', 'Magister', 'Doktor', 'Pasca', 'Pascasarjana'],

        /*
         | Require NIK before accepting the record (strict). Off by default —
         | NIK missing is normalised to NULL, not a blocker, so an admin can
         | fill it in later.
         */
        'require_valid_nik' => (bool) env('SIAKAD_STUDENT_REQUIRE_NIK', false),

        /*
         | Comma-separated list of NIMs to never import, regardless of other
         | rules. Useful when SIAKAD has known-bad ghost records.
         */
        'blocklist_nim' => array_filter(array_map(
            'trim',
            explode(',', (string) env('SIAKAD_STUDENT_BLOCKLIST_NIM', ''))
        )),

        /*
         | Reject students whose NIM starts with any of these prefixes.
         | Used to exclude entire batches by admission year (e.g. 18, 19, 20).
         */
        'blocklist_nim_prefix' => array_filter(array_map(
            'trim',
            explode(',', (string) env('SIAKAD_STUDENT_BLOCKLIST_NIM_PREFIX', ''))
        )),

        /*
         | Reject students whose fakultas_id / faculty master ID is in this list.
         | Used to exclude entire faculties (e.g. Pascasarjana / ID 1) from KKN.
         | Format: comma-separated IDs.
         */
        'blocklist_fakultas_ids' => array_filter(array_map(
            'trim',
            explode(',', (string) env('SIAKAD_STUDENT_BLOCKLIST_FAKULTAS_IDS', '1'))
        )),
    ],

    'lecturers' => [
        /*
         | NOTE: status_aktif whitelist filter telah dihapus (2026-05-12).
         | Semua dosen (status "Aktif", "Non-Aktif", "Pensiun", dll) boleh
         | masuk DB. Filter "tugas_belajar" di bawah masih aktif karena
         | dosen yang sedang studi lanjut secara logis tidak bisa jadi DPL.
         */

        /*
         | Tugas belajar = lecturer currently studying; can't supervise KKN.
         | Default: reject them.
         */
        'skip_tugas_belajar' => (bool) env('SIAKAD_LECTURER_SKIP_TUGAS_BELAJAR', true),

        /*
         | Comma-separated NIP blocklist (ghost records, resigned lecturers
         | still in the SIAKAD feed, etc.)
         */
        'blocklist_nip' => array_filter(array_map(
            'trim',
            explode(',', (string) env('SIAKAD_LECTURER_BLOCKLIST_NIP', ''))
        )),

        /*
         | Reject lecturers whose NIP is not purely numeric (e.g. "LB-xxxx").
         | Honorer/contract lecturers don't have a real NIP and cannot be DPL.
         | Default: true.
         */
        'require_numeric_nip' => (bool) env('SIAKAD_LECTURER_REQUIRE_NUMERIC_NIP', true),
    ],

    /*
     | Global kill-switch. Set to false to bypass all filters (emergency use
     | only — records flow straight through). Default: filters on.
     */
    'enabled' => (bool) env('SIAKAD_FILTERS_ENABLED', true),
];
