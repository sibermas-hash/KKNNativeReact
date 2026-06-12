// Error messages constants
export const ERROR_MESSAGES = {
  // General errors
  NETWORK_ERROR: 'Gagal terhubung ke server. Silakan cek koneksi internet Anda.',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.',

  // Workshop errors
  WORKSHOP_NOT_FOUND: 'Pembekalan tidak ditemukan.',
  WORKSHOP_INVALID_STATUS: 'Pembekalan tidak sedang berlangsung.',
  WORKSHOP_INVALID_TOKEN: 'Kode rahasia absensi salah atau sudah kadaluwarsa.',
  WORKSHOP_LOCATION_OUTSIDE: 'Posisi Anda berada di luar radius lokasi pembekalan.',
  WORKSHOP_DEVICE_USED: 'Perangkat ini sudah digunakan untuk melakukan absensi NIM lain.',
  WORKSHOP_ALREADY_ATTENDED: 'Anda sudah melakukan absensi untuk pembekalan ini.',

  // Posko errors
  POSKO_NOT_FOUND: 'Data posko tidak ditemukan.',
  POSKO_VALIDATION_ERROR: 'Mohon lengkapi semua field wajib.',
  POSKO_SAVE_FAILED: 'Gagal menyimpan data posko.',

  // Registration errors
  REGISTRATION_NOT_FOUND: 'Data pendaftaran tidak ditemukan.',
  REGISTRATION_STATUS_LOCKED: 'Status pendaftaran sudah terkunci. Tidak dapat mengedit dokumen.',
  DOCUMENT_UPLOAD_FAILED: 'Gagal mengunggah dokumen.',
  DOCUMENT_PICK_FAILED: 'Gagal memilih dokumen.',
  DOCUMENT_MISSING: 'File dokumen tidak ditemukan.',
  DOCUMENT_MISSING_REQUIRED: 'Mohon lengkapi dokumen wajib yang tersisa.',

  // Final Report errors
  FINAL_REPORT_NOT_FOUND: 'Laporan akhir tidak ditemukan.',
  FINAL_REPORT_VALIDATION_ERROR: 'Mohon lengkapi judul dan abstrak laporan.',
  FINAL_REPORT_FILE_MISSING: 'File laporan wajib diunggah (format PDF).',
  FINAL_REPORT_SAVE_FAILED: 'Gagal menyimpan laporan akhir.',
  FINAL_REPORT_STATUS_LOCKED: 'Status laporan sudah terkirim. Tidak dapat mengedit.',

  // Location/GPS errors
  LOCATION_PERMISSION_DENIED: 'Aplikasi membutuhkan izin lokasi untuk fitur ini.',
  LOCATION_NOT_ENABLED: 'Layanan lokasi tidak aktif. Silakan aktifkan GPS.',
  LOCATION_TIMEOUT: 'Gagal mendapatkan lokasi. Pastikan GPS aktif dan akurat.',
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
