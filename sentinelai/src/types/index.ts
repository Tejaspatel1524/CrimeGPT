// ============================================================
// CrimeGPT — TypeScript Type Definitions
// ============================================================

export type FraudCategory =
  | 'Investment Scam'
  | 'UPI Fraud'
  | 'Phishing'
  | 'Job Scam'
  | 'Loan App Fraud'
  | 'Sextortion'
  | 'Identity Theft'
  | 'Online Shopping Fraud';

export type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type CaseStatus =
  | 'Open'
  | 'Under Investigation'
  | 'Evidence Collection'
  | 'Pending Review'
  | 'Escalated'
  | 'Closed'
  | 'Resolved';

export type EvidenceType =
  | 'Complaint PDF'
  | 'Screenshot'
  | 'Chat Export'
  | 'Bank Statement'
  | 'Image'
  | 'Call Recording'
  | 'Email Thread'
  | 'Transaction Log';

export interface Victim {
  name: string;
  contact: string;
  email: string;
  address: string;
  age?: number;
  occupation?: string;
}

export interface Officer {
  id: string;
  name: string;
  rank: string;
  department: string;
  avatar?: string;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  description: string;
  type: 'contact' | 'transaction' | 'communication' | 'escalation' | 'evidence' | 'action';
  riskScore?: number;
  linkedEvidenceIds?: string[];
  linkedEntityIds?: string[];
  investigatorNotes?: string;
}

export interface Entity {
  id: string;
  type: 'Phone Number' | 'UPI ID' | 'Email Address' | 'Website' | 'Telegram Handle' | 'Bank Account' | 'Social Media' | 'IP Address';
  value: string;
  label: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  associatedCases: number;
  firstSeen: string;
  lastSeen: string;
  riskScore?: number;
  statesDetected?: string[];
  connectedEntities?: string[];
  investigatorNotes?: string;
}

export interface Case {
  id: string;
  caseNumber?: string;
  title: string;
  description: string;
  fraudCategory: FraudCategory;
  priority: CasePriority;
  status: CaseStatus;
  archived?: number;
  victim: Victim;
  assignedOfficer: Officer;
  entities: Entity[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  complaintText: string;
  amountLost: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  tags: string[];
}

export interface DashboardStats {
  totalCases: number;
  openCases: number;
  closedCases: number;
  highPriorityCases: number;
  activeInvestigations: number;
  totalAmountLost: number;
  convictionRate: number;
  avgResolutionDays: number;
}

export interface MonthlyTrend {
  month: string;
  cases: number;
  resolved: number;
  pending: number;
}

export interface CategoryDistribution {
  category: FraudCategory;
  count: number;
  percentage: number;
  color: string;
}

export interface StatusDistribution {
  status: CaseStatus;
  count: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: 'new_case' | 'update' | 'report' | 'alert' | 'assignment';
  title: string;
  description: string;
  timestamp: string;
  caseId?: string;
  user?: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'Investigation Summary' | 'Forensic Analysis' | 'Intelligence Brief' | 'Compliance Audit' | 'Monthly Review';
  status: 'Draft' | 'In Review' | 'Approved' | 'Published';
  caseId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
}

export interface InvestigationAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}

export interface FraudTrend {
  category: FraudCategory;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  entityType: Entity['type'] | 'Victim' | 'Suspect';
  riskLevel?: 'High' | 'Medium' | 'Low';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  phone: string;
  joinedAt: string;
}

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}
