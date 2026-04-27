# Diagram Documentation Index

This directory contains technical diagrams and visualizations for SIBERMAS.

## Files

| File | Description |
|------|-------------|
| [01-ERD.md](./01-ERD.md) | Entity Relationship Diagram - Database relationships |
| [02-WORKFLOWS.md](./02-WORKFLOWS.md) | Business workflows and processes |
| [03-API.md](./03-API.md) | REST API endpoints documentation |
| [04-SERVICES.md](./04-SERVICES.md) | Service layer documentation |

## Quick Reference

### Database Domains
1. **Users & Identity** - users, dosen, mahasiswa, profil_user
2. **Academic Structure** - fakultas, prodi, tahun_akademik
3. **Periode & Registration** - periode, peserta_kkn, kelompok_kkn
4. **Activities & Programs** - program_kerja, proposal, kegiatan_kkn
5. **Evaluation & Scoring** - evaluasi, nilai_kkn, item_evaluasi
6. **Absensi & Permissions** - attendance, izin_meninggalkan, dispensasi_kkn

### Key Workflows
1. Pendaftaran KKN - Student registration flow
2. Absensi Harian - Daily attendance with GPS
3. Penilaian - Evaluation and scoring
4. Sertifikat - Certificate generation
5. Sinkronisasi - Data sync with SIKAD
6. Mobile API - Mobile app communication

### API Modules
- Authentication (login, register, logout)
- Master Data (users, dosen, mahasiswa, prodi, fakultas)
- Registration & Kelompok
- Absensi & Permissions
- Activities & Programs
- Evaluation & Scoring
- Certificates
- Reports & Dashboard
- Notifications
- Pengumuman
