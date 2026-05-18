export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'] as const,
    captcha: ['auth', 'captcha'] as const,
  },
  periodContext: {
    all: ['period-context'] as const,
  },
  student: {
    dashboard: ['student', 'dashboard'] as const,
    dailyReports: (page?: number, status?: string, search?: string) => ['student', 'daily-reports', { page, status, search }] as const,
    dailyReport: (id: number) => ['student', 'daily-reports', id] as const,
    workPrograms: ['student', 'work-programs'] as const,
    workProgram: (id: number) => ['student', 'work-programs', id] as const,
    registration: {
      form: ['student', 'registration', 'form'] as const,
      status: ['student', 'registration', 'status'] as const,
    },
    kknDaftar: ['student', 'kkn-daftar'] as const,
    certificates: ['student', 'certificates'] as const,
    leaveRequests: ['student', 'leave-requests'] as const,
    finalReport: ['student', 'final-report'] as const,
    evaluations: ['student', 'evaluations'] as const,
    dplEvaluation: ['student', 'dpl-evaluation'] as const,
    rekapitulasi: ['student', 'rekapitulasi'] as const,
    posko: ['student', 'posko'] as const,
    chat: ["student", "chat"] as const,
  },
  dpl: {
    dashboard: ['dpl', 'dashboard'] as const,
    groups: ['dpl', 'groups'] as const,
    group: (id: number) => ['dpl', 'groups', id] as const,
    dailyReports: (page?: number, status?: string, search?: string) => ['dpl', 'daily-reports', { page, status, search }] as const,
    dailyReport: (id: number) => ['dpl', 'daily-reports', id] as const,
    evaluations: ['dpl', 'evaluations'] as const,
    finalReports: ['dpl', 'final-reports'] as const,
    monitoring: ['dpl', 'monitoring'] as const,
    leaveRequests: ['dpl', 'leave-requests'] as const,
    feedback: ['dpl', 'feedback'] as const,
  },
  dosen: {
    dashboard: ['dosen', 'dashboard'] as const,
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    periods: (page?: number) => ['admin', 'periods', { page }] as const,
    period: (id: number) => ['admin', 'periods', id] as const,
    registrations: (params?: Record<string, unknown>) => ['admin', 'registrations', params] as const,
    registration: (id: number) => ['admin', 'registrations', id] as const,
    groups: (params?: Record<string, unknown>) => ['admin', 'groups', params] as const,
    group: (id: number) => ['admin', 'groups', id] as const,
    users: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
    mahasiswa: (params?: Record<string, unknown>) => ['admin', 'mahasiswa', params] as const,
    dosen: (params?: Record<string, unknown>) => ['admin', 'dosen', params] as const,
    grades: (params?: Record<string, unknown>) => ['admin', 'grades', params] as const,
    dailyReports: (params?: Record<string, unknown>) => ['admin', 'daily-reports', params] as const,
    finalReports: (params?: Record<string, unknown>) => ['admin', 'final-reports', params] as const,
    announcements: ['admin', 'announcements'] as const,
    downloads: ['admin', 'downloads'] as const,
    auditLog: (params?: Record<string, unknown>) => ['admin', 'audit-log', params] as const,
    settings: ['admin', 'settings'] as const,
    aiConfig: ['admin', 'ai-config'] as const,
  },
  public: {
    announcements: (page?: number) => ['public', 'announcements', { page }] as const,
    announcement: (slug: string) => ['public', 'announcements', slug] as const,
    downloads: ['public', 'downloads'] as const,
    locations: ['public', 'locations'] as const,
    certificate: (token: string) => ['public', 'certificate', token] as const,
    home: ['public', 'home'] as const,
  },
} as const;

export const PHASE_LABELS: Record<string, string> = {
  upcoming: 'Pra-Pendaftaran',
  registration: 'Masa Pendaftaran',
  placement: 'Seleksi & Plotting',
  execution: 'Pelaksanaan KKN',
  grading: 'Masa Penilaian',
  finished: 'KKN Selesai',
  idle: 'Tidak Aktif',
  closed: 'Ditutup',
};

export const ROLE_REDIRECT_MAP: Record<string, string> = {
  superadmin: '/admin',
  admin: '/admin',
  faculty_admin: '/admin',
  dosen: '/dosen',
  dpl: '/dosen',
  student: '/mahasiswa',
};

export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  faculty_admin: 'Admin Fakultas',
  dosen: 'Dosen',
  dpl: 'DPL',
  student: 'Mahasiswa',
};

export const STATUS_LABELS: Record<string, Record<string, string>> = {
  peserta: {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    document_submitted: 'Dokumen Terkirim',
    completed: 'Selesai',
  },
  kegiatan: {
    draft: 'Draft',
    submitted: 'Menunggu Review',
    approved: 'Disetujui',
    revision: 'Perlu Revisi',
    completed: 'Selesai',
  },
  laporanAkhir: {
    draft: 'Draft',
    submitted: 'Menunggu Review',
    approved: 'Disetujui',
    revision: 'Perlu Revisi',
    completed: 'Selesai',
  },
  izin: {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
  },
};
