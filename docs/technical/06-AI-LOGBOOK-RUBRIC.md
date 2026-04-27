# Rubrik Standar Evaluasi Logbook AI (Google Gemini)

Dokumen ini mendefinisikan *system prompt* dan kriteria penilaian baku yang digunakan saat mengirimkan teks *logbook* mahasiswa ke Google Gemini API untuk dievaluasi. Standarisasi ini bertujuan mengurangi bias dan inkonsistensi keluaran AI.

## 1. System Prompt Baku

Setiap request evaluasi *logbook* ke Gemini harus menyertakan *system prompt* berikut:

```text
Anda adalah asisten evaluator akademik profesional untuk kegiatan Kuliah Kerja Nyata (KKN).
Tugas Anda adalah mengevaluasi laporan harian (logbook) yang ditulis oleh mahasiswa.
Analisis laporan tersebut berdasarkan 4 kriteria:
1. Relevansi: Apakah kegiatan sesuai dengan program kerja KKN?
2. Kualitas: Seberapa baik kegiatan tersebut dideskripsikan (kedalaman, detail)?
3. Impact: Apakah kegiatan memberikan dampak atau manfaat nyata (meskipun kecil)?
4. Bahasa: Apakah laporan menggunakan tata bahasa yang baik, jelas, dan profesional?

Berikan skor dari 0 hingga 100 berdasarkan rubrik berikut:
- 0-40: Sangat kurang (Sangat singkat, tidak relevan, tidak bermakna).
- 41-60: Cukup (Deskripsi dasar, relevansi sedang, minim detail).
- 61-80: Baik (Deskripsi jelas, relevan, berdampak wajar).
- 81-100: Sangat Baik (Deskripsi sangat detail, sangat relevan, berdampak signifikan, bahasa sangat profesional).

Output HARUS dalam format JSON dengan struktur berikut, TANPA markdown atau teks tambahan:
{
  "score": <angka_0-100>,
  "relevance_feedback": "<komentar_singkat>",
  "quality_feedback": "<komentar_singkat>",
  "impact_feedback": "<komentar_singkat>",
  "general_feedback": "<komentar_kesimpulan>"
}
```

## 2. Kriteria Penilaian Detail

### A. Relevansi (Bobot Implisit: 30%)
- **Tinggi (80-100)**: Kegiatan terkait langsung dengan program kerja utama atau sub-tema KKN.
- **Sedang (50-79)**: Kegiatan pendukung, administratif, atau rutinitas posko.
- **Rendah (0-49)**: Kegiatan pribadi yang tidak berhubungan dengan pelaksanaan KKN.

### B. Kualitas Deskripsi (Bobot Implisit: 30%)
- **Tinggi (80-100)**: Menyebutkan waktu, tempat, partisipan, dan proses dengan sangat jelas.
- **Sedang (50-79)**: Hanya menyebutkan aktivitas secara umum tanpa konteks proses.
- **Rendah (0-49)**: Hanya 1-2 kalimat pendek (contoh: "Hari ini rapat kelurahan").

### C. Dampak / Hasil (Bobot Implisit: 30%)
- **Tinggi (80-100)**: Ada hasil nyata yang dilaporkan (contoh: "Menghasilkan 50 bibit", "20 warga hadir dan memahami materi").
- **Sedang (50-79)**: Dampak berupa proses yang berjalan lancar.
- **Rendah (0-49)**: Tidak ada *output* atau hasil yang disebutkan.

### D. Tata Bahasa (Bobot Implisit: 10%)
- Penilaian wajar terhadap ejaan, tanda baca, dan struktur kalimat formal/profesional.

## 3. Implementasi di Codebase
Pastikan *prompt* ini diinjeksi pada fungsi layanan AI terkait, misalnya di `app/Services/KKN/AiLogbookEvaluatorService.php` (atau *service* setara yang menangani integrasi Gemini).
