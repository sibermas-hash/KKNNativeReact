import { usePage } from '@inertiajs/react';
import {
  type LucideIcon,
  LayoutDashboard,
  Users,
  FileText,
  Star,
  FileSpreadsheet,
  UserCircle,
  Settings,
  Bell,
} from 'lucide-react';
import type { PageProps } from '@/types';

export type UserRole = 'superadmin' | 'faculty_admin' | 'dpl' | 'mahasiswa';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const useDashboardData = () => {
  const { auth } = usePage<PageProps>().props;
  const userRoles = auth.user?.roles ?? [];

  // Ambil role utama dari user (prioritas: superadmin > faculty_admin > dpl > mahasiswa)
  const rolePriority: UserRole[] = ['superadmin', 'faculty_admin', 'dpl', 'mahasiswa'];
  const userRole = rolePriority.find((role) => userRoles.includes(role)) as UserRole | undefined;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Selamat Pagi' : hour < 18 ? 'Selamat Siang' : 'Selamat Malam';
    return `${greeting}, ${auth.user?.name ?? 'User'}`;
  };

  const getDashboardConfig = () => {
    switch (userRole) {
      case 'superadmin':
        return {
          title: 'Pusat Komando Admin',
          primaryColor: 'emerald',
          widgets: ['stats_total', 'recent_registrations', 'system_health', 'pending_approvals'],
        };
      case 'faculty_admin':
        return {
          title: 'Panel Kendali Fakultas',
          primaryColor: 'blue',
          widgets: ['stats_faculty', 'faculty_students', 'faculty_groups'],
        };
      case 'dpl':
        return {
          title: 'Portal Bimbingan DPL',
          primaryColor: 'indigo',
          widgets: ['stats_groups', 'daily_reports_pending', 'evaluation_status'],
        };
      case 'mahasiswa':
        return {
          title: 'Ruang Kerja Mahasiswa',
          primaryColor: 'emerald',
          widgets: ['registration_status', 'daily_report_tracking', 'proker_status'],
        };
      default:
        return {
          title: 'Dashboard',
          primaryColor: 'slate',
          widgets: [],
        };
    }
  };

  return {
    user: auth.user,
    role: userRole,
    welcomeMessage: getWelcomeMessage(),
    config: getDashboardConfig(),
    isRegistrationLocked: !!auth.user?.student_registration_locked,
  };
};
