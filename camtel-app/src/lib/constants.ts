// Values here are kept in lockstep with the backend enums in
// customer_complaint.customer_complaint.model.enums.*
// Do not add options the backend doesn't accept, and don't rename the
// underlying values — only the display labels are free to change.

// model/enums/UserRole.java
export type Role = 'SUBSCRIBER' | 'AGENT' | 'MANAGER';

// model/enums/ComplaintStatus.java
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

// model/enums/ServiceType.java — ComplaintServiceImpl.parseServiceType() rejects
// anything that isn't exactly one of these (case-insensitive).
export type ServiceTypeValue = 'MOBILE' | 'ADSL' | 'FTTH';

export const SERVICE_TYPES: ServiceTypeValue[] = ['MOBILE', 'ADSL', 'FTTH'];

export const SERVICE_TYPE_LABELS: Record<ServiceTypeValue, { en: string; fr: string }> = {
  MOBILE: { en: 'Blue Mobile', fr: 'Blue Mobile' },
  ADSL: { en: 'ADSL Broadband', fr: 'ADSL Haut débit' },
  FTTH: { en: 'FTTH Fibre', fr: 'FTTH Fibre' },
};

// model/enums/ReportType.java
export type ReportTypeValue = 'WEEKLY' | 'MONTHLY';

export const REPORT_TYPES: ReportTypeValue[] = ['WEEKLY', 'MONTHLY'];

// Complaint "type" is a free-text field on the backend (Complaint.type is a
// plain String, ComplaintSubmissionRequest.type just needs @NotBlank) so any
// string is technically valid. We still offer a curated select for a
// consistent experience; the values sent are exactly the option text.
export const COMPLAINT_TYPES = [
  'Slow Internet',
  'Call Drop',
  'Billing Error',
  'No Signal',
  'Service Outage',
] as const;

// Region is also a free-text field (Complaint.region is a String), but a
// closed list keeps data consistent for analytics grouping.
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

// AnalyticsController /api/analytics/kpis only supports these three groupings
// (AnalyticsServiceImpl.getKpis switches on "region" / "team", anything else
// falls back to "type").
export type KpiGroupBy = 'type' | 'region' | 'team';

export const KPI_GROUP_OPTIONS: { value: KpiGroupBy; en: string; fr: string }[] = [
  { value: 'type', en: 'Complaint type', fr: 'Type de plainte' },
  { value: 'region', en: 'Region', fr: 'Région' },
  { value: 'team', en: "Team (agent's region)", fr: "Équipe (région de l'agent)" },
];
