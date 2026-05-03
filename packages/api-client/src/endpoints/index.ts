import type { AxiosInstance } from 'axios';

export function authEndpoints(client: AxiosInstance) {
  return {
    captcha: () => client.get('/auth/captcha'),
    login: (data: { login: string; password: string; captcha_id: string; captcha_answer: string; remember?: boolean }) =>
      client.post('/auth/login', data),
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
      leave: (periodeId: number) => client.delete(`/student/registration/${periodeId}`),
    },
    dailyReports: {
      index: (page = 1) => client.get(`/student/daily-reports?page=${page}`),
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
      download: (id: number) => client.get(`/student/certificates/${id}/download`),
    },
    dplEvaluation: {
      form: () => client.get('/student/dpl-evaluation/form'),
      store: (data: Record<string, unknown>) => client.post('/student/dpl-evaluation', data),
    },
    notificationShown: (id: number) => client.patch(`/student/peserta-kkn/${id}/notification-shown`),
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
    },

    registrations: {
      index: (params?: Record<string, unknown>) => client.get('/admin/pendaftaran', { params }),
      show: (id: number) => client.get(`/admin/pendaftaran/${id}`),
      approve: (id: number) => client.patch(`/admin/pendaftaran/${id}/approve`),
      reject: (id: number, data: { rejection_reason: string }) => client.patch(`/admin/pendaftaran/${id}/reject`, data),
      assignGroup: (id: number, data: { kelompok_id: number }) => client.patch(`/admin/pendaftaran/${id}/assign-group`, data),
      bulkApprove: (ids: number[]) => client.post('/admin/pendaftaran/bulk-approve', { ids }),
      bulkReject: (ids: number[], reason: string) => client.post('/admin/pendaftaran/bulk-reject', { ids, rejection_reason: reason }),
    },

    groups: {
      index: (params?: Record<string, unknown>) => client.get('/admin/kelompok', { params }),
      show: (id: number) => client.get(`/admin/kelompok/${id}`),
      store: (data: Record<string, unknown>) => client.post('/admin/kelompok', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/kelompok/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/kelompok/${id}`),
    },

    users: {
      index: (params?: Record<string, unknown>) => client.get('/admin/pengguna', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/pengguna', data),
      toggleStatus: (id: number) => client.patch(`/admin/pengguna/${id}/ubah-status`),
      resetPassword: (id: number) => client.post(`/admin/pengguna/${id}/reset-password`),
    },

    grades: {
      index: (params?: Record<string, unknown>) => client.get('/admin/nilai', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/nilai', data),
      reports: (params?: Record<string, unknown>) => client.get('/admin/grade-reports', { params }),
      finalize: (id: number) => client.patch(`/admin/grade-reports/${id}/finalize`),
      finalizeMass: (ids: number[]) => client.post('/admin/grade-reports/finalize-mass', { ids }),
    },

    announcements: {
      index: (params?: Record<string, unknown>) => client.get('/admin/warta-utama', { params }),
      store: (data: Record<string, unknown>) => client.post('/admin/warta-utama', data),
      update: (id: number, data: Record<string, unknown>) => client.put(`/admin/warta-utama/${id}`, data),
      destroy: (id: number) => client.delete(`/admin/warta-utama/${id}`),
    },

    settings: {
      index: () => client.get('/admin/pengaturan/sistem'),
      update: (data: Record<string, unknown>) => client.patch('/admin/pengaturan/sistem', data),
      aiConfig: () => client.get('/admin/pengaturan/sistem/ai/config'),
      testAi: () => client.post('/admin/pengaturan/sistem/ai/test'),
      updateAi: (data: Record<string, unknown>) => client.patch('/admin/pengaturan/sistem/ai/update', data),
    },

    auditLog: {
      index: (params?: Record<string, unknown>) => client.get('/admin/audit-log', { params }),
      show: (id: number) => client.get(`/admin/audit-log/${id}`),
    },
  };
}

export function profileEndpoints(client: AxiosInstance) {
  return {
    get: () => client.get('/profile'),
    update: (data: Record<string, unknown>) => client.patch('/profile', data),
    updateAvatar: (data: FormData) => client.post('/profile/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    changePassword: (data: Record<string, unknown>) => client.patch('/profile/password', data),
  };
}

export function publicEndpoints(client: AxiosInstance) {
  return {
    home: () => client.get('/public/home'),
    announcements: (page = 1) => client.get(`/public/announcements?page=${page}`),
    announcement: (slug: string) => client.get(`/public/announcements/${slug}`),
    downloads: () => client.get('/public/downloads'),
    locations: () => client.get('/public/locations'),
    certificate: (token: string) => client.get(`/public/verify-certificate/${token}`),
  };
}

export function notificationsEndpoints(client: AxiosInstance) {
  return {
    registerDevice: (data: Record<string, unknown>) => client.post('/device-tokens', data),
  };
}

export function periodContextEndpoints(client: AxiosInstance) {
  return {
    get: () => client.get('/period-context'),
  };
}
