# Menambahkan route/page

1. Buat page component di `src/features/<domain>/<Page>.tsx`.
2. Tambahkan entry di `src/app/routes.tsx`:
   - `id`: unik.
   - `path`: URL SPA.
   - `title`: judul topbar.
   - `layout`: `student` | `admin` | `dosen` | `external`.
   - `roles`: role yang boleh akses.
   - `nav`: isi kalau perlu tampil di sidebar.
   - `element`: component page.
3. Kalau nav perlu terkunci fase, isi `nav.phase`. Logika placeholder ada di `src/shared/navigation/phase.ts`.
4. Jangan tambah routing manual di `App.tsx`; pakai config pusat.
5. Jalankan `npm run build`.

Contoh:

```tsx
{
  id: 'student-example',
  path: '/mahasiswa/example',
  title: 'Example',
  layout: 'student',
  roles: STUDENT_ROLES,
  nav: { id: 'student-example', path: '/mahasiswa/example', label: 'Example', roles: STUDENT_ROLES },
  element: <ExamplePage />,
}
```
