export type StudentTab =
  | 'dashboard'
  | 'events'
  | 'passes'
  | 'attendance'
  | 'certificates'
  | 'profile'
  | 'assistant'
  | 'auth';

export type AdminTab =
  | 'admin-dashboard'
  | 'admin-events'
  | 'admin-students'
  | 'admin-registrations'
  | 'admin-scanner'
  | 'admin-reports'
  | 'admin-certificates'
  | 'admin-settings';

export type NavigationTab = StudentTab | AdminTab;

export type PanelType = 'student' | 'admin';

export type AdminModuleTab =
  | 'overview'
  | 'events'
  | 'students'
  | 'registrations'
  | 'attendance'
  | 'reports'
  | 'certificates'
  | 'settings';

export interface AdminOverviewResponse {
  status: string;
  admin_user: {
    username: string;
    email: string;
    full_name: string;
    role: string;
  };
  stats: {
    total_students: number;
    verified_students: number;
    total_admins: number;
    active_events: number;
    total_registrations: number;
    total_scanned_attendances: number;
  };
  recent_students: Array<{
    id: number;
    student_id: string;
    full_name: string;
    email: string;
    department: string;
    course: string;
    academic_year: string;
    created_at: string | null;
  }>;
  modules: Record<string, string>;
}

export type EventCategory = 'All' | 'Workshop' | 'Hackathon' | 'Seminar' | 'Symposium' | 'Conference';

export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface BackendEvent {
  id: number;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  speaker: string;
  speaker_role: string;
  capacity: number;
  status: string;
  description: string;
  tags: string;
  registered_count: number;
  is_full: boolean;
  is_registered?: boolean;
  my_pass_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendRegistration {
  id: number;
  student: ApiStudentProfile;
  event: BackendEvent;
  pass_token: string;
  status: 'Confirmed' | 'Attended' | 'Cancelled';
  registered_at: string;
  updated_at?: string;
  qr_data_url?: string | null;
}

export interface BackendAttendance {
  id: number;
  registration: BackendRegistration;
  verified_at: string;
  scanned_by?: number | null;
  scanned_by_username?: string | null;
  device_info: string;
  verification_status: 'Verified' | 'Duplicate_Attempt' | 'Invalid_Token';
  notes?: string;
}

export interface BackendCertificate {
  id: number;
  student: ApiStudentProfile;
  event: BackendEvent;
  certificate_code: string;
  title: string;
  grade_or_score: string;
  issued_at: string;
  status: 'Issued' | 'Pending' | 'Revoked';
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'admin';
  first_name: string;
  last_name: string;
  is_verified: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface ApiStudentProfile {
  id: number;
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  course: string;
  academic_year: string;
  phone_number: string;
  profile_photo: string | null;
  photo_base64: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  status: string;
  message?: string;
  token: string;
  user: AuthUser;
  profile?: ApiStudentProfile | null;
  role?: string;
  is_admin?: boolean;
}

export interface StudentProfile {
  fullName: string;
  studentId: string;
  email: string;
  department: string;
  degree: string;
  semester: string;
  academicYear: string;
  collegeName: string;
  role: 'Student' | 'Admin' | 'Volunteer Organizer';
  avatarInitials: string;
  totalEventsRegistered: number;
  totalAttended: number;
  attendanceRate: number;
  phoneNumber?: string;
  photoBase64?: string;
}

export interface StatItem {
  id: string;
  title: string;
  value: string;
  subtext: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  iconName: 'calendar' | 'qr' | 'check' | 'trending' | 'users' | 'bot';
}

export interface BackendHealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  service: string;
  version: string;
  timestamp: string;
  database: {
    configured_engine: string;
    connection_status: string;
    details: string;
    note: string;
  };
  modules: Record<string, string>;
}

// Fallback legacy interfaces for mock/demo cards
export interface CollegeEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  speaker: string;
  speakerRole: string;
  capacity: number;
  registeredCount: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Registration Closed';
  description: string;
  tags: string[];
  isRegistered?: boolean;
}

export interface QRPass {
  id: string;
  eventId: string;
  eventTitle: string;
  category: string;
  studentName: string;
  studentId: string;
  passToken: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  seatInfo?: string;
  status: 'Active' | 'Used' | 'Expired';
  qrPlaceholderData: string;
}

export interface AttendanceRecord {
  id: string;
  eventTitle: string;
  category: string;
  date: string;
  checkInTime: string;
  venue: string;
  status: 'Present' | 'Late' | 'Excused';
  verificationMethod: string;
  scannedBy: string;
}
