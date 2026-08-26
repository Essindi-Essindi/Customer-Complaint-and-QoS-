import type { Role, ComplaintStatusValue, ServiceTypeValue, ReportTypeValue } from './constants';

// base url setup
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

// response shape
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
  auth?: boolean; // auth flag
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
// auth section
// ---------------------------------------------------------------------------

// request shape
export interface LoginRequest {
  identifier: string;
  password: string;
}

// request shape
export interface RegisterSubscriberRequest {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  camtelAccountNumber: string;
  serviceType: string;
  captchaToken: string;
}

// response shape
export interface AuthResponse {
  token: string | null;
  role: Role;
  userId: number;
  name: string;
  department: string | null;
  emailVerificationRequired: boolean;
}

// request shape
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// request shape
export interface ResendVerificationRequest {
  email: string;
}

export const authApi = {
  register: (data: RegisterSubscriberRequest) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (data: LoginRequest) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: data, auth: false }),
  // public endpoint
  verifyEmail: (data: VerifyEmailRequest) =>
      request<AuthResponse>('/auth/verify-email', { method: 'POST', body: data, auth: false }),
  resendVerification: (data: ResendVerificationRequest) =>
      request<void>('/auth/resend-verification', { method: 'POST', body: data, auth: false }),
};

// ---------------------------------------------------------------------------
// complaints section
// ---------------------------------------------------------------------------

// request shape
export interface ComplaintSubmissionRequest {
  idempotencyKey: string;
  type: string;
  serviceType: ServiceTypeValue;
  region: string;
  city: string;
  locality?: string;
  description?: string;
  categoryId?: number;
  captchaToken: string;
}

// response shape
export interface ComplaintResponse {
  id: number;
  ticketNumber: string;
  type: string;
  serviceType: string;
  region: string;
  city: string;
  locality: string | null;
  description: string | null;
  status: ComplaintStatusValue;
  createdAt: string;
  updatedAt: string | null;
}

// response shape
export interface ComplaintListItemResponse {
  id: number;
  ticketNumber: string;
  type: string;
  serviceType: string; // extra field
  status: ComplaintStatusValue;
  region: string;
  createdAt: string;
}

// request shape
export interface RatingRequest {
  score: number;
  comment?: string;
}

export const complaintsApi = {
  submit: (data: ComplaintSubmissionRequest) =>
      request<ComplaintResponse>('/complaints', { method: 'POST', body: data }),
  listMine: () => request<ComplaintListItemResponse[]>('/complaints/mine'),
  // public endpoint
  track: (ticketNumber: string) =>
      request<ComplaintResponse>(`/complaints/track/${encodeURIComponent(ticketNumber)}`, {
        auth: false,
      }),
  rate: (complaintId: number, data: RatingRequest) =>
      request<void>(`/complaints/${complaintId}/rate`, { method: 'POST', body: data }),
};

// ---------------------------------------------------------------------------
// agent section
// ---------------------------------------------------------------------------

// request shape
export interface ComplaintStatusUpdateRequest {
  newStatus: ComplaintStatusValue;
  resolutionNote?: string;
}

// response shape
export interface ComplaintStaffDetailResponse {
  id: number;
  ticketNumber: string;
  type: string;
  serviceType: string;
  region: string;
  city: string;
  locality: string | null;
  description: string | null;
  status: ComplaintStatusValue;
  createdAt: string;
  updatedAt: string | null;
  subscriberName: string | null;
  subscriberEmail: string | null;
  subscriberPhone: string | null;
  assignedAgentName: string | null;
}

export const agentComplaintsApi = {
  listAssigned: () => request<ComplaintListItemResponse[]>('/agent/complaints/assigned'),
  // list endpoint
  listServiceComplaints: () => request<ComplaintListItemResponse[]>('/agent/complaints/service'),
  // agent only
  claim: (complaintId: number) =>
      request<ComplaintResponse>(`/agent/complaints/${complaintId}/claim`, { method: 'PATCH' }),
  updateStatus: (complaintId: number, data: ComplaintStatusUpdateRequest) =>
      request<ComplaintResponse>(`/agent/complaints/${complaintId}/status`, {
        method: 'PATCH',
        body: data,
      }),
  // detail lookup
  getByTicket: (ticketNumber: string) =>
      request<ComplaintStaffDetailResponse>(`/agent/complaints/by-ticket/${encodeURIComponent(ticketNumber)}`),
};

// ---------------------------------------------------------------------------
// analytics section
// ---------------------------------------------------------------------------

// response shape
export interface HeatMapResponse {
  region: string;
  city: string;
  complaintCount: number;
}

// response shape
export interface RegionTotalResponse {
  region: string;
  complaintCount: number;
}

