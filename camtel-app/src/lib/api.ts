import type { Role, ComplaintStatusValue, ServiceTypeValue, ReportTypeValue } from './constants';

// Base URL for the Spring Boot backend. Override with VITE_API_BASE_URL in a
// .env file if the API isn't running on the default localhost:8080.
const API_BASE_URL: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ||
  'http://localhost:8080/api';

const TOKEN_STORAGE_KEY = 'camtel_auth';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

// Mirrors dto/response/ErrorResponse.java
export interface ApiErrorBody {
  message: string;
  status: number;
  timestamp: string;
}

export class ApiError extends Error {
  status: number;
  constructor(body: ApiErrorBody | { message: string }, status: number) {
    super(body.message || 'Request failed');
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // attach Authorization header (default true)
  query?: Record<string, string | number | undefined | null>;
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(payload || { message: `Request failed with status ${res.status}` }, res.status);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Auth — AuthController (/api/auth)
// ---------------------------------------------------------------------------

// dto/request/LoginRequest.java
export interface LoginRequest {
  email: string;
  password: string;
}

// dto/request/RegisterSubscriberRequest.java
export interface RegisterSubscriberRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  camtelAccountNumber: string;
  serviceType: string;
  captchaToken: string;
}

// dto/response/AuthResponse.java
export interface AuthResponse {
  token: string;
  role: Role;
  userId: number;
  name: string;
}

export const authApi = {
  register: (data: RegisterSubscriberRequest) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data, auth: false }),
};

// ---------------------------------------------------------------------------
// Complaints (subscriber-facing) — ComplaintController (/api/complaints)
// ---------------------------------------------------------------------------

// dto/request/ComplaintSubmissionRequest.java
export interface ComplaintSubmissionRequest {
  idempotencyKey: string;
  type: string;
  serviceType: ServiceTypeValue;
  region: string;
  city: string;
  description?: string;
  categoryId?: number;
  captchaToken: string;
}

// dto/response/ComplaintResponse.java — the full detail view. Note the backend
// does NOT return resolutionNote, assigned agent name, rating, or an audit
// trail here; those fields don't exist in this DTO.
export interface ComplaintResponse {
  id: number;
  ticketNumber: string;
  type: string;
  serviceType: string;
  region: string;
  city: string;
  status: ComplaintStatusValue;
  createdAt: string;
  updatedAt: string | null;
}

// dto/response/ComplaintListItemResponse.java — the row shown in list views.
// Deliberately thinner than ComplaintResponse: no serviceType, city, or
// subscriber/agent info.
export interface ComplaintListItemResponse {
  id: number;
  ticketNumber: string;
  type: string;
  status: ComplaintStatusValue;
  region: string;
  createdAt: string;
}

// dto/request/RatingRequest.java
export interface RatingRequest {
  score: number;
  comment?: string;
}

export const complaintsApi = {
  submit: (data: ComplaintSubmissionRequest) =>
    request<ComplaintResponse>('/complaints', { method: 'POST', body: data }),
  listMine: () => request<ComplaintListItemResponse[]>('/complaints/mine'),
  // Public — no auth required (see SecurityConfig permitAll for GET /api/complaints/track/**)
  track: (ticketNumber: string) =>
    request<ComplaintResponse>(`/complaints/track/${encodeURIComponent(ticketNumber)}`, {
      auth: false,
    }),
  rate: (complaintId: number, data: RatingRequest) =>
    request<void>(`/complaints/${complaintId}/rate`, { method: 'POST', body: data }),
};

// ---------------------------------------------------------------------------
// Agent/manager complaint handling — AgentComplaintController (/api/agent/complaints)
// ---------------------------------------------------------------------------

// dto/request/ComplaintStatusUpdateRequest.java
export interface ComplaintStatusUpdateRequest {
  newStatus: ComplaintStatusValue;
  resolutionNote?: string;
}

