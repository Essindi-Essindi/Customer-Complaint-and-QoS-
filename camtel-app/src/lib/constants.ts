// enum values note

// type def
export type Role = 'SUBSCRIBER' | 'AGENT' | 'MANAGER';

// route lookup
export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case 'AGENT':
      return '/agent/complaints';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'SUBSCRIBER':
    default:
      return '/my-complaints';
  }
}

// type def
export type ComplaintStatusValue = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export const COMPLAINT_STATUSES: ComplaintStatusValue[] = [
  'SUBMITTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
];

export const STATUS_LABELS: Record<ComplaintStatusValue, { en: string; fr: string }> = {
  SUBMITTED: { en: 'Submitted', fr: 'Soumise' },
  ASSIGNED: { en: 'Assigned', fr: 'Assignée' },
  IN_PROGRESS: { en: 'In Progress', fr: 'En cours' },
  RESOLVED: { en: 'Resolved', fr: 'Résolue' },
};

export const STATUS_COLORS: Record<ComplaintStatusValue, string> = {
  SUBMITTED: '#6b7280',
  ASSIGNED: '#2563eb',
  IN_PROGRESS: '#ea580c',
  RESOLVED: '#16a34a',
};

// type def note
export type ServiceTypeValue = 'MOBILE' | 'ADSL' | 'FTTH';

export const SERVICE_TYPES: ServiceTypeValue[] = ['MOBILE', 'ADSL', 'FTTH'];

export const SERVICE_TYPE_LABELS: Record<ServiceTypeValue, { en: string; fr: string }> = {
  MOBILE: { en: 'Blue Mobile', fr: 'Blue Mobile' },
  ADSL: { en: 'ADSL Broadband', fr: 'ADSL Haut débit' },
  FTTH: { en: 'FTTH Fibre', fr: 'FTTH Fibre' },
};

// type def
export type ReportTypeValue = 'WEEKLY' | 'MONTHLY';

export const REPORT_TYPES: ReportTypeValue[] = ['WEEKLY', 'MONTHLY'];

// option list data
export const COMPLAINT_TYPES = [
  'Slow Internet',
  'Call Drop',
  'Billing Error',
  'No Signal',
  'Service Outage',
] as const;

// option list data
export const REGIONS = [
  'Adamaoua',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'North West',
  'South',
  'South West',
  'West',
] as const;

// grouping type note
export type KpiGroupBy = 'type' | 'region' | 'team';

export const KPI_GROUP_OPTIONS: { value: KpiGroupBy; en: string; fr: string }[] = [
  { value: 'type', en: 'Complaint type', fr: 'Type de plainte' },
  { value: 'region', en: 'Region', fr: 'Région' },
  { value: 'team', en: "Team (agent's region)", fr: "Équipe (région de l'agent)" },
];
