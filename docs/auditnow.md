# SIBERMAS — Audit Log
**Last Updated:** 2026-05-05  
**Status: PRODUCTION READY** — Semua critical & high issues sudah difix.

---

## ✅ SEMUA ISSUE SUDAH DIFIX

| Issue | Fix |
|---|---|
| BUG-1: `EnsurePasswordChanged` redirect 500 | Return JSON 403 selalu |
| BUG-2: `EnsureAdminAuthorization` namespace salah → skip permission | Update ke `Api\V1\Admin\*` |
| BUG-3: Bearer token di `localStorage` (XSS) | Dihapus, hanya cookie |
| BUG-4: `PROFILE_INCOMPLETE` tanpa frontend handler | Tambah interceptor + event handler |
| CRIT-14: `route('login')` tidak ada → 500 | Named route ditambahkan di `web.php` |
| CSRF disabled | Re-enabled, exclude `api/*` dan `webhooks/*` |
| Double-unwrap `res.data.data` (~55 file) | Fix mass replace |
| `debug_backup.php` RCE + credentials | Dihapus |
| `debug_passwords.php`, `check_users.php` | Dihapus |
| `eslint.config.js` di `apps/api` | Dihapus |
| Local dev auth bypass (`/auth/login` static token) | Dihapus |
| Attendance route shadowing (`sync-status` tertimpa wildcard) | Static routes dipindah sebelum wildcard |
| Legacy `/api/user` expose raw User model | Dihapus |
| `/ganti-password` infinite redirect loop di middleware | Dihapus dari `AUTH_PAGES` |
| `hasFetched: true` premature → stuck unauthenticated | Set hanya setelah sukses |
| `_appInitialized` tidak reset setelah logout | Reset di `handleLogout` |
| `DailyReport.update()` silent drop `category` | Ditambahkan ke update array |
| `AnnouncementController.update()` silent drop `category`/`image` | Ditambahkan validasi + update |
| `UserController.store()` role sembarang | `Rule::in([...])` ditambahkan |
| Slug announcement tidak unique | `uniqueSlug()` helper ditambahkan |
| `env('APP_ENV')` di `bootstrap/app.php` | Ganti `app()->environment()` |
| `/health/detailed` unauthenticated | `auth:sanctum` ditambahkan |
| `selectedPeriodId` stale di admin dashboard | `useEffect` sync ditambahkan |
| `endpoints = studentEndpoints(api)` per render | Singleton di `lib/api.ts` |
| `sanitize.ts` tidak force `rel="noopener"` + allow external img | DOMPurify hook ditambahkan |
| Open redirect di fallback route | `request()->path()` + strip host |
| `logout()` tidak revoke Sanctum tokens | Revoke semua token `name='web'` |
| `filteredReports` undefined di render | Ganti dengan `reports` |
| SIAKAD API: OAuth flow tidak perlu | Dihapus, hanya static Bearer token |
| SIAKAD API: `Accept: application/json` header wajib | Ditambahkan ke semua request |
| SIAKAD API: parsing respons `data.data` + `data.last_page` | `yieldAllPages()` diupdate |
| Client-side filter pada paginated list | Filter dikirim ke server |
| `EnsureProfileCompleted` bypass local env | Dihapus |
| `PeriodContextController` return raw Eloquent model | Ganti `getActivePeriodData()` |
| `buildUserData()` double PeriodContext call | `once()` ditambahkan |
| `EnsureProfileCompleted` 13 `filled()` per request | `once()` ditambahkan |

---

### [2026-05-05] - Fix All Sync Issues (Batch 2)
- **FK violation `prodi_fakultas_id_foreign`**: `Fakultas::first()` mengembalikan id yang sudah dihapus (id=1). Fix: ganti ke `Fakultas::orderBy('id')->first()` di semua 3 tempat (`syncPrograms`, `processStudentsSync`, `processLecturersSync`). Migration juga memindahkan prodi orphan ke fakultas valid.
- **Email duplicate mahasiswa**: sama seperti dosen — mahasiswa berbeda bisa punya email sama dari API. Fix: cek `User::where('email')->where('username','!=',...)->exists()` sebelum assign, gunakan fallback `NIM@kkn.local` jika email sudah dipakai.
- **`resolveProgramCode` menghasilkan `PR-{nim}`**: `$programData['id']` berisi student ID bukan prodi ID. Fix: gunakan `prodi_id` / `master_id` / `program_id` sebagai fallback, bukan `id`.
- **Pascasarjana `code` NULL**: migration `sync_fakultas_with_siakad` insert tanpa `code`. Fix: migration `fix_remaining_sync_issues` update `code='Pasca'` jika null.

### [2026-05-05] - Fix Sync Error: GPA Overflow & Email Duplicate Dosen
- **GPA Overflow:** `decimal(3,2)` di tabel `mahasiswa` tidak bisa menampung nilai `gpa=10.73` dari API. Fix: migration `2026_05_05_155500_fix_gpa_decimal_on_mahasiswa_table.php` mengubah ke `decimal(5,2)`.
- **Email Duplicate Dosen:** `users_email_unique` violation saat sync dosen karena beberapa dosen berbagi email yang sama di SIAKAD. Fix: `processLecturersSync` di `SyncMasterData.php` kini cek apakah email sudah dipakai user lain sebelum assign; jika ya, gunakan fallback `NIP@kkn.local`.
- **Model `Master\Mahasiswa`:** `$fillable` diperbarui agar mencakup semua field API kampus (`nik`, `phone`, `alamat`, `status_aktif`, `is_paid_ukt`, dll). Relasi `user()` diperbaiki ke `BelongsTo` by `user_id`.

---

## 🟡 REMAINING (Low Priority)

| Issue | Severity | Keterangan |
|---|---|---|
| Admin `api-client` missing ~31 endpoint groups | LOW | Pages pakai `api.get()` inline — functional, tidak urgent |
| `buildUserData()` query `PesertaKkn` per `/auth/user` | LOW | Cache Redis bisa ditambahkan nanti |
| `sibermas_token` cookie tanpa `HttpOnly`/`Secure` | MED | Set via Laravel response header di production |
| Token expiry 30 hari terlalu panjang | LOW | Pertimbangkan 7 hari untuk mobile |
