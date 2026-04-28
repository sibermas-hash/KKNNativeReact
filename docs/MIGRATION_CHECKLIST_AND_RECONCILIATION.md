Migration checklist — Transfer data from Kampus Master API to local KKN DB

Scope
- Transfer mahasiswa, dosen, fakultas, prodi, tahun_akademik, periode, organisasi mapping
- Preserve master_id mapping and master_synced_at timestamps
- Ensure idempotent, auditable, and reversible process

Pre-migration
1. Inventory endpoints and schemas
   - Use MasterApiService endpoints: /sync/mahasiswa, /sync/dosen, /sync/organizations, /programs
   - Capture field mapping (master -> local): master_id, nim/nip, name, email, birth_date, address, etc.
2. Backup
   - Full DB dump (pg_dump) and filesystem snapshot
   - Export current mapping tables: mahasiswa(master_id), dosen(master_id)
3. Configuration
   - Set config/campus-api.php with production base_url, api_key, timeout
   - Ensure config/api_keys.allowed_tables is restrictive
   - Set queue worker and low-priority queue for background jobs

Staging dry-run
1. Create staging environment with identical schema
2. Run MasterApiService->yieldSyncMahasiswa() and ingest small batch
3. Verify idempotency by re-running same batch
4. Validate user accounts, roles, and permission assignment

Migration execution
1. Use queued jobs: SyncMahasiswaJob and SyncDosenJob already present
2. Use chunking: process N records per job (e.g., 500)
3. Use idempotency keys: use master_id + event timestamp
4. Record Processing History: Create registration_histories or transfer_history entries for each change
5. Monitor queue length, failures, and set automatic retries with exponential backoff

Reconciliation & verification
1. Counts: compare total counts per entity between master & local
2. Sample diffs: random sample compare fields for N records
3. Hash checksums: compute row-level hash (sorted key fields) to detect mismatches
4. Missing mapping report: list master_ids not mapped
5. Audit logs: ensure each upsert has logged entry

Rollback plan
1. Restore DB from backup if catastrophic
2. For partial rollback: run compensating jobs to revert changes using recorded history

Post-migration
1. Rotate API keys & webhook secrets
2. Enable monitoring & alerts for sync failures
3. Archive old backups and export reconciliation reports

Reconciler script (basic): docs/scripts/reconcile_master_vs_local.php
- Compares counts and outputs CSVs with differences and summary

Execution notes
- Do not run migration during high-traffic hours
- Notify stakeholders and schedule maintenance window
- Limit write permissions to admin operator account

Contact
- DevOps / DBA: ops@uinsuizu.ac.id
- Lead developer: lead@uinsuizu.ac.id
