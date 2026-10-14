export type UserRole = 'citizen' | 'officer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type IssueCategory =
  | 'Pothole or damaged road'
  | 'Garbage accumulation'
  | 'Blocked drainage or waterlogging'
  | 'Damaged streetlight'
  | 'Water leakage'
  | 'Damaged sidewalk'
  | 'Other civic infrastructure issue'
  | 'Uncertain or unclassifiable';

export type ReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AiAssessment {
  category: IssueCategory;
  visibleEvidence: string;
  severity: SeverityLevel;
  severityScore: number; // 0 - 100
  publicSafetyRiskScore: number; // 0 - 100
  publicSafetyConcerns: string;
  suggestedSeverityReasoning: string;
  isUnclearOrIrrelevant: boolean;
  recommendedHumanReview: boolean;
  modelConfidenceNotes: string;
  analyzedAt: string;
  isSimulatedDemo?: boolean;
}

export interface PriorityScoreBreakdown {
  totalScore: number; // 0 - 100
  band: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: {
    severity: { score: number; weight: number; contribution: number };
    publicSafetyRisk: { score: number; weight: number; contribution: number };
    unresolvedDuration: { score: number; weight: number; contribution: number };
    nearbyFrequency: { score: number; weight: number; contribution: number };
  };
  explanation: string;
  requiresImmediateHumanReview: boolean;
  lastAssessedAt: string;
}

export interface LocationData {
  address: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
}

export interface StatusHistoryEntry {
  id: string;
  previousStatus?: ReportStatus;
  newStatus: ReportStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  publicUpdate: string;
  internalNote?: string;
}

export interface ResolutionEvidence {
  resolvedAt: string;
  resolvedByOfficerId: string;
  resolvedByOfficerName: string;
  resolutionSummary: string;
  resolutionPhotoUrl?: string;
  verificationMethod: string;
}

export interface CivicReport {
  id: string; // e.g. CIVIC-2026-X89K2
  reporterId: string;
  reporterName: string;
  category: IssueCategory;
  citizenDescription: string;
  photoUrl: string;
  location: LocationData;
  aiAssessment?: AiAssessment;
  priority: PriorityScoreBreakdown;
  status: ReportStatus;
  assignedTeam?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
  resolution?: ResolutionEvidence;
  internalNotes: { id: string; authorName: string; note: string; timestamp: string }[];
  isDemoRecord: boolean;
  duplicateOfId?: string;
}

export interface DuplicateMatch {
  reportId: string;
  existingReport: CivicReport;
  distanceMeters: number;
  categoryMatch: boolean;
  similarityScore: number; // 0 - 100
  reason: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  reportId?: string;
  title: string;
  message: string;
  type: 'status_change' | 'assignment' | 'resolution' | 'system' | 'info_requested';
  createdAt: string;
  read: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  targetType: 'report' | 'user' | 'config' | 'system';
  timestamp: string;
  details: string;
}

export interface PriorityWeightsConfig {
  severityWeight: number; // default 0.40
  safetyRiskWeight: number; // default 0.30
  durationWeight: number; // default 0.20
  frequencyWeight: number; // default 0.10
  criticalThreshold: number; // 80
  highThreshold: number; // 60
  mediumThreshold: number; // 30
  duplicateRadiusMeters: number; // 150
  slaHours: {
    critical: number; // 24
    high: number; // 48
    medium: number; // 96
    low: number; // 168
  };
}
