export interface Group {
  id: number;
  nama_kelompok: string;
  capacity: number;
  peserta_count: number;
  remaining_seats: number;
  lokasi?: {
    village_name?: string;
    district_name?: string;
    regency_name?: string;
    full_name?: string;
  } | null;
}

export interface PeriodRegistration {
  id: number;
  status: string;
  notes?: string | null;
  rejection_reason?: string | null;
  revision_count?: number;
  kelompok_id?: number | null;
  group?: {
    id: number;
    name: string;
    location?: {
      id: number;
      name: string;
    } | null;
  } | null;
}

export interface PeriodGuide {
  program_label?: string;
  requirements?: string[];
  governance_notes?: string[];
}

export interface PeriodOption {
  id: number;
  nama: string;
  jenis?: string | null;
  program_type?: string | null;
  program_subtype?: string | null;
  program_type_label?: string | null;
  program_subtype_label?: string | null;
  registration_mode?: string | null;
  registration_mode_label?: string | null;
  placement_mode?: string | null;
  placement_mode_label?: string | null;
  self_service_enabled?: boolean;
  guide?: PeriodGuide | null;
  registration_start: string;
  registration_end: string;
  kelompok: Group[];
  registration?: PeriodRegistration | null;
}

export interface ProfileSummary {
  is_complete: boolean;
  profile_url: string;
  missing_fields: Array<{
    key: string;
    label: string;
  }>;
}

export interface DomicileSummary extends ProfileSummary {
  is_verified: boolean;
  verified_at?: string | null;
  regency_name?: string | null;
}
