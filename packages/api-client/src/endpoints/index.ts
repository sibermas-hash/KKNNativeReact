import type { AxiosInstance } from 'axios';

export function authEndpoints(client: AxiosInstance) {
  return {
    captcha: () => client.get('/auth/captcha'),
    login: (data: { login: string; password: string; captcha_id: string; captcha_answer: string; remember?: boolean }) =>
      client.post('/auth/login', data),
    twoFactorVerify: (data: { challenge_token: string; code: string }) =>
      client.post('/auth/2fa-verify', data),
    logout: () => client.post('/auth/logout'),
    user: () => client.get('/auth/user'),
    forgotPassword: (data: { email: string }) => client.post('/auth/lupa-kata-sandi', data),
    resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      client.post('/auth/atur-ulang-kata-sandi', data),
  };
}

export function studentEndpoints(client: AxiosInstance) {
  return {
    dashboard: () => client.get('/student/dashboard'),
    registration: {
      form: () => client.get('/student/registration/form'),
      store: (data: { periode_id: number; jenis_kkn_id?: number }) => client.post('/student/registration', data),
      status: () => client.get('/student/registration/status'),
      leave: (periodeId: number) => client.post(`/student/registration/${periodeId}/leave`, {}),
    },
    kknDaftar: {
      index: () => client.get('/student/kkn-daftar'),
      groups: (periodeId: number) => client.get(`/student/kkn-daftar/${periodeId}/kelompok`),
    },
    dailyReports: {
      index: (page = 1, params?: { status?: string; search?: string }) =>
        client.get('/student/daily-reports', { params: { page, ...params } }),
      show: (id: number) => client.get(`/student/daily-reports/${id}`),
      store: (data: FormData) => client.post('/student/daily-reports', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      update: (id: number, data: FormData) => client.put(`/student/daily-reports/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      destroy: (id: number) => client.delete(`/student/daily-reports/${id}`),
    },
    workPrograms: {
      index: () => client.get('/student/work-programs'),
      show: (id: number) => client.get(`/student/work-programs/${id}`),
      store: (data: Record<string, unknown>) => client.post('/student/work-programs', data),
      uploadProposal: (id: number, data: FormData) => client.post(`/student/work-programs/${id}/proposal`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
    leaveRequests: {
      index: () => client.get('/student/leave-requests'),
      store: (data: FormData) => client.post('/student/leave-requests', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
    finalReport: {
      index: () => client.get('/student/final-report'),
      store: (data: FormData) => client.post('/student/final-report', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
    certificates: {
      index: () => client.get('/student/certificates'),
      // Binary PDF stream — must use responseType:'blob' so axios keeps raw bytes
      // instead of trying to parse them as JSON. See audit fix R11-API-003.
      download: (id: number) => client.get(`/student/certificates/${id}/download`, { responseType: 'blob' }),
    },
    dplEvaluation: {
      form: () => client.get('/student/dpl-evaluation/form'),
      store: (data: Record<string, unknown>) => client.post('/student/dpl-evaluation', data),
    },
    poster: {
      index: () => client.get('/student/poster-potensi-desa'),
      store: (data: FormData) => client.post('/student/poster-potensi-desa', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
    notificationShown: (id: number) => client.patch(`/student/peserta-kkn/${id}/notification-shown`),
    // GAP-1: document upload for registration
    documents: (periodeId: number, data: FormData) =>
      client.post(`/student/registration/${periodeId}/documents`, data),
    // GAP-3: posko
    posko: {
      show: () => client.get('/student/posko'),
      store: (data: Record<string, unknown>) => client.post('/student/posko', data),
    },
  };
}

export function dplEndpoints(client: AxiosInstance) {
  return {
    dashboard: () => client.get('/dpl/dashboard'),
    groups: {
      index: () => client.get('/dpl/groups'),
      show: (id: number) => client.get(`/dpl/groups/${id}`),
    },
    dailyReports: {
      index: (params?: Record<string, unknown>) => client.get('/dpl/daily-reports', { params }),
      show: (id: number) => client.get(`/dpl/daily-reports/${id}`),
      approve: (id: number) => client.patch(`/dpl/daily-reports/${id}/approve`),
      revision: (id: number, data: { review_notes: string }) => client.patch(`/dpl/daily-reports/${id}/revision`, data),
      batchApprove: (ids: number[]) => client.post('/dpl/daily-reports/batch-approve', { report_ids: ids }),
      downloadFile: (fileId: number) => client.get(`/dpl/daily-reports/file/${fileId}/download`, { responseType: 'blob' }),
      previewFile: (fileId: number) => client.get(`/dpl/daily-reports/file/${fileId}/preview`),
    },
    evaluations: {
      index: (params?: Record<string, unknown>) => client.get('/dpl/evaluations', { params }),
      store: (data: Record<string, unknown>) => client.post('/dpl/evaluations', data),
      validateImport: (data: FormData) => client.post('/dpl/evaluations/validate-import', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      import: (data: Record<string, unknown>) => client.post('/dpl/evaluations/import', data),
    },
    finalReports: {
      index: (params?: Record<string, unknown>) => client.get('/dpl/final-reports', { params }),
      show: (id: number) => client.get(`/dpl/final-reports/${id}`),
      approve: (id: number, data?: { score?: number }) => client.patch(`/dpl/final-reports/${id}/approve`, data),
      revision: (id: number, data: { review_notes: string }) => client.patch(`/dpl/final-reports/${id}/revision`, data),
      download: (id: number) => client.get(`/dpl/final-reports/${id}/download`, { responseType: 'blob' }),
    },
    monitoring: {
      index: () => client.get('/dpl/monitoring'),
      store: (data: FormData) => client.post('/dpl/monitoring', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
    leaveRequests: {
      index: (params?: Record<string, unknown>) => client.get('/dpl/leave-requests', { params }),
      approve: (id: number) => client.patch(`/dpl/leave-requests/${id}/approve`),
      reject: (id: number, data: { rejection_reason: string }) => client.patch(`/dpl/leave-requests/${id}/reject`, data),
    },
    feedback: () => client.get('/dpl/feedback'),
  };
}

export function dosenEndpoints(client: AxiosInstance) {
  return {
    dashboard: () => client.get('/dosen/dashboard'),
    workshops: {
      index: (params?: Record<string, unknown>) => client.get('/dosen/workshops', { params }),
      register: (workshopId: number) => client.post(`/dosen/workshops/${workshopId}/register`),
      myCertificates: () => client.get('/dosen/workshops/my-certificates'),
      downloadCertificate: (participantId: number) => client.get(`/dosen/workshops/${participantId}/certificate`, { responseType: 'blob' }),
    },
    daftarDpl: (data: Record<string, unknown>) => client.post('/dosen/daftar-dpl', data),
  };
}

export function adminEndpoints(client: AxiosInstance) {
  return {
    hub: () => client.get('/admin/hub'),
    dashboard: (params?: Record<string, unknown>) => client.get('/admin/dashboard', { params }),
    switchPhase: (data: { periode_id: number; phase: string }) => client.post('/admin/dashboard/switch-phase', data),

    periods: {
      index: (params?: Record<string, unknown>) => client.get('/admin/periode', { params }),
      show: (id: number) => client.get(`/admin/periode/${id}`),
      store: (data: Record<string, unknown>) => client.post('/admin/periode', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/periode/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/periode/${id}`),
      duplicate: (id: number) => client.post(`/admin/periode/${id}/duplicate`),
      documentTemplates: (id: number) => client.get(`/admin/periode/${id}/document-templates`),
      assignDocumentTemplate: (id: number, data: { jenis_kkn_document_requirement_id: number; document_template_id: number }) => client.post(`/admin/periode/${id}/document-templates`, data),
      removeDocumentTemplate: (id: number, assignmentId: number) => client.delete(`/admin/periode/${id}/document-templates/${assignmentId}`),
    },

    master: {
      academicYears: {
        index: (params?: Record<string, unknown>) => client.get('/admin/tahun-akademik', { params }),
        store: (data: Record<string, unknown>) => client.post('/admin/tahun-akademik', data),
        update: (id: number, data: Record<string, unknown>) => client.put(`/admin/tahun-akademik/${id}`, data),
        destroy: (id: number) => client.delete(`/admin/tahun-akademik/${id}`),
      },
      kknTypes: {
        index: (params?: Record<string, unknown>) => client.get('/admin/jenis-kkn', { params }),
        show: (id: number) => client.get(`/admin/jenis-kkn/${id}`),
        store: (data: Record<string, unknown>) => client.post('/admin/jenis-kkn', data),
        update: (id: number, data: Record<string, unknown>) => client.put(`/admin/jenis-kkn/${id}`, data),
        destroy: (id: number) => client.delete(`/admin/jenis-kkn/${id}`),
        documentRequirements: (id: number) => client.get(`/admin/jenis-kkn/${id}/document-requirements`),
        addDocumentRequirement: (id: number, data: Record<string, unknown>) => client.post(`/admin/jenis-kkn/${id}/document-requirements`, data),
        updateDocumentRequirement: (id: number, requirementId: number, data: Record<string, unknown>) => client.put(`/admin/jenis-kkn/${id}/document-requirements/${requirementId}`, data),
        deleteDocumentRequirement: (id: number, requirementId: number) => client.delete(`/admin/jenis-kkn/${id}/document-requirements/${requirementId}`),
      },
      faculties: {
        index: (params?: Record<string, unknown>) => client.get('/admin/fakultas', { params }),
        store: (data: Record<string, unknown>) => client.post('/admin/fakultas', data),
        update: (id: number, data: Record<string, unknown>) => client.put(`/admin/fakultas/${id}`, data),
        destroy: (id: number) => client.delete(`/admin/fakultas/${id}`),
      },
      studyPrograms: {
        index: (params?: Record<string, unknown>) => client.get('/admin/prodi', { params }),
        store: (data: Record<string, unknown>) => client.post('/admin/prodi', data),
        update: (id: number, data: Record<string, unknown>) => client.put(`/admin/prodi/${id}`, data),
        destroy: (id: number) => client.delete(`/admin/prodi/${id}`),
      },
      locations: {
        index: (params?: Record<string, unknown>) => client.get('/admin/lokasi', { params }),
        store: (data: Record<string, unknown>) => client.post('/admin/lokasi', data),
        update: (id: number, data: Record<string, unknown>) => client.put(`/admin/lokasi/${id}`, data),
        destroy: (id: number) => client.delete(`/admin/lokasi/${id}`),
        import: (data: FormData) => client.post('/admin/lokasi/import', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      },
    },

    requirements: {
      index: (params?: Record<string, unknown>) => client.get('/admin/kkn-requirements', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/kkn-requirements', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/kkn-requirements/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/kkn-requirements/${id}`),
      toggle: (id: number) => client.patch(`/admin/kkn-requirements/${id}/toggle`),
    },
    documentTemplates: {
      index: (params?: Record<string, unknown>) => client.get('/admin/document-templates', { params }),
      store: (data: FormData) => client.post('/admin/document-templates', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      destroy: (id: number) => client.delete(`/admin/document-templates/${id}`),
      download: (id: number) => client.get(`/admin/document-templates/${id}/download`, { responseType: 'blob' }),
    },

    registrations: {
      index: (params?: Record<string, unknown>) => client.get('/admin/pendaftaran', { params }),
      show: (id: number) => client.get(`/admin/pendaftaran/${id}`),
      approve: (id: number) => client.patch(`/admin/pendaftaran/${id}/approve`),
      reject: (id: number, data: { rejection_reason: string }) => client.patch(`/admin/pendaftaran/${id}/reject`, data),
      assignGroup: (id: number, data: { kelompok_id: number }) => client.patch(`/admin/pendaftaran/${id}/assign-group`, data),
      bulkApprove: (ids: number[]) => client.post('/admin/pendaftaran/bulk-approve', { ids }),
      bulkReject: (ids: number[], reason: string) => client.post('/admin/pendaftaran/bulk-reject', { ids, rejection_reason: reason }),
      downloadDocument: (path: string) => client.get('/admin/pendaftaran/berkas/unduh', { params: { path }, responseType: 'blob' }),
    },

    groups: {
      index: (params?: Record<string, unknown>) => client.get('/admin/kelompok', { params }),
      show: (id: number) => client.get(`/admin/kelompok/${id}`),
      store: (data: Record<string, unknown>) => client.post('/admin/kelompok', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/kelompok/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/kelompok/${id}`),
      import: (data: FormData) => client.post('/admin/kelompok/import', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },

    dpl: {
      registrations: (params?: Record<string, unknown>) => client.get('/admin/dosen/pendaftaran-dpl', { params }),
      approve: (id: number) => client.patch(`/admin/dosen/pendaftaran-dpl/${id}/setujui`),
      reject: (id: number) => client.patch(`/admin/dosen/pendaftaran-dpl/${id}/tolak`),
      assignments: (params?: Record<string, unknown>) => client.get('/admin/dosen/penugasan', { params }),
    },

    kknOperations: {
      dailyReports: {
        index: (params?: Record<string, unknown>) => client.get('/admin/laporan/harian', { params }),
        show: (id: number) => client.get(`/admin/laporan/harian/${id}`),
        approve: (id: number) => client.patch(`/admin/laporan/harian/${id}/approve`),
        revision: (id: number, data: { review_notes: string }) => client.patch(`/admin/laporan/harian/${id}/revision`, data),
        downloadFile: (fileId: number) => client.get(`/admin/laporan/harian/file/${fileId}/download`, { responseType: 'blob' }),
        previewFile: (fileId: number) => client.get(`/admin/laporan/harian/file/${fileId}/preview`),
      },
      workPrograms: {
        index: (params?: Record<string, unknown>) => client.get('/admin/laporan/program-kerja', { params }),
      },
      finalReports: {
        index: (params?: Record<string, unknown>) => client.get('/admin/laporan/akhir', { params }),
        show: (id: number) => client.get(`/admin/laporan/akhir/${id}`),
        updateStatus: (id: number, data: { status: string; review_notes?: string }) => client.patch(`/admin/laporan/akhir/${id}/status`, data),
        download: (id: number, asset?: string) => client.get(`/admin/laporan/akhir/${id}/unduh`, { params: asset ? { asset } : undefined, responseType: 'blob' }),
      },
    },

    reports: {
      index: (params?: Record<string, unknown>) => client.get('/admin/laporan/akhir', { params }),
    },

    users: {
      index: (params?: Record<string, unknown>) => client.get('/admin/pengguna', { params }),
      show: (id: number) => client.get(`/admin/pengguna/${id}`),
      store: (data: Record<string, unknown>) => client.post('/admin/pengguna', data),
      update: (id: number, data: Record<string, unknown>) => client.patch(`/admin/pengguna/${id}`, data),
      toggleStatus: (id: number) => client.patch(`/admin/pengguna/${id}/ubah-status`),
      updateRole: (id: number, data: { role: string }) => client.patch(`/admin/pengguna/${id}/role`, data),
      resetPassword: (id: number) => client.post(`/admin/pengguna/${id}/reset-password`),
      students: (params?: Record<string, unknown>) => client.get('/admin/mahasiswa', { params }),
      lecturers: (params?: Record<string, unknown>) => client.get('/admin/dosen', { params }),
    },

    grades: {
      index: (params?: Record<string, unknown>) => client.get('/admin/nilai', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/nilai', data),
      reports: (params?: Record<string, unknown>) => client.get('/admin/grade-reports', { params }),
      finalize: (id: number) => client.patch(`/admin/grade-reports/${id}/finalize`),
      finalizeMass: (ids: number[], periodeId: number) => client.post('/admin/grade-reports/finalize-mass', { ids, periode_id: periodeId }),
      export: (params?: Record<string, unknown>) => client.get('/admin/grade-reports/export', { params, responseType: 'blob' }),
      exportLedger: (params?: Record<string, unknown>) => client.get('/admin/grade-reports/export-ledger', { params, responseType: 'blob' }),
      certificateProgress: (params?: Record<string, unknown>) => client.get('/admin/grade-reports/certificate-progress', { params }),
      finalizeProgress: (params?: Record<string, unknown>) => client.get('/admin/grade-reports/finalisasi-progres', { params }),
      downloadCertificate: (id: number) => client.get(`/admin/grade-reports/${id}/sertifikat`, { responseType: 'blob' }),
      previewCertificate: (id: number) => client.get(`/admin/grade-reports/${id}/preview-sertifikat`),
      bulkCertificates: (data: { periode_id: number; ids?: number[] }) => client.post('/admin/grade-reports/sertifikat-massal', data),
      bulkDownload: (periodeId: number) => client.get('/admin/grade-reports/bulk-download', { params: { periode_id: periodeId }, responseType: 'blob' }),
      konfigurasi: () => client.get('/admin/konfigurasi-penilaian'),
      updateKonfigurasi: (data: Record<string, unknown>) => client.patch('/admin/konfigurasi-penilaian', data),
    },

    generatorNilai: {
      index: (params?: Record<string, unknown>) => client.get('/admin/generator-nilai', { params }),
      studentsAll: (params?: Record<string, unknown>) => client.get('/admin/generator-nilai/kelompok/semua/mahasiswa', { params }),
      students: (kelompokId: number) => client.get(`/admin/generator-nilai/kelompok/${kelompokId}/mahasiswa`),
      saveScores: (data: Record<string, unknown>) => client.post('/admin/generator-nilai/skor', data),
      exportExcel: (kelompokId: number) => client.get(`/admin/generator-nilai/ekspor/${kelompokId}`, { responseType: 'blob' }),
      exportPdf: (kelompokId: number) => client.get(`/admin/generator-nilai/ekspor-pdf/${kelompokId}`, { responseType: 'blob' }),
      exportZip: (periodeId: number) => client.get('/admin/generator-nilai/ekspor-zip', { params: { periode_id: periodeId }, responseType: 'blob' }),
    },

    dispensasi: {
      index: (params?: Record<string, unknown>) => client.get('/admin/dispensasi', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/dispensasi', data),
      destroy: (id: number) => client.delete(`/admin/dispensasi/${id}`),
    },

    yudisium: {
      index: (params?: Record<string, unknown>) => client.get('/admin/yudisium', { params }),
      proses: (data: Record<string, unknown>) => client.post('/admin/yudisium/proses', data),
    },

    rekapitulasi: {
      index: (params?: Record<string, unknown>) => client.get('/admin/rekapitulasi', { params }),
    },

    evaluasiDpl: {
      index: (params?: Record<string, unknown>) => client.get('/admin/evaluasi-dpl', { params }),
      show: (dosenId: number) => client.get(`/admin/evaluasi-dpl/${dosenId}`),
      export: (params?: Record<string, unknown>) => client.get('/admin/evaluasi-dpl/export', { params, responseType: 'blob' }),
    },

    dplAssignment: {
      index: (params?: Record<string, unknown>) => client.get('/admin/dosen/penugasan', { params }),
      assignToPeriod: (data: Record<string, unknown>) => client.post('/admin/dosen/tugaskan-periode', data),
      assignToGroup: (groupId: number, data: Record<string, unknown>) => client.post(`/admin/dosen/tugaskan-kelompok/${groupId}`, data),
      assignDistrict: (data: Record<string, unknown>) => client.post('/admin/dosen/tugaskan-wilayah', data),
      import: (data: FormData) => client.post('/admin/dosen/import', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      removeDplFromPeriod: (dplPeriodId: number) => client.patch(`/admin/dosen/lepas-periode/${dplPeriodId}`),
      removeDistrict: (id: number) => client.patch(`/admin/dosen/lepas-wilayah/${id}`),
      availableDpl: (params?: Record<string, unknown>) => client.get('/admin/available-dpl', { params }),
    },

    eligibility: {
      index: (params?: Record<string, unknown>) => client.get('/admin/audit-kualifikasi', { params }),
      export: (params?: Record<string, unknown>) => client.get('/admin/audit-kualifikasi/export', { params, responseType: 'blob' }),
      check: (mahasiswaId: number) => client.get(`/admin/audit-kualifikasi/${mahasiswaId}/periksa`),
      bulkUpdateSks: (data: Record<string, unknown>) => client.post('/admin/audit-kualifikasi/bulk-update-sks', data),
    },

    peserta: {
      transfer: (data: Record<string, unknown>) => client.post('/admin/peserta/pindah', data),
      transferTargets: (params?: Record<string, unknown>) => client.get('/admin/peserta/transfer-targets', { params }),
      exportBiodata: (params?: Record<string, unknown>) => client.get('/admin/pendaftaran/export-biodata', { params }),
      exportBpjs: (params?: Record<string, unknown>) => client.get('/admin/pendaftaran/export-bpjs', { params }),
      downloadDocument: (path: string) => client.get('/admin/pendaftaran/berkas/unduh', { params: { path } }),
      makeLeader: (id: number) => client.post(`/admin/pendaftaran/${id}/make-leader`),

    },

    sync: {
      mahasiswaIndex: () => client.get('/admin/mahasiswa/sinkron'),
      mahasiswaSync: (data?: Record<string, unknown>) => client.post('/admin/mahasiswa/sinkron', data),
      dosenIndex: () => client.get('/admin/dosen/sinkron'),
      dosenSync: (data?: Record<string, unknown>) => client.post('/admin/dosen/sinkron', data),
    },

    /**
     * Superadmin-triggered SIAKAD sync with pg_dump backup in front.
     * Mirrors POST /api/v1/admin/sync/* routes. Superadmin-only at the
     * route level — faculty/admin will get 403.
     */
    siakadSync: {
      backup: (data?: { keep_days?: number }) => client.post('/admin/sync/backup', data),
      runWithBackup: (data?: {
        type?: 'all' | 'mahasiswa' | 'dosen' | 'fakultas' | 'program';
        delta?: boolean;
        source?: 'api' | 'db';
        keep_days?: number;
      }) => client.post('/admin/sync/run-with-backup', data),
    },

    /**
     * Field-lock inspection + release (manually_edited_fields registry).
     * Locks are created automatically when admin approves a profile
     * change; release is needed only when SIAKAD has been corrected
     * upstream. Mahasiswa locks cannot be released once the student
     * is in a KKN group — backend enforces this, UI must disable the
     * button accordingly.
     */
    locks: {
      mahasiswa: (id: number) => client.get(`/admin/mahasiswa/${id}/locks`),
      unlockMahasiswaField: (id: number, field: string, scope: 'mahasiswa' | 'user' = 'mahasiswa') =>
        client.patch(`/admin/mahasiswa/${id}/unlock-field`, { field, scope }),
      dosen: (id: number) => client.get(`/admin/dosen/${id}/locks`),
      unlockDosenField: (id: number, field: string, scope: 'dosen' | 'user' = 'dosen') =>
        client.patch(`/admin/dosen/${id}/unlock-field`, { field, scope }),
    },

    /**
     * Admin broadcast notifications — POST /admin/notifications/broadcast.
     * Requires superadmin role (enforced at route level). Fires
     * GenericNotification which respects each user's channel preferences.
     */
    notifications: {
      broadcast: (data: {
        title: string;
        message: string;
        priority?: 'info' | 'success' | 'warning' | 'danger';
        action?: string;
        type?: string;
        target: 'all' | string; // 'all' | 'role:<role>' | 'fakultas:<id>' | 'user_ids'
        user_ids?: number[];
      }) => client.post('/admin/notifications/broadcast', data),
    },

    dataImport: {
      dosenData: (data: FormData) => client.post('/admin/import/dosen-data', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      nilaiKknHistoris: (data: FormData) => client.post('/admin/import/nilai-kkn-historis', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
    databaseSync: {
      index: () => client.get('/admin/database-sync'),
      health: () => client.get('/admin/database-sync/health'),
      statistics: () => client.get('/admin/database-sync/statistics'),
      retry: (data?: Record<string, unknown> | number) => typeof data === 'number'
        ? client.post(`/admin/database-sync/retry/${data}`)
        : client.post('/admin/database-sync/retry', data),
      retryLog: (logId: number) => client.post(`/admin/database-sync/retry/${logId}`),
      cleanup: () => client.post('/admin/database-sync/cleanup'),
      testConnection: () => client.post('/admin/database-sync/test-connection'),
      manualSync: (data: Record<string, unknown>) => client.post('/admin/database-sync/manual', data),
      show: (logId: number) => client.get(`/admin/database-sync/logs/${logId}`),
      showLog: (logId: number) => client.get(`/admin/database-sync/logs/${logId}`),
    },

    activityAudit: {
      index: (params?: Record<string, unknown>) => client.get('/admin/auditor-aktivitas', { params }),
    },

    downloads: {
      index: (params?: Record<string, unknown>) => client.get('/admin/unduhan', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/unduhan', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/unduhan/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/unduhan/${id}`),
    },

    publicContent: {
      profil: () => client.get('/admin/konten-publik/profil'),
      updateProfil: (data: Record<string, unknown>) => client.patch('/admin/konten-publik/profil', data),
      schemes: () => client.get('/admin/konten-publik/skema'),
      updateSchemes: (data: Record<string, unknown>) => client.patch('/admin/konten-publik/skema', data),
    },

    profileChangeRequests: {
      index: (params?: Record<string, unknown>) => client.get('/admin/profile-change-requests', { params }),
      approve: (id: number) => client.patch(`/admin/profile-change-requests/${id}/approve`),
      reject: (id: number, data: { rejection_reason: string }) => client.patch(`/admin/profile-change-requests/${id}/reject`, data),
    },

    announcements: {
      index: (params?: Record<string, unknown>) => client.get('/admin/warta-utama', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/warta-utama', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/warta-utama/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/warta-utama/${id}`),
      /**
       * Multipart variants — use these when creating/updating with an image or
       * file attachment. Laravel can't parse multipart PUT directly, so
       * updateWithMedia uses POST + `_method=PUT` spoofing which the framework
       * transparently rewrites into the update route.
       */
      storeWithMedia: (data: FormData) => client.post('/admin/warta-utama', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      updateWithMedia: (id: number, data: FormData) => {
        data.append('_method', 'PUT');
        return client.post(`/admin/warta-utama/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      },
      /**
       * Typed list helpers — filter by content-type saat butuh tab/split UI.
       *   type='berita'      → semua kategori selain PENGUMUMAN
       *   type='pengumuman'  → kategori PENGUMUMAN only
       */
      indexByType: (type: 'berita' | 'pengumuman', params?: Record<string, unknown>) =>
        client.get('/admin/warta-utama', { params: { ...params, type } }),
    },

    settings: {
      index: () => client.get('/admin/pengaturan/sistem'),
      update: (data: Record<string, unknown>) => client.patch('/admin/pengaturan/sistem', data),
      aiConfig: () => client.get('/admin/pengaturan/sistem/ai/config'),
      testAi: () => client.post('/admin/pengaturan/sistem/ai/test'),
      updateAi: (data: Record<string, unknown>) => client.patch('/admin/pengaturan/sistem/ai/update', data),
      certificates: () => client.get('/admin/pengaturan/sertifikat'),
      resetPendaftaran: (data: { confirmation: string; soft?: boolean }) =>
        client.post('/admin/pengaturan/sistem/reset-pendaftaran', data),
    },

    monitoring: {
      overview: () => client.get('/admin/monitoring/overview'),
      alerts: () => client.get('/admin/monitoring/alerts'),
      triggerCheck: () => client.post('/admin/monitoring/trigger-check'),
    },

    auditLog: {
      index: (params?: Record<string, unknown>) => client.get('/admin/audit-log', { params }),
      show: (id: number) => client.get(`/admin/audit-log/${id}`),
    },

    workshops: {
      index: (params?: Record<string, unknown>) => client.get('/admin/workshops', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/workshops', data),
      update: (id: number, data: Record<string, unknown>) => client.patch(`/admin/workshops/${id}`, data),
      cancel: (id: number) => client.patch(`/admin/workshops/${id}/cancel`),
      markAttendance: (id: number, data: { user_ids: number[] }) => client.post(`/admin/workshops/${id}/mark-attendance`, data),
      exportParticipants: (id: number) => client.get(`/admin/workshops/${id}/participants/export`),
      importPeserta: (workshopId: number, data: FormData) => client.post(`/admin/workshops/${workshopId}/import-peserta`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
      downloadPesertaTemplate: () => client.get('/admin/workshops/template-peserta', { responseType: 'blob' }),
      importMetodologiPkm: (data: FormData) => client.post('/admin/workshops/import-metodologi-pkm', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    },
  };
}

export function profileEndpoints(client: AxiosInstance) {
  return {
    get: () => client.get('/profile'),
    update: (data: Record<string, unknown>) => client.patch('/profile', data),
    updateAvatar: (data: FormData) => client.post('/profile/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    // Keep password change on POST as a compatibility path for gateways that
    // still block PATCH before the request reaches the origin.
    changePassword: (data: Record<string, unknown>) => client.post('/profile/password', data),
    notificationPreferences: () => client.get('/profile/notification-preferences'),
    updateNotificationPreferences: (data: Record<string, unknown>) => client.patch('/profile/notification-preferences', data),
  };
}

export function publicEndpoints(client: AxiosInstance) {
  return {
    home: () => client.get('/public/home'),
    announcements: (page = 1) => client.get(`/public/announcements?page=${page}`),
    announcement: (slug: string) => client.get(`/public/announcements/${slug}`),
    berita: (page = 1) => client.get(`/public/berita?page=${page}`),
    pengumuman: (page = 1) => client.get(`/public/pengumuman?page=${page}`),
    downloads: () => client.get('/public/downloads'),
    locations: () => client.get('/public/locations'),
    popupAnnouncement: () => client.get('/public/popup-announcement'),
    certificate: (token: string) => client.get(`/public/verify-certificate/${token}`),
  };
}

export function notificationsEndpoints(client: AxiosInstance) {
  return {
    /**
     * GET /notifications
     * Paginated list (read + unread) for the full history view.
     */
    index: (params?: {
      status?: 'all' | 'read' | 'unread';
      priority?: 'info' | 'success' | 'warning' | 'danger';
      type?: string;
      date_from?: string;
      date_to?: string;
      per_page?: number;
      page?: number;
    }) => client.get('/notifications', { params }),

    /**
     * GET /notifications/unread
     * Returns unread notifications count + latest list.
     */
    unread: (params?: { limit?: number }) => client.get('/notifications/unread', { params }),

    /**
     * POST /notifications/{id}/read — mark a single notification as read.
     */
    markRead: (id: number | string) => client.post(`/notifications/${id}/read`),

    /**
     * POST /notifications/read-all — mark every unread as read.
     */
    markAllRead: () => client.post('/notifications/read-all'),

    /**
     * POST /device-tokens — register an FCM/APNs device token for push.
     */
    registerDevice: (data: { token: string; platform: 'android' | 'ios' }) =>
      client.post('/device-tokens', data),
  };
}

export function attendanceEndpoints(client: AxiosInstance) {
  return {
    index: (params?: Record<string, unknown>) => client.get('/attendance', { params }),
    store: (data: Record<string, unknown>) => client.post('/attendance', data),
    show: (id: number) => client.get(`/attendance/${id}`),
    syncStatus: () => client.get('/attendance/sync-status'),
    retrySync: () => client.post('/attendance/retry-sync'),
  };
}

export function serverTimeEndpoints(client: AxiosInstance) {
  return {
    get: () => client.get('/server-time'),
  };
}

export function periodContextEndpoints(client: AxiosInstance) {
  return {
    get: () => client.get('/period-context'),
  };
}
