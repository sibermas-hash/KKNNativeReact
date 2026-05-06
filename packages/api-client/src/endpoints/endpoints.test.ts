/**
 * Frontend API Client — Integration Contract Test
 *
 * Memverifikasi bahwa semua fungsi endpoint di api-client:
 * 1. Dapat diinstansiasi tanpa error
 * 2. Memanggil URL yang benar (path sesuai backend routes)
 * 3. Menggunakan HTTP method yang benar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  createWebClient,
  authEndpoints,
  studentEndpoints,
  dplEndpoints,
  dosenEndpoints,
  adminEndpoints,
  profileEndpoints,
  publicEndpoints,
  notificationsEndpoints,
  periodContextEndpoints,
  attendanceEndpoints,
  serverTimeEndpoints,
} from '../index';

// ─── Setup mock axios ─────────────────────────────────────────────────────────

const mockRequest = vi.fn().mockResolvedValue({ data: { data: {} } });

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      create: () => {
        const instance = {
          get: (url: string, config?: object) => mockRequest('GET', url, config),
          post: (url: string, data?: unknown, config?: object) => mockRequest('POST', url, data, config),
          put: (url: string, data?: unknown, config?: object) => mockRequest('PUT', url, data, config),
          patch: (url: string, data?: unknown, config?: object) => mockRequest('PATCH', url, data, config),
          delete: (url: string, config?: object) => mockRequest('DELETE', url, config),
          interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
          },
        };
        return instance;
      },
    },
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClient() {
  return createWebClient('http://localhost/api/v1');
}

function lastCall() {
  return mockRequest.mock.calls[mockRequest.mock.calls.length - 1];
}

beforeEach(() => mockRequest.mockClear());

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

describe('authEndpoints', () => {
  const auth = () => authEndpoints(getClient());

  it('captcha → GET /auth/captcha', () => {
    auth().captcha();
    expect(lastCall()).toEqual(['GET', '/auth/captcha', undefined]);
  });

  it('login → POST /auth/login', () => {
    const data = { login: 'a', password: 'b', captcha_id: 'c', captcha_answer: '1' };
    auth().login(data);
    expect(lastCall()[0]).toBe('POST');
    expect(lastCall()[1]).toBe('/auth/login');
  });

  it('logout → POST /auth/logout', () => {
    auth().logout();
    expect(lastCall()).toEqual(['POST', '/auth/logout', undefined, undefined]);
  });

  it('user → GET /auth/user', () => {
    auth().user();
    expect(lastCall()).toEqual(['GET', '/auth/user', undefined]);
  });

  it('forgotPassword → POST /auth/lupa-kata-sandi', () => {
    auth().forgotPassword({ email: 'x@x.com' });
    expect(lastCall()[1]).toBe('/auth/lupa-kata-sandi');
  });

  it('resetPassword → POST /auth/atur-ulang-kata-sandi', () => {
    auth().resetPassword({ token: 't', email: 'e', password: 'p', password_confirmation: 'p' });
    expect(lastCall()[1]).toBe('/auth/atur-ulang-kata-sandi');
  });
});

// ─── Profile Endpoints ────────────────────────────────────────────────────────

describe('profileEndpoints', () => {
  const profile = () => profileEndpoints(getClient());

  it('get → GET /profile', () => {
    profile().get();
    expect(lastCall()).toEqual(['GET', '/profile', undefined]);
  });

  it('update → PATCH /profile', () => {
    profile().update({});
    expect(lastCall()[0]).toBe('PATCH');
    expect(lastCall()[1]).toBe('/profile');
  });

  it('updateAvatar → POST /profile/avatar', () => {
    profile().updateAvatar(new FormData());
    expect(lastCall()[1]).toBe('/profile/avatar');
  });

  it('changePassword → PATCH /profile/password', () => {
    profile().changePassword({});
    expect(lastCall()[1]).toBe('/profile/password');
  });
});

// ─── Period Context ───────────────────────────────────────────────────────────

describe('periodContextEndpoints', () => {
  it('get → GET /period-context', () => {
    periodContextEndpoints(getClient()).get();
    expect(lastCall()).toEqual(['GET', '/period-context', undefined]);
  });
});

// ─── Public Endpoints ─────────────────────────────────────────────────────────

describe('publicEndpoints', () => {
  const pub = () => publicEndpoints(getClient());

  it('home → GET /public/home', () => {
    pub().home();
    expect(lastCall()[1]).toBe('/public/home');
  });

  it('announcements → GET /public/announcements', () => {
    pub().announcements();
    expect(lastCall()[1]).toContain('/public/announcements');
  });

  it('announcement → GET /public/announcements/{slug}', () => {
    pub().announcement('test-slug');
    expect(lastCall()[1]).toBe('/public/announcements/test-slug');
  });

  it('locations → GET /public/locations', () => {
    pub().locations();
    expect(lastCall()[1]).toBe('/public/locations');
  });

  it('downloads → GET /public/downloads', () => {
    pub().downloads();
    expect(lastCall()[1]).toBe('/public/downloads');
  });

  it('certificate → GET /public/verify-certificate/{token}', () => {
    pub().certificate('abc123');
    expect(lastCall()[1]).toBe('/public/verify-certificate/abc123');
  });
});

// ─── Notifications Endpoints ──────────────────────────────────────────────────

describe('notificationsEndpoints', () => {
  it('registerDevice → POST /device-tokens', () => {
    notificationsEndpoints(getClient()).registerDevice({ token: 'x' });
    expect(lastCall()[1]).toBe('/device-tokens');
  });
});

// ─── Student Endpoints ────────────────────────────────────────────────────────

describe('studentEndpoints', () => {
  const s = () => studentEndpoints(getClient());

  it('dashboard → GET /student/dashboard', () => {
    s().dashboard();
    expect(lastCall()[1]).toBe('/student/dashboard');
  });

  it('registration.form → GET /student/registration/form', () => {
    s().registration.form();
    expect(lastCall()[1]).toBe('/student/registration/form');
  });

  it('registration.status → GET /student/registration/status', () => {
    s().registration.status();
    expect(lastCall()[1]).toBe('/student/registration/status');
  });

  it('registration.store → POST /student/registration', () => {
    s().registration.store({ periode_id: 1 });
    expect(lastCall()[1]).toBe('/student/registration');
  });

  it('registration.leave → DELETE /student/registration/{id}', () => {
    s().registration.leave(1);
    expect(lastCall()[1]).toBe('/student/registration/1');
  });

  it('dailyReports.index → GET /student/daily-reports', () => {
    s().dailyReports.index();
    expect(lastCall()[1]).toBe('/student/daily-reports');
  });

  it('dailyReports.store → POST /student/daily-reports', () => {
    s().dailyReports.store(new FormData());
    expect(lastCall()[1]).toBe('/student/daily-reports');
  });

  it('dailyReports.update → PUT /student/daily-reports/{id}', () => {
    s().dailyReports.update(5, new FormData());
    expect(lastCall()[1]).toBe('/student/daily-reports/5');
  });

  it('dailyReports.destroy → DELETE /student/daily-reports/{id}', () => {
    s().dailyReports.destroy(5);
    expect(lastCall()[1]).toBe('/student/daily-reports/5');
  });

  it('workPrograms.index → GET /student/work-programs', () => {
    s().workPrograms.index();
    expect(lastCall()[1]).toBe('/student/work-programs');
  });

  it('workshops.attend → POST /student/workshops/{id}/attend', () => {
    s().workshops.attend(3, { token: 't', latitude: 0, longitude: 0, device_signature: 'd' });
    expect(lastCall()[1]).toBe('/student/workshops/3/attend');
  });

  it('posko.show → GET /student/posko', () => {
    s().posko.show();
    expect(lastCall()[1]).toBe('/student/posko');
  });

  it('domisili.show → GET /student/domisili', () => {
    s().domisili.show();
    expect(lastCall()[1]).toBe('/student/domisili');
  });

  it('certificates.index → GET /student/certificates', () => {
    s().certificates.index();
    expect(lastCall()[1]).toBe('/student/certificates');
  });

  it('certificates.download → GET /student/certificates/{id}/download', () => {
    s().certificates.download(2);
    expect(lastCall()[1]).toBe('/student/certificates/2/download');
  });
});

// ─── DPL Endpoints ───────────────────────────────────────────────────────────

describe('dplEndpoints', () => {
  const d = () => dplEndpoints(getClient());

  it('dashboard → GET /dpl/dashboard', () => {
    d().dashboard();
    expect(lastCall()[1]).toBe('/dpl/dashboard');
  });

  it('groups.index → GET /dpl/groups', () => {
    d().groups.index();
    expect(lastCall()[1]).toBe('/dpl/groups');
  });

  it('dailyReports.approve → PATCH /dpl/daily-reports/{id}/approve', () => {
    d().dailyReports.approve(1);
    expect(lastCall()[1]).toBe('/dpl/daily-reports/1/approve');
  });

  it('dailyReports.batchApprove → POST /dpl/daily-reports/batch-approve', () => {
    d().dailyReports.batchApprove([1, 2]);
    expect(lastCall()[1]).toBe('/dpl/daily-reports/batch-approve');
  });

  it('evaluations.store → POST /dpl/evaluations', () => {
    d().evaluations.store({});
    expect(lastCall()[1]).toBe('/dpl/evaluations');
  });

  it('finalReports.approve → PATCH /dpl/final-reports/{id}/approve', () => {
    d().finalReports.approve(1);
    expect(lastCall()[1]).toBe('/dpl/final-reports/1/approve');
  });

  it('leaveRequests.approve → PATCH /dpl/leave-requests/{id}/approve', () => {
    d().leaveRequests.approve(1);
    expect(lastCall()[1]).toBe('/dpl/leave-requests/1/approve');
  });

  it('leaveRequests.reject → PATCH /dpl/leave-requests/{id}/reject', () => {
    d().leaveRequests.reject(1, { rejection_reason: 'x' });
    expect(lastCall()[1]).toBe('/dpl/leave-requests/1/reject');
  });

  it('feedback → GET /dpl/feedback', () => {
    d().feedback();
    expect(lastCall()[1]).toBe('/dpl/feedback');
  });
});

// ─── Dosen Endpoints ─────────────────────────────────────────────────────────

describe('dosenEndpoints', () => {
  it('dashboard → GET /dosen/dashboard', () => {
    dosenEndpoints(getClient()).dashboard();
    expect(lastCall()[1]).toBe('/dosen/dashboard');
  });
});

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

describe('adminEndpoints', () => {
  const a = () => adminEndpoints(getClient());

  it('hub → GET /admin/hub', () => {
    a().hub();
    expect(lastCall()[1]).toBe('/admin/hub');
  });

  it('switchPhase → POST /admin/dashboard/switch-phase', () => {
    a().switchPhase({ periode_id: 1, phase: 'execution' });
    expect(lastCall()[1]).toBe('/admin/dashboard/switch-phase');
  });

  it('periods.index → GET /admin/periode', () => {
    a().periods.index();
    expect(lastCall()[1]).toBe('/admin/periode');
  });

  it('periods.duplicate → POST /admin/periode/{id}/duplicate', () => {
    a().periods.duplicate(1);
    expect(lastCall()[1]).toBe('/admin/periode/1/duplicate');
  });

  it('registrations.approve → PATCH /admin/pendaftaran/{id}/approve', () => {
    a().registrations.approve(1);
    expect(lastCall()[1]).toBe('/admin/pendaftaran/1/approve');
  });

  it('registrations.bulkApprove → POST /admin/pendaftaran/bulk-approve', () => {
    a().registrations.bulkApprove([1, 2]);
    expect(lastCall()[1]).toBe('/admin/pendaftaran/bulk-approve');
  });

  it('dpl.registrations → GET /admin/dosen/pendaftaran-dpl', () => {
    a().dpl.registrations();
    expect(lastCall()[1]).toBe('/admin/dosen/pendaftaran-dpl');
  });

  it('dpl.approve → PATCH /admin/dosen/pendaftaran-dpl/{id}/setujui', () => {
    a().dpl.approve(1);
    expect(lastCall()[1]).toBe('/admin/dosen/pendaftaran-dpl/1/setujui');
  });

  it('dpl.assignments → GET /admin/dosen/penugasan', () => {
    a().dpl.assignments();
    expect(lastCall()[1]).toBe('/admin/dosen/penugasan');
  });

  it('grades.finalizeMass → POST /admin/grade-reports/finalize-mass', () => {
    a().grades.finalizeMass([1, 2]);
    expect(lastCall()[1]).toBe('/admin/grade-reports/finalize-mass');
  });

  it('settings.index → GET /admin/pengaturan/sistem', () => {
    a().settings.index();
    expect(lastCall()[1]).toBe('/admin/pengaturan/sistem');
  });

  it('settings.certificates → GET /admin/pengaturan/sertifikat', () => {
    a().settings.certificates();
    expect(lastCall()[1]).toBe('/admin/pengaturan/sertifikat');
  });

  it('auditLog.index → GET /admin/audit-log', () => {
    a().auditLog.index();
    expect(lastCall()[1]).toBe('/admin/audit-log');
  });

  it('users.toggleStatus → PATCH /admin/pengguna/{id}/ubah-status', () => {
    a().users.toggleStatus(1);
    expect(lastCall()[1]).toBe('/admin/pengguna/1/ubah-status');
  });

  it('kknOperations.finalReports.updateStatus → PATCH /admin/laporan/akhir/{id}/status', () => {
    a().kknOperations.finalReports.updateStatus(1, { status: 'approved' });
    expect(lastCall()[1]).toBe('/admin/laporan/akhir/1/status');
  });
});

// ─── Attendance Endpoints ─────────────────────────────────────────────────────

describe('attendanceEndpoints', () => {
  const att = () => attendanceEndpoints(getClient());

  it('index → GET /attendance', () => {
    att().index();
    expect(lastCall()[1]).toBe('/attendance');
  });

  it('store → POST /attendance', () => {
    att().store({});
    expect(lastCall()[1]).toBe('/attendance');
  });

  it('show → GET /attendance/{id}', () => {
    att().show(1);
    expect(lastCall()[1]).toBe('/attendance/1');
  });

  it('syncStatus → GET /attendance/sync-status', () => {
    att().syncStatus();
    expect(lastCall()[1]).toBe('/attendance/sync-status');
  });

  it('retrySync → POST /attendance/retry-sync', () => {
    att().retrySync();
    expect(lastCall()[1]).toBe('/attendance/retry-sync');
  });
});

// ─── Server Time Endpoints ────────────────────────────────────────────────────

describe('serverTimeEndpoints', () => {
  it('get → GET /server-time', () => {
    serverTimeEndpoints(getClient()).get();
    expect(lastCall()[1]).toBe('/server-time');
  });
});
