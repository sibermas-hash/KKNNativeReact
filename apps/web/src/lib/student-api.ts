import { api } from './api';

export interface PeriodOption {
  id: number;
  name: string;
  program_type: string | null;
  self_service_enabled: boolean;
  registration?: {
    id: number;
    status: string;
    notes: string | null;
    rejection_reason?: string | null;
  } | null;
  kelompok?: Array<{
    id: number;
    nama_kelompok: string;
    lokasi?: { full_name: string };
    capacity: number;
    peserta_count: number;
    remaining_seats: number;
    requires_more_male_members?: boolean;
  }>;
  document_requirements?: Array<{
    field: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  requirement_info?: {
    requirements: Array<{ label: string; met: boolean }>;
  };
}

export async function getStudentPeriods(): Promise<PeriodOption[]> {
  const res = await api.get('/student/periods');
  return (res as any)?.data || [];
}

export async function getStudentAcademic() {
  const res = await api.get('/student/academic');
  return (res as any)?.data || null;
}

export async function getStudentProfile() {
  const res = await api.get('/student/profile');
  return (res as any)?.data || null;
}

export async function getStudentDomicile() {
  const res = await api.get('/student/domicile');
  return (res as any)?.data || null;
}