// response shape
export interface KpiResponse {
  groupLabel: string;
  averageResolutionTimeHours: number;
  totalComplaints: number;
  resolvedComplaints: number;
}

// response shape
export interface RecurringPatternResponse {
  type: string;
  region: string;
  occurrences: number;
  windowDescription: string;
}

export const analyticsApi = {
  // query params note
  heatMap: (
      start: string,
      end: string,
      serviceType?: ServiceTypeValue,
      sortBy?: 'region' | 'city',
      page = 0,
      size = 10,
  ) =>
      request<SpringPage<HeatMapResponse>>('/analytics/heatmap', {
        query: { start, end, serviceType, sortBy, page, size },
      }),
  regionTotals: (start: string, end: string, serviceType?: ServiceTypeValue) =>
      request<RegionTotalResponse[]>('/analytics/heatmap/regions', { query: { start, end, serviceType } }),
  kpis: (groupBy: 'type' | 'region' | 'team') =>
      request<KpiResponse[]>('/analytics/kpis', { query: { groupBy } }),
  recurringPatterns: () => request<RecurringPatternResponse[]>('/analytics/recurring-patterns'),
};

// ---------------------------------------------------------------------------
// reports section
// ---------------------------------------------------------------------------

// request shape
export interface ReportGenerationRequest {
  type: ReportTypeValue;
  startDate: string; // date format
  endDate: string;
}

// response shape
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
  // list history
  list: () => request<ReportResponse[]>('/reports'),
  // download handling
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
// manager complaints section
// ---------------------------------------------------------------------------

// response shape
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
  assignedAgentName: string | null; // may be empty
}

// page shape
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
}

export interface ManagerComplaintFilters {
  type?: string;
  serviceType?: ServiceTypeValue;
  region?: string;
  status?: ComplaintStatusValue;
  start?: string; // date format
  end?: string; // date format
  page?: number;
  size?: number;
}

// response shape
export interface AgentWithLoadResponse {
  id: number;
  name: string;
  email: string;
  assignedService: string;
  assignedRegion: string | null;
  assignedComplaintCount: number; // count field
}

export const managerComplaintsApi = {
  list: (filters: ManagerComplaintFilters = {}) =>
      request<SpringPage<ComplaintManagerListItemResponse>>('/manager/complaints', {
        query: { ...filters },
      }),
  // assign endpoint
  assignAgent: (complaintId: number, agentId: number) =>
      request<ComplaintResponse>(`/manager/complaints/${complaintId}/assign`, {
        method: 'POST',
        body: { agentId },
      }),
  // lookup endpoint
  agentsByService: (service: string) =>
      request<AgentWithLoadResponse[]>('/manager/complaints/agents-by-service', {
        query: { service },
      }),
};

// ---------------------------------------------------------------------------
// categories section
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
// public categories section
// ---------------------------------------------------------------------------

export const subscriberCategoriesApi = {
  list: () => request<Category[]>('/categories'),
};

// ---------------------------------------------------------------------------
// user management section
// ---------------------------------------------------------------------------

// request shape
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

// request shape
export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  active?: boolean;
  assignedRegion?: string;
  assignedService?: string;
  department?: string;
}

// response shape
export interface UserResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  active: boolean;
}

// row result shape
export interface AgentImportRowResult {
  row: number;
  name: string;
  email: string;
  imported: boolean;
  message: string;
}

// response shape
export interface AgentImportResultResponse {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  rows: AgentImportRowResult[];
}

// ---------------------------------------------------------------------------
// notifications section
// ---------------------------------------------------------------------------

// response shape
export interface AppNotificationResponse {
  id: number;
  type: string;
  message: string;
  ticketNumber: string | null;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  // cursor param note
  list: (since?: string) => request<AppNotificationResponse[]>('/notifications', { query: { since } }),
  unreadCount: () => request<number>('/notifications/unread-count'),
  markRead: (id: number) => request<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request<void>('/notifications/read-all', { method: 'PATCH' }),
};

export const usersApi = {
  list: (role?: Role, page = 0, size = 20) =>
      request<SpringPage<UserResponse>>('/manager/users', { query: { role, page, size } }),
  create: (data: UserCreateRequest) =>
      request<UserResponse>('/manager/users', { method: 'POST', body: data }),
  update: (userId: number, data: UserUpdateRequest) =>
      request<UserResponse>(`/manager/users/${userId}`, { method: 'PUT', body: data }),
  deactivate: (userId: number) => request<void>(`/manager/users/${userId}`, { method: 'DELETE' }),
  // upload handling
  importAgents: async (file: File): Promise<AgentImportResultResponse> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/manager/users/import-agents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      throw new ApiError(payload || { message: `Import failed with status ${res.status}` }, res.status);
    }
    return payload as AgentImportResultResponse;
  },
};
