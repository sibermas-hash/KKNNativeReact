# ADR-001: Tidak Meng-encrypt Field Skor `nilai_kkn`

**Status:** Accepted
**Tanggal:** 2026-05-11
**Kontext:** Audit finding R11-DB-013 mengajukan `nilai_kkn.*_score` harus di-encrypt dengan alasan "GDPR risk".

## Keputusan

**Tidak** meng-encrypt kolom skor di tabel `nilai_kkn`. Sebagai gantinya, tingkatkan **audit trail** dan **access control**.

## Alasan

### 1. Skor KKN bukan PII standar

GDPR (dan regulasi PII Indonesia) mengkategorikan data identitas (nama, NIK, alamat, kontak, data biometrik) sebagai "personal data" yang wajib di-protect. Skor akademik **bukan** kategori tersebut. Skor adalah data derivative dari kinerja, di-bound dengan identitas tapi tidak mengidentifikasi orang secara langsung.

Analogi: nilai ujian di sekolah tidak pernah di-encrypt di Application Layer — di-protect via ACL (siapa boleh lihat) + audit trail (siapa ubah apa kapan).

### 2. Enkripsi kolom skor akan break banyak query existing

Queries yang saat ini jalan di kolom skor:

- **Grade distribution** (report admin): `SELECT letter_grade, COUNT(*) FROM nilai_kkn GROUP BY letter_grade`
- **Top-N mahasiswa**: `ORDER BY total_score DESC LIMIT 10`
- **At-risk report**: `WHERE total_score < 70`
- **Fakultas average**: `AVG(total_score) per fakultas`
- **Certificate eligibility check**: `WHERE total_score >= ?`
- **Kalkulasi bobot di GradingService**: read DPL/village/LPPM scores

Kalau di-encrypt via Laravel `encrypted` cast:

- SQL aggregate langsung **mustahil** — semua harus di-decrypt di app layer dulu (= 1000+ decrypt per report)
- ORDER BY / WHERE tidak deterministic (output ciphertext berubah tiap encrypt)
- Blind-index hanya berguna untuk exact match, bukan range

### 3. Mitigasi yang lebih tepat: audit trail + access control (sudah ada)

**Access control** — multi-layer sudah terpasang:
- Student: lihat skor sendiri only (`CertificateController::index` filter by `user_id`)
- DPL: lihat skor mahasiswa di kelompok binaan (via pivot `dpl_kelompok`)
- Faculty admin: scope ke fakultasnya (`GradeController::index` whereHas user.mahasiswa.fakultas_id — fix R11-FAC-002)
- Admin/Superadmin: akses semua

**Audit trail** — setiap mutasi skor diacatat dengan severity=high:
- `AuditObserver` terdaftar untuk `NilaiKkn` di `AppServiceProvider::boot()`
- `deriveSeverity()` mempromote `NilaiKkn` dan `KonfigurasiPenilaian` ke severity='high'
- Diff-only storage: hanya field yang berubah, dengan old + new value
- Actor, IP, user-agent, timestamp tercatat
- Sensitive field names (password, nik, nip, nim) auto-masked — score TIDAK di-mask supaya audit berguna untuk forensic "skor dari X jadi Y"

**Row-level protection di DB at-rest**:
- PostgreSQL backup script (`scripts/backup.sh`) — pg_dump ter-encrypt di level filesystem (tergantung deployment, lihat `docs/BACKUP_DR_RUNBOOK.md`)
- Rekomendasi: enable PostgreSQL TDE (Transparent Data Encryption) atau full-disk encryption di tingkat OS — ini lebih tepat daripada application-level encryption untuk data semi-sensitif.

## Konsekuensi

**Diterima:**
- Query existing tetap jalan tanpa perubahan.
- Report admin (grade distribution, at-risk) tetap fast (native SQL aggregate).
- Audit trail beri same forensic value dengan overhead jauh lebih kecil.

**Tidak diterima:**
- Kalau compliance khusus institusi UIN SAIZU di masa depan memaksa field-level encryption untuk skor akademik, pattern blind-index HMAC + decrypt-at-read (lihat `docs/PII_ENCRYPTION_PLAN.md`) bisa diterapkan kemudian. Ini perubahan scope besar, perlu re-plan query-nya.

## Cross-referensi

- `app/Observers/AuditObserver.php` — implementasi audit trail
- `tests/Feature/Security/AuditTrailTest.php` — coverage test 9 scenario
- `docs/PII_ENCRYPTION_PLAN.md` — pattern blind-index HMAC (dipakai untuk NIM, NIP, phone, address)
- `docs/BACKUP_DR_RUNBOOK.md` — rekomendasi PostgreSQL TDE
