export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  nim?: string | null;
  avatar?: string | null;
  student_registration_locked?: boolean;
  faculty?: Faculty | null;
  roles?: (string | { name: string })[];
  permissions?: string[];
  profile?: UserProfile;
  mahasiswa?: Student | null;
  dosen?: Lecturer | null;
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
  nik?: string | null;
  faculty: Faculty;
  program: Program;
  batch_year: number;
  gender: 'L' | 'P';
  health_certificate_path?: string | null;
  parent_permission_path?: string | null;
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
  program_type?: string | null;
  program_subtype?: string | null;
  registration_mode?: string | null;
  placement_mode?: string | null;
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

export interface Announcement {
  id: number;
  title: string;
  slug?: string | null;
  category: string;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  image_url?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  attachment_url?: string | null;
  is_active: boolean;
  published_at: string;
  status?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface Download {
    id: number;
    title: string;
    file_name: string | null;
    file_path: string | null;
    external_url: string | null;
    file_type: string | null;
    is_active: boolean;
    created_at: string;
}

export interface KKNScore {
  id: number;
  user_id: number;
  periode_id: number;
  nilai_dpl?: number;
  nilai_lppm?: number;
  nilai_industri?: number;
  nilai_mandiri?: number;
  weighted_score?: number;
  total_score?: number;
  grade?: string;
  letter_grade?: string;
  status?: 'draft' | 'finalized';
}

export interface CertificateChecksum {
  has_score: boolean;
  is_finalized: boolean;
  report_approved: boolean;
  min_grade: boolean;
}

export interface RouteParams {
  [key: string]: string | number | boolean | undefined;
}

export interface RouteConfig {
  only?: string[];
  exclude?: string[];
}

// Breadcrumb navigation link
export interface BreadcrumbLink {
  name: string;
  label?: string;
  url?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  active?: boolean;
}

// Lucide React Icon Component Type
export type LucideIcon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

// Color Palette Type for Dashboard Components
export type ColorPalette = {
  [key: string]: string;
};

// Dashboard Stat/Metric Props
export interface DashboardStatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}

export interface DashboardMetricProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export interface DashboardQuickLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

// Grade Form Data Types
export interface GradeScoreField {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface GradeFormData {
  [key: string]: string | number | null | undefined;
}

// Auth Error Types
export interface AuthLoginErrors {
  login?: string;
  password?: string;
  captcha_answer?: string;
  remember?: string;
}

export interface AuthResetPasswordErrors {
  token?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export type FormErrors<T extends Record<string, unknown>> = {
  [K in keyof T]?: string;
};

// Utility: checks if user has a specific role
export function hasRole(user: User | null | undefined, role: string): boolean {
  if (!user?.roles) return false;
  return user.roles.some((r) => (typeof r === 'string' ? r : r.name) === role);
}

// Utility: checks if errors object has any errors
export function hasErrors<T extends Record<string, unknown>>(errors: FormErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}

// Utility: returns array of error messages
export function getErrorMessages<T extends Record<string, unknown>>(errors: FormErrors<T>): string[] {
  return Object.values(errors).filter((err): err is string => typeof err === 'string');
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
    status?: string;
    temporary_password?: string;
    temporary_username?: string;
    captcha_question?: string;
  };
  errors?: Record<string, string>;
} & T;
