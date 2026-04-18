# Prompt untuk Claude.ai - PRD E2E Testing

Salin dan paste prompt di bawah ini ke Claude.ai (claude.ai atau Cursor/VSCode dengan extension Claude):

---

## Prompt

```
Saya ingin membuat Product Requirement Document (PRD) untuk proyek End-to-End (E2E) Testing menggunakan Playwright untuk aplikasi KKN UIN SAIZU.

Berikut konteks proyek:
- Tech Stack: Laravel 13 + Inertia.js + React/TypeScript
- Portal Kuliah Kerja Nyata (KKN) untuk mahasiswa, DPL (Dosen Pembimbing Lapangan), dan Admin
- Testing tools: Playwright (E2E), Vitest (Unit), Pest/PHPUnit (Backend)

Status saat ini:
- 7 E2E tests ada, 5 pass, 2 fail
- Fail karena: element not found pada login form, heading tidak sesuai ekspektasi
- Konfigurasi sudah ada di playwright.config.ts

Buatkan PRD lengkap yang mencakup:

1. **Project Overview**
   - Latar belakang dan tujuan
   - Scope of work

2. **Functional Requirements**
   - Fitur yang harus ditest (public page, login, dashboard student, dashboard DPL, dashboard admin, registration, reporting, assessment)
   - User flows yang harus dicakup

3. **Non-Functional Requirements**
   - Performance criteria
   - Reliability
   - Maintainability

4. **Test Scenarios**
   - Positive cases
   - Negative cases
   - Edge cases

5. **Technical Requirements**
   - Playwright setup
   - Test data management
   - CI/CD integration

6. **Timeline & Milestones**
   - Fase-fase pengembangan
   - Deliverables

7. **Risks & Mitigations**
   - Potensi masalah dan solusi

8. **Success Metrics**
   - Kriteria keberhasilan

Tolong buatkan dalam format dokumen profesional yang bisa langsung digunakan untuk development.
```

---

## Cara Penggunaan

1. **Buka Claude.ai** (claude.ai atau lewat Cursor/VSCode)
2. **Copy paste prompt** di atas
3. **Kirim** dan tunggu response
4. **Follow-up** jika perlu ada klarifikasi

---

## Preview yang Akan Didapat

Claude.ai akan menghasilkan PRD lengkap dengan:

- Struktur dokumen profesional
- Detail requirements
- Timeline realistis
- Risk assessment
- Test scenarios spesifik untuk KKN

---
