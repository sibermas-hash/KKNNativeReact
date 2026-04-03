export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  faculty?: Faculty | null;
  roles?: string[];
  permissions?: string[];
  profile?: UserProfile;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
}

export interface UserProfile {
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface Student {
  id: number;
  user_id: number;
  nim: string;
  name: string;
  faculty: Faculty;
  program: Program;
  batch_year: number;
  gender: 'L' | 'P';
}

export interface Lecturer {
  id: number;
  user_id: number;
  nip: string;
  name: string;
  faculty: Faculty;
}

export interface Faculty {
  id: number;
  code: string;
  name: string;
}

export interface Program {
  id: number;
  faculty_id: number;
  code: string;
  name: string;
}

export interface Period {
  id: number;
  academic_year: AcademicYear;
  angkatan: number;
  jenis: string;
  name: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  kuota: number;
  is_active: boolean;
}

export interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

export interface Group {
  id: number;
  period: Period;
  location: Location;
  lecturer?: Lecturer;
  code: string;
  name: string;
  token?: string;
  capacity: number;
  status: 'draft' | 'active' | 'closed';
}

export interface Location {
  id: number;
  village_name: string;
  district_name?: string | null;
  regency_name?: string | null;
  full_name?: string;
  address?: string;
  capacity: number;
}

export interface Registration {
  id: number;
  student: Student;
  period: Period;
  group?: Group;
  status: 'pending' | 'document_submitted' | 'approved' | 'rejected' | 'completed';
  registration_date: string;
  documents: RegistrationDocument[];
}

export interface RegistrationDocument {
  id: number;
  document_type: string;
  file_path: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DailyReport {
  id: number;
  student: Student;
  group: Group;
  date: string;
  title: string;
  activity: string;
  output?: string;
  status: 'draft' | 'submitted' | 'approved' | 'revision';
  files: DailyReportFile[];
}

export interface DailyReportFile {
  id: number;
  file_path: string;
  file_name: string;
}

export interface WorkProgram {
  id: number;
  group: Group;
  title: string;
  description?: string;
  objectives?: string;
  target_participants?: number;
  budget: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
}

export interface FinalReport {
  id: number;
  student: Student;
  group: Group;
  title: string;
  abstract?: string;
  file_path?: string;
  file_name?: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'revision';
  score?: number;
}

export interface Evaluation {
  id: number;
  student: Student;
  group: Group;
  evaluator_type: 'dpl' | 'peer' | 'community';
  total_score?: number;
  grade?: string;
  notes?: string;
  items: EvaluationItem[];
}

export interface EvaluationItem {
  id: number;
  criterion: string;
  score: number;
  weight: number;
  notes?: string;
}

// Utility: checks if user has a specific role
export function hasRole(user: User | null | undefined, role: string): boolean {
  return user?.roles?.includes(role) ?? false;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  auth: {
    user: User | null;
  };
  flash?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    captcha_question?: string;
  };
  errors?: Record<string, string>;
} & T;
