# Kebijakan Privasi Data AI (Sistem SIBERMAS)

## 1. Pendahuluan
Sistem SIBERMAS menggunakan integrasi Google Gemini AI untuk memberikan fitur analisis cerdas, seperti evaluasi *logbook* mahasiswa dan interaksi *chat*. Dokumen ini menjelaskan kebijakan penanganan data yang dikirimkan ke dan diterima dari layanan AI tersebut.

## 2. Data yang Dikirimkan ke AI
Sistem SIBERMAS **hanya** mengirimkan data berikut ke layanan Google Gemini API:
- **Teks Logbook**: Isi laporan kegiatan harian (teks murni) yang ditulis oleh mahasiswa.
- **Prompt Chat**: Pertanyaan atau perintah yang diinputkan secara sukarela oleh pengguna pada modul AI Chat.
- **Konteks Sistem**: Metadata terbatas, seperti "jenis kegiatan" atau "durasi", yang diperlukan untuk evaluasi logbook.

## 3. Data yang TIDAK Dikirimkan (Data Pengecualian)
Untuk menjaga privasi dan keamanan, data berikut **TIDAK PERNAH** dikirimkan ke layanan AI pihak ketiga:
- Nomor Induk Kependudukan (NIK)
- Nomor Telepon (WhatsApp)
- Alamat Lengkap
- Dokumen Identitas (KTP, Surat Sehat, Izin Orang Tua)
- Nilai Akhir Mahasiswa (GPA/IPK)
- Data Dosen (NIP, Nomor Telepon)

## 4. Penyimpanan dan Penggunaan Data
- **Penggunaan Sementara**: Data yang dikirim ke Google Gemini API hanya digunakan untuk tujuan pemrosesan *prompt* (seperti menghasilkan evaluasi atau balasan *chat*).
- **Kebijakan Penyedia API**: Sesuai dengan [Kebijakan Privasi Google API](https://developers.google.com/terms/api-services-user-data-policy), data yang dikirim melalui API (untuk layanan berbayar/enterprise) secara default **TIDAK** digunakan oleh Google untuk melatih model dasar (*foundation models*) mereka.
- **Penyimpanan Lokal**: Hasil analisis AI (misalnya, evaluasi logbook) disimpan di basis data lokal SIBERMAS (`evaluasi_logbook_ai`) untuk referensi internal.

## 5. Transparansi dan Kontrol
- **Penanda Khusus**: Semua hasil yang dihasilkan oleh AI di dalam SIBERMAS diberi label khusus (misalnya: *“Dianalisis oleh AI”* atau *“Dihasilkan oleh AI”*) agar pengguna mengetahui sumber informasi tersebut.
- **Penilaian DPL**: Hasil evaluasi *logbook* dari AI hanya bersifat **rekomendasi**. Dosen Pembimbing Lapangan (DPL) memiliki otoritas penuh untuk mengubah, menyetujui, atau menolak penilaian tersebut.

## 6. Kontak
Jika Anda memiliki pertanyaan lebih lanjut terkait kebijakan privasi data AI di SIBERMAS, silakan menghubungi administrator sistem LPPM UIN Saizu.
