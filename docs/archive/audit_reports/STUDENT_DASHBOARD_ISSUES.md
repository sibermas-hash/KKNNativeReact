# 🐛 Student Dashboard Issues Found

## ❌ Critical Issues

### 1. **Broken Tailwind Classes** 🔴 HIGH
Located in `resources/js/Pages/Student/Dashboard.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 155 | `active:` (incomplete) | Remove or add proper value |
| 282 | `active:group/btn -200` (garbage) | Replace with `active:scale-95` |
| 415 | `hover:-transition-all` (negative) | Change to `hover:bg-slate-50` or remove |
| 416 | `group-` (incomplete) | Remove incomplete class |
| 421 | `group-relative` (invalid) | Change to `relative` |
| 456 | `active:` (incomplete) | Remove or add proper value |

---

### 2. **Tactical/Uppercase Labels** 🟡 MEDIUM
Not cleaned up from previous cleanup pass:

| Content | Location | Should Be |
|---------|----------|-----------|
| STUDENT_TERMINAL_V3.2 | Line 121 | Remove completely |
| VERIFIKASI_ADMIN | Line 129 | "Perlu verifikasi admin" |
| AKTIF_VERIFIED | Line 142 | "Aktif" |
| PENDING | Line 142 | "Menunggu" |
| DATA_KOSONG | Line 142 | "Belum terdaftar" |
| VERIFIED | Line 307 | "Terverifikasi" |
| TERKIRIM | Line 300 | "Terkirim" (OK) |
| BELUM | Line 300 | "Belum" (OK) |

---

### 3. **Inconsistent Opacity**
- Line 170: `opacity-60` (should be removed - causes dim text)
- Line 197: `opacity-60` (decorative opacity)
- Line 275: `opacity-70` (decorative opacity)
- Line 428: `opacity-60` (decorative opacity)

---

## 📊 Summary

```
Total Issues Found: 13
├─ Broken Classes: 6 (HIGH)
├─ Tactical Labels: 8 (MEDIUM)
├─ Opacity Issues: 4 (MEDIUM)
└─ Other: TBD
```

---

## ✅ Status
- **File**: `resources/js/Pages/Student/Dashboard.tsx` (470 lines)
- **Lines Modified**: ~20
- **Impact**: UI rendering issues, broken buttons, confusing labels
