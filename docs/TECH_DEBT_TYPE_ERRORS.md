# Tech Debt: TypeScript Build Errors (`apps/web`)

**Dibuka:** 2026-05-12
**Owner:** TBD (tim frontend)
**Blocker mode:** `typescript.ignoreBuildErrors: true` di `apps/web/next.config.ts` untuk unblock deploy FreeBSD 2026-05-12.
**Target tutup:** SEBELUM menambah fitur major berikutnya.

---

## Ringkasan

`pnpm build` lolos untuk emit code, tapi `tsc --noEmit` melaporkan
**~230 type error di 33 file**. Runtime tidak crash (semua akses pakai
`?.` + `as` cast), tapi type safety praktis hilang di halaman-halaman
tersebut — refactor besok akan sulit karena kompiler tidak lagi menangkap
shape mismatch.

Status build saat ini:

- `next build` → SUKSES (karena `ignoreBuildErrors: true`)
- `tsc --noEmit` di `apps/web` → 230+ error
- ESLint → pass (sisa warning minor tidak blocking)

---

## Root Causes

### 1. React Query `queryFn` return type ter-infer `{}`

Mayoritas error (≈ 70%) datang dari pola:

```tsx
const { data } = useQuery({
  queryFn: async () => {
    const res = await api.get('/endpoint');
    return (res as unknown as { data?: unknown })?.data ?? res;
  },
});

// data: {} (inferred)
const items = data?.items;       // ❌ Property 'items' does not exist on type '{}'
```

Penyebab: fallback `?? res` bertipe `AxiosResponse<any, any, {}>` sehingga
union TS melebar ke `{}`.

**Perbaikan yang disarankan:** tambah helper generic di `@sibermas/api-client`:

```ts
// packages/api-client/src/typed.ts
export async function getTyped<T>(path: string, opts?: AxiosRequestConfig): Promise<T> {
  const res = await api.get(path, opts);
  const payload = (res as { data?: unknown })?.data ?? res;
  return payload as T;
}
```

Lalu refactor:

```tsx
queryFn: () => getTyped<{ items: Item[]; meta: PaginationMeta }>('/endpoint')
```

### 2. React Hook Form + Zod 3/4 resolver mismatch

`src/app/(student)/profil/page.tsx` sendirian menyumbang **130 error**
karena resolver `zodResolver(schema)` lempar type error `Zod3Type expected,
object provided`. Ini mengindikasikan mismatch antara versi Zod yang
di-install (kemungkinan v4) dengan `@hookform/resolvers` yang masih
mengharapkan `Zod3Type`.

**Pilihan perbaikan:**
- Downgrade `zod` ke versi 3.x, atau
- Upgrade `@hookform/resolvers` ke versi yang support Zod 4, atau
- Import resolver spesifik: `@hookform/resolvers/zod` vs `@hookform/resolvers/zod-3`.

### 3. lucide-react icon sebagai JSX komponen

`src/app/(admin)/admin/playground/page.tsx`: `<Icon />` typed sebagai `{}`,
bukan ComponentType. Kemungkinan besar dari pola `const Icon = iconMap[key]`
di mana `iconMap` tidak ditype-kan dengan `Record<string, LucideIcon>`.

---

## File Affected (sorted by error count)

