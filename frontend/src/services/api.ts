import {
  BackendHealthResponse,
  AuthResponse,
  ApiStudentProfile,
  AdminOverviewResponse,
  BackendEvent,
  BackendRegistration,
  BackendAttendance,
  BackendCertificate,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'smartattend_token';
const USER_KEY = 'smartattend_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

export async function checkBackendHealth(): Promise<{
  online: boolean;
  data?: BackendHealthResponse;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        online: false,
        error: `Backend responded with HTTP status ${response.status}`,
      };
    }

    const data: BackendHealthResponse = await response.json();
    return {
      online: true,
      data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      online: false,
      error: `Backend not reachable: ${message}. Using demo preview mode.`,
    };
  }
}

export async function loginApi(credentials: {
  identifier: string;
  password: string;
  portal_type?: 'student' | 'admin';
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.message || 'Login failed. Please check your credentials.';
    throw new Error(message);
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return data;
}

export async function registerApi(payload: {
  full_name: string;
  student_id: string;
  email: string;
  password: string;
  confirm_password: string;
  department: string;
  course: string;
  academic_year: string;
  phone_number?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/accounts/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    let errorMsg = data.message || 'Registration failed.';
    if (data.errors) {
      const details = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
      errorMsg = `${errorMsg} (${details})`;
    }
    throw new Error(errorMsg);
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/accounts/logout/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    // Ignore network error on logout
  } finally {
    clearStoredAuth();
  }
}

export async function getProfileApi(): Promise<{
  status: string;
  role: string;
  profile?: ApiStudentProfile;
  user?: AuthResponse['user'];
}> {
  const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(`Profile request failed with status ${response.status}`);
  }

  return await response.json();
}

export async function updateProfileApi(payload: {
  full_name?: string;
  student_id?: string;
  phone_number?: string;
  department?: string;
  course?: string;
  academic_year?: string;
  photo_base64?: string;
}): Promise<{
  status: string;
  message: string;
  profile: ApiStudentProfile;
}> {
  const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    let errorMsg = data.message || 'Profile update failed.';
    if (data.errors) {
      const details = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
      errorMsg = `${errorMsg} (${details})`;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export async function getAdminOverviewApi(): Promise<AdminOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/accounts/admin/overview/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || `Admin overview request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export async function createAdminApi(payload: {
  username: string;
  email: string;
  password: string;
  name?: string;
}): Promise<{
  status: string;
  message: string;
  admin: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    is_staff: boolean;
    created_at: string | null;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/accounts/admin/create-admin/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    let errorMsg = data.message || 'Administrator creation failed.';
    if (data.errors) {
      const details = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
      errorMsg = `${errorMsg} (${details})`;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export async function getAdminSetupStatusApi(): Promise<{
  status: string;
  needs_setup: boolean;
  admin_count: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/accounts/admin/setup-status/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return { status: 'error', needs_setup: false, admin_count: 1 };
    }

    return await response.json();
  } catch {
    return { status: 'error', needs_setup: false, admin_count: 1 };
  }
}

export async function setupFirstAdminApi(payload: {
  username: string;
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/accounts/admin/setup-first-admin/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    let errorMsg = data.message || 'First-time Administrator setup failed.';
    if (data.errors) {
      const details = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join(' | ');
      errorMsg = `${errorMsg} (${details})`;
    }
    throw new Error(errorMsg);
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return data;
}

// ==========================================
// 1. Events API
// ==========================================

export async function getEventsApi(category?: string, search?: string): Promise<{
  status: string;
  count: number;
  events: BackendEvent[];
}> {
  const params = new URLSearchParams();
  if (category && category.toLowerCase() !== 'all') {
    params.set('category', category);
  }
  if (search) {
    params.set('search', search);
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const response = await fetch(`${API_BASE_URL}/events/${queryString}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not fetch events.');
  }
  return data;
}

