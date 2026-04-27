Alur Pendaftaran & Penempatan

Dokumen ini menjelaskan alur (jalur) untuk registration_mode dan placement_mode, titik integrasi, serta contoh algoritma penempatan otomatis. Tambahkan file ini pada setiap perubahan yang mempengaruhi perilaku pendaftaran/penempatan.

Ringkasan

- registration_mode mengatur bagaimana peserta memasuki sistem:
  - open: self-service registration by students.
  - selective: selection by committee/admin; not self-service.
  - proposal_based: linked to a proposal/program owned by a lecturer or host.

- placement_mode mengatur bagaimana penempatan dilakukan setelah persetujuan:
  - automatic_after_approval: system assigns participants automatically to groups.
  - manual_admin: admin assigns participants to groups.
  - host_defined: host/partner selects or confirms placements.
  - proposal_defined: placement follows structure defined by proposal.

Alur tingkat tinggi

1. open + automatic_after_approval (Pendaftaran mandiri + penempatan otomatis)
  - Mahasiswa mengisi formulir pendaftaran (Student/KknDaftarController).
  - RegistrationPortalService melakukan pengecekan kelayakan (min_sks, min_gpa, flag require_*).
  - PesertaKkn record created with status="approved" or "pending" depending on flows.
  - Once approved, PlacementService::placeParticipantsAutomatically(Periode $periode) is invoked (cron/job/admin action) which:
    - finds approved, unplaced participants for periode
    - fills existing groups with available capacity or creates new groups
    - marks peserta as placed and assigns kelompok_id

2. selective (Committee selection)
  - Student nomination or admin import → participants queued in application pool (status pending_review).
  - Committee reviews applications via admin UI → approve/reject.
  - On approve, if placement_mode == automatic_after_approval then automatic placement runs; otherwise admin/manual assignment.

3. proposal_based (Proposal-driven)
  - Lecturer/coordinator creates proposal that defines group structure and roles.
  - Participants attach to proposal (or are invited).
  - On proposal approval, system creates groups as defined and assigns participants accordingly.

Code locations

- UI: resources/js/Pages/Admin/MasterData/JenisKkn/Index.tsx dan Show.tsx
- Controllers: app/Http/Controllers/Student/KknDaftarController.php, app/Http/Controllers/Admin/JenisKknController.php
- Models: app/Models/KKN/JenisKkn.php, app/Models/KKN/Periode.php, app/Models/KKN/PesertaKkn.php, app/Models/KKN/KelompokKkn.php
- Services: app/Services/KKN/PeriodeGovernanceService.php, app/Services/RegistrationPortalService.php, app/Services/KKN/PlacementService.php (example)

Catatan operasional

- Automatic placement should be idempotent and run inside a DB transaction.
- Guard against race conditions when multiple workers run placement (use row locking or single-worker queue).
- Respect peserta ordering rules (e.g., earliest approval first, priority rules) and kelompok kuota.
- Add tests for placement: small synthetic periode with kuota and participants.

Langkah selanjutnya

- Review the sample PlacementService in app/Services/KKN/PlacementService.php and adapt to real KelompokKkn model fields and kuota rules.
- Add a scheduled job or admin-trigger to invoke automatic placement after approvals.