| # Errors | File |
|---:|---|
| 130 | `src/app/(student)/profil/page.tsx` (Zod resolver) |
| 13 | `src/app/(admin)/admin/periode/[id]/page.tsx` |
| 11 | `src/app/(dosen)/dosen/laporan-harian/[id]/page.tsx` |
| 9 | `src/app/(student)/mahasiswa/program-kerja/[id]/page.tsx` |
| 9 | `src/app/(student)/mahasiswa/laporan-harian/page.tsx` |
| 9 | `src/app/(student)/mahasiswa/laporan-harian/[id]/edit/page.tsx` |
| 8 | `src/app/(admin)/admin/playground/page.tsx` |
| 8 | `src/app/(admin)/admin/pendaftaran/[id]/page.tsx` |
| 6 | `src/app/(admin)/admin/kelompok/[id]/page.tsx` |
| 5 | `src/app/(student)/mahasiswa/pendaftaran/page.tsx` |
| 5 | `src/app/(admin)/admin/workshops/page.tsx` |
| 5 | `src/app/(admin)/admin/database-sync/page.tsx` |
| 4 | `src/app/(dosen)/dosen/laporan-akhir/[id]/page.tsx` |
| 3 | `src/app/(student)/mahasiswa/posko/page.tsx` |
| 3 | `src/app/(student)/mahasiswa/evaluasi-dpl/page.tsx` |
| 2 | `src/app/(student)/mahasiswa/sertifikat/page.tsx` |
| 2 | `src/app/(student)/mahasiswa/rekapitulasi/page.tsx` |
| 2 | `src/app/(auth)/ganti-password/page.tsx` (Zod resolver) |
| 2 | `src/app/(admin)/admin/pengaturan/sertifikat/page.tsx` |
| 1 | `src/components/admin/activity-stats-widget.tsx` |
| 1 | `src/app/(student)/mahasiswa/program-kerja/buat/page.tsx` |
| 1 | `src/app/(student)/mahasiswa/pendaftaran/[id]/dokumen/page.tsx` |
| 1 | `src/app/(student)/mahasiswa/laporan-akhir/page.tsx` |
| 1 | `src/app/(student)/mahasiswa/izin/page.tsx` |
| 1 | `src/app/(student)/mahasiswa/chat/page.tsx` |
| 1 | `src/app/(dosen)/dosen/umpan-balik-peserta/page.tsx` |
| 1 | `src/app/(dosen)/dosen/kelompok/page.tsx` |
| 1 | `src/app/(dosen)/dosen/kelompok/[id]/page.tsx` |
| 1 | `src/app/(dosen)/dosen/evaluasi/page.tsx` |
| 1 | `src/app/(admin)/admin/periode/page.tsx` |
| 1 | `src/app/(admin)/admin/pengaturan/sistem/page.tsx` |
| 1 | `src/app/(admin)/admin/pengaturan/notifikasi/page.tsx` |
| 1 | `src/app/(admin)/admin/fakultas/page.tsx` |

**Total:** 33 file, ~230 error.

---

## Fix Sudah Dikerjakan (tidak di-revert walau `ignoreBuildErrors` aktif)

Selama investigasi 2026-05-12, 4 fix kecil sudah diterapkan karena
semantic-nya benar — dipertahankan meski build-check di-skip:

| File | Perubahan |
|---|---|
| `src/app/(admin)/admin/activity-log/page.tsx` | `meta` di-cast ke `PaginationMeta \| undefined` |
| `src/app/(admin)/admin/avatar-moderation/page.tsx` | `data?.data` dicast via `as { data?: unknown }` |
| `src/app/(admin)/admin/chat/page.tsx` | intermediate `typed` variable untuk `conversations` + `summary` |
| `src/app/(dosen)/dosen/daftar-dpl/page.tsx` | Bug copy-paste: `err?.response` → `e?.response` (narrowing aktif) |

---

## Rencana Eksekusi (saran sequencing)

### Fase 1 — Root-cause infrastructure (~0.5 hari)
1. Tambah `getTyped<T>()` helper di `@sibermas/api-client`.
2. Resolve Zod/resolver version mismatch (investigasi + pilih strategi).
3. Export `type PaginationMeta` di `@sibermas/shared-types`.

### Fase 2 — Migrasi file (~1.5 hari, bisa paralel)
- Batch 1 (admin): `admin/periode/*`, `admin/pendaftaran/*`, `admin/kelompok/*`, `admin/pengaturan/*`, `admin/database-sync`, `admin/workshops`, `admin/playground`, `admin/fakultas`
- Batch 2 (dosen): `dosen/laporan-harian/*`, `dosen/laporan-akhir/*`, `dosen/kelompok/*`, `dosen/evaluasi`, `dosen/umpan-balik-peserta`
- Batch 3 (mahasiswa): `mahasiswa/laporan-harian/*`, `mahasiswa/program-kerja/*`, `mahasiswa/pendaftaran/*`, `mahasiswa/evaluasi-dpl`, `mahasiswa/posko`, `mahasiswa/sertifikat`, `mahasiswa/rekapitulasi`, `mahasiswa/laporan-akhir`, `mahasiswa/izin`, `mahasiswa/chat`
- Batch 4 (lain-lain): `student/profil`, `auth/ganti-password`, `components/admin/*`

### Fase 3 — Re-enable strict build (~15 menit)
- Hapus `typescript.ignoreBuildErrors` dari `next.config.ts`.
- `pnpm build` harus sukses tanpa flag.
- Dokumen ini dihapus atau dipindah ke `docs/CHANGELOG.md`.

---

## Cara Cek Progress

```bash
cd apps/web
../../node_modules/.bin/tsc --noEmit 2>&1 | \
  perl -ne 'print "$1\n" if /^(src\/\S+?\.tsx?)\(\d+,\d+\)/' | \
  sort | uniq -c | sort -rn
```

Output menunjukkan file-file yang tersisa + jumlah error-nya. Target: kosong.
