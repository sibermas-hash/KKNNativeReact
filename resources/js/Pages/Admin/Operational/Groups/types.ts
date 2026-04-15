import type { PaginationMeta } from '@/Components/ui/Pagination';

export interface Group {
  id: number;
  code: string;
  name: string;
  capacity: number;
  status: string;
  registrations_count: number;
  approved_participants_count: number;
  pending_participants_count: number;
  available_slots: number;
  ready_for_placement: boolean;
  placement_note: string;
  period?: { id: number; name: string } | null;
  location?: {
    id: number;
    village_name: string;
    district_name?: string | null;
    regency_name?: string | null;
    full_name: string;
  } | null;
  main_lecturer?: { id: number; name: string } | null;
}

export interface Summary {
  total_groups: number;
  active_groups: number;
  draft_groups: number;
  groups_without_main_lecturer: number;
  groups_ready_for_placement: number;
  total_available_slots: number;
}

export interface Props {
  groups: { data: Group[]; meta: PaginationMeta };
  periods: Array<{ id: number; name: string }>;
  locations: Array<{ id: number; village_name: string; full_name: string }>;
  lecturers: Array<{ id: number; name: string }>;
  filters: { search?: string; period_id?: string | number; status?: string };
  ui?: { can_manage?: boolean };
  summary: Summary;
}

export type GroupFormData = {
  period_id: string;
  location_id: string;
  lead_lecturer_id: string;
  name: string;
  capacity: string;
  status: 'draft' | 'active' | 'closed';
};
