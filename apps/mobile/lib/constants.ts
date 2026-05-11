// Common constants used across the app
export const CONSTANTS = {
  // API values
  API_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,

  // Form validations
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: {
    PDF: 'application/pdf',
    JPG: 'image/jpeg',
    PNG: 'image/png',
  } as const,

  // Workshop-specific
  WORKSHOP_TOKEN_LENGTH: 6,
  WORKSHOP_GPS_TOLERANCE_METERS: 10, // 10% tolerance
  WORKSHOP_MIN_GPS_TOLERANCE_METERS: 5, // Minimum 5 meters
  WORKSHOP_PASSING_SCORE: 70, // Minimum score to pass

  // Location/GPS
  GPS_ACCURACY_HIGH: 3, // Expo Location accuracy
  GPS_TIME_INTERVAL: 5000, // 5 seconds

  // UI placeholders
  PLACEHOLDERS: {
    WORKSHOP_TOKEN: 'Masukkan 6-digit kode',
    ALAMAT: 'Jalan lengkap...',
    PROVINSI: 'Nama provinsi',
    KABUPATEN: 'Nama kabupaten/kota',
    KEAMATAN: 'Nama kecamatan',
    KELURAHAN: 'Nama kelurahan/desa',
    KODE_POS: '5 digit kode pos',
  },

  // Status options
  KKN_STATUS: ['draft', 'submitted', 'approved', 'rejected'] as const,
  WORKSHOP_STATUS: ['scheduled', 'completed', 'cancelled'] as const,
  ATTENDANCE_STATUS: ['pending_verification', 'attended', 'absent', 'excused'] as const,

  // Type options
  JENIS_POSKO: ['kesehatan', 'administrasi', 'logistik', 'fasilitas'] as const,
} as const;

export type Kopk = typeof CONSTANTS.JENIS_POSKO[number];
export type WorkshopStatus = typeof CONSTANTS.WORKSHOP_STATUS[number];
export type AttendanceStatus = typeof CONSTANTS.ATTENDANCE_STATUS[number];
