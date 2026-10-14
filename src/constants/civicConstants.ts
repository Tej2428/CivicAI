import { IssueCategory, ReportStatus, SeverityLevel } from '../types/civic';

export const ISSUE_CATEGORIES: readonly IssueCategory[] = [
  'Pothole or damaged road',
  'Garbage accumulation',
  'Blocked drainage or waterlogging',
  'Damaged streetlight',
  'Water leakage',
  'Damaged sidewalk',
  'Other civic infrastructure issue',
  'Uncertain or unclassifiable',
] as const;

export const REPORT_STATUSES: readonly ReportStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export const SEVERITY_LEVELS: readonly SeverityLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const MUNICIPAL_DEPARTMENTS: readonly string[] = [
  'Roads & Structural Maintenance',
  'Sanitation & Solid Waste Management',
  'Water & Sewage Directorate',
  'Electrical & Lighting Utility',
  'Urban Parks & Public Spaces',
  'Rapid Emergency Response Squad',
] as const;

export const DEFAULT_DUPLICATE_RADIUS_METERS = 150;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const COMPRESSED_IMAGE_MAX_DIMENSION = 1200; // px
export const COMPRESSED_IMAGE_QUALITY = 0.78; // JPEG quality

export const SLA_TARGET_HOURS_DEFAULT = {
  critical: 24,
  high: 48,
  medium: 96,
  low: 168,
} as const;