export const agentComplaintsApi = {
  listAssigned: () => request<ComplaintListItemResponse[]>('/agent/complaints/assigned'),
  // Agent-only (not manager) — the backend casts the caller to Agent.
  claim: (complaintId: number) =>
    request<ComplaintResponse>(`/agent/complaints/${complaintId}/claim`, { method: 'PATCH' }),
  updateStatus: (complaintId: number, data: ComplaintStatusUpdateRequest) =>
    request<ComplaintResponse>(`/agent/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: data,
    }),
};

// ---------------------------------------------------------------------------
// Analytics (manager only) — AnalyticsController (/api/analytics)
// ---------------------------------------------------------------------------

// dto/response/HeatMapResponse.java
export interface HeatMapResponse {
  region: string;
  city: string;
  complaintCount: number;
}

// dto/response/KpiResponse.java
export interface KpiResponse {
  groupLabel: string;
  averageResolutionTimeHours: number;
  totalComplaints: number;
  resolvedComplaints: number;
}

// dto/response/RecurringPatternResponse.java
export interface RecurringPatternResponse {
  type: string;
  region: string;
  occurrences: number;
  windowDescription: string;
}

export const analyticsApi = {
  // start/end are required LocalDate (YYYY-MM-DD) query params; serviceType optional.
  heatMap: (start: string, end: string, serviceType?: ServiceTypeValue) =>
    request<HeatMapResponse[]>('/analytics/heatmap', { query: { start, end, serviceType } }),
  kpis: (groupBy: 'type' | 'region' | 'team') =>
    request<KpiResponse[]>('/analytics/kpis', { query: { groupBy } }),
  recurringPatterns: () => request<RecurringPatternResponse[]>('/analytics/recurring-patterns'),
};

// ---------------------------------------------------------------------------
// Reports (manager only) — ReportController (/api/reports)
// ---------------------------------------------------------------------------

// dto/request/ReportGenerationRequest.java
export interface ReportGenerationRequest {
  type: ReportTypeValue;
  startDate: string; // LocalDate, YYYY-MM-DD
  endDate: string;
}

// dto/response/ReportResponse.java
export interface ReportResponse {
  id: number;
  type: ReportTypeValue;
  startDate: string;
  endDate: string;
  generatedAt: string;
  filePath: string | null;
}

export const reportsApi = {
  generate: (data: ReportGenerationRequest) =>
    request<ReportResponse>('/reports', { method: 'POST', body: data }),
  // Binary download — needs the Authorization header attached manually since
  // this isn't a JSON request/response.
  download: async (reportId: number): Promise<Blob> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/download`, { headers });
    if (!res.ok) {
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const payload = isJson ? await res.json().catch(() => null) : null;
      throw new ApiError(payload || { message: `Download failed with status ${res.status}` }, res.status);
    }
    return res.blob();
  },
};

// ---------------------------------------------------------------------------
// All complaints (manager only) — ManagerComplaintController (/api/manager/complaints)
// Powers the Dashboard Overview table: every complaint, filterable and paged.
// ---------------------------------------------------------------------------

// dto/response/ComplaintManagerListItemResponse.java — one table row.
export interface ComplaintManagerListItemResponse {
  id: number;
  ticketNumber: string;
  subscriberName: string | null;
  type: string;
  serviceType: ServiceTypeValue;
  region: string;
  city: string;
  status: ComplaintStatusValue;
  createdAt: string;
  assignedAgentName: string | null; // null when unassigned
}

// Spring's Page<T> JSON shape (org.springframework.data.domain.Page)
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page, 0-indexed
  size: number;
}

export interface ManagerComplaintFilters {
  type?: string;
  serviceType?: ServiceTypeValue;
  region?: string;
  status?: ComplaintStatusValue;
  start?: string; // LocalDate, YYYY-MM-DD
  end?: string; // LocalDate, YYYY-MM-DD
  page?: number;
  size?: number;
}

export const managerComplaintsApi = {
  list: (filters: ManagerComplaintFilters = {}) =>
    request<SpringPage<ComplaintManagerListItemResponse>>('/manager/complaints', {
      query: { ...filters },
    }),
};

// ---------------------------------------------------------------------------
// Categories (manager only) — CategoryController (/api/manager/categories)
// CategoryController takes name/description as @RequestParam, i.e. query
// params, not a JSON body.
// ---------------------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export const categoriesApi = {
  list: () => request<Category[]>('/manager/categories'),
  create: (name: string, description?: string) =>
    request<Category>('/manager/categories', { method: 'POST', query: { name, description } }),
  update: (id: number, name: string, description?: string) =>
    request<Category>(`/manager/categories/${id}`, { method: 'PUT', query: { name, description } }),
  delete: (id: number) => request<void>(`/manager/categories/${id}`, { method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// User management (manager only) — UserManagementController (/api/manager/users)
// ---------------------------------------------------------------------------

// dto/request/UserCreateRequest.java — role must be AGENT or MANAGER; the
// backend rejects anything else (UserManagementServiceImpl only switches on
// those two).
export interface UserCreateRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'AGENT' | 'MANAGER';
  assignedRegion?: string;
  assignedService?: string;
  department?: string;
}

// dto/request/UserUpdateRequest.java — no email/password/role change support.
export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  active?: boolean;
  assignedRegion?: string;
  assignedService?: string;
  department?: string;
}

// dto/response/UserResponse.java
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
}

export const usersApi = {
  list: (role?: Role) => request<UserResponse[]>('/manager/users', { query: { role } }),
  create: (data: UserCreateRequest) =>
    request<UserResponse>('/manager/users', { method: 'POST', body: data }),
  update: (userId: number, data: UserUpdateRequest) =>
    request<UserResponse>(`/manager/users/${userId}`, { method: 'PUT', body: data }),
  deactivate: (userId: number) => request<void>(`/manager/users/${userId}`, { method: 'DELETE' }),
};