export async function createEventApi(eventData: {
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  organizer?: string;
  speaker?: string;
  speaker_role?: string;
  capacity: number;
  status?: string;
  description?: string;
  tags?: string;
}): Promise<{
  status: string;
  message: string;
  event: BackendEvent;
}> {
  const response = await fetch(`${API_BASE_URL}/events/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  });

  const data = await response.json();
  if (!response.ok) {
    let msg = data.message || 'Event creation failed.';
    if (data.errors) {
      msg += ` (${JSON.stringify(data.errors)})`;
    }
    throw new Error(msg);
  }
  return data;
}

export async function updateEventApi(
  id: number,
  eventData: Partial<BackendEvent>
): Promise<{
  status: string;
  message: string;
  event: BackendEvent;
}> {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Event update failed.');
  }
  return data;
}

export async function cancelEventApi(id: number): Promise<{
  status: string;
  message: string;
  event: BackendEvent;
}> {
  const response = await fetch(`${API_BASE_URL}/events/${id}/cancel/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Event cancellation failed.');
  }
  return data;
}

export async function deleteEventApi(id: number): Promise<{
  status: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Event deletion failed.');
  }
  return data;
}

// ==========================================
// 2. Registrations & QR Passes API
// ==========================================

export async function registerForEventApi(eventId: number): Promise<{
  status: string;
  message: string;
  registration: BackendRegistration;
  email_dispatched?: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/registrations/register/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ event_id: eventId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed.');
  }
  return data;
}

export async function getMyPassesApi(): Promise<{
  status: string;
  count: number;
  passes: BackendRegistration[];
}> {
  const response = await fetch(`${API_BASE_URL}/registrations/my-passes/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not fetch passes.');
  }
  return data;
}

export async function cancelMyPassApi(registrationId: number): Promise<{
  status: string;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/registrations/cancel/${registrationId}/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not cancel pass.');
  }
  return data;
}

export async function getMyCertificatesApi(): Promise<{
  status: string;
  count: number;
  certificates: BackendCertificate[];
}> {
  const response = await fetch(`${API_BASE_URL}/registrations/my-certificates/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not fetch certificates.');
  }
  return data;
}

export async function getAdminRegistrationsApi(eventId?: number): Promise<{
  status: string;
  count: number;
  registrations: BackendRegistration[];
}> {
  const query = eventId ? `?event_id=${eventId}` : '';
  const response = await fetch(`${API_BASE_URL}/registrations/all/${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not fetch registrations.');
  }
  return data;
}

export async function adminIssueCertificateApi(payload: {
  student_id: string;
  event_id: number;
  title?: string;
  grade?: string;
}): Promise<{
  status: string;
  message: string;
  certificate: BackendCertificate;
}> {
  const response = await fetch(`${API_BASE_URL}/registrations/issue-certificate/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Certificate issuance failed.');
  }
  return data;
}

// ==========================================
// 3. QR Attendance & Scanner API
// ==========================================

export async function scanQrPassApi(payload: {
  pass_token: string;
  device_info?: string;
}): Promise<{
  status: string;
  verification_status: string;
  message: string;
  record?: BackendAttendance;
  student?: {
    name: string;
    student_id: string;
    department: string;
    course: string;
    email: string;
  };
  event?: {
    id: number;
    title: string;
    category: string;
    venue: string;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/attendance/scan/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'QR Check-in verification failed.');
    (error as any).status = response.status;
    (error as any).response = data;
    throw error;
  }
  return data;
}

export async function getMyAttendanceHistoryApi(): Promise<{
  status: string;
  count: number;
  history: BackendAttendance[];
}> {
  const response = await fetch(`${API_BASE_URL}/attendance/my-history/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not fetch attendance history.');
  }
  return data;
}

export async function getAdminAttendanceReportsApi(eventId?: number): Promise<{
  status: string;
  summary: {
    total_scans: number;
    verified_count: number;
    duplicate_count: number;
    verification_mode: string;
  };
  records: BackendAttendance[];
}> {
  const query = eventId ? `?event_id=${eventId}` : '';
  const response = await fetch(`${API_BASE_URL}/attendance/reports/${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Could not fetch attendance reports.');
  }
  return data;
}

export function getExportAttendanceCsvUrl(): string {
  return `${API_BASE_URL}/attendance/export-csv/`;
}

// ==========================================
// 4. AI Event Assistant API
// ==========================================

export async function queryAiAssistantApi(query: string): Promise<{
  status: string;
  query: string;
  answer: string;
  suggested_questions: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/ai/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'AI Assistant could not process your query.');
  }
  return data;
}
