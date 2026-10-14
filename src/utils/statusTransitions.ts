import { ReportStatus, UserRole } from '../types/civic';

export const STATUS_ORDER: ReportStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
];

export const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  Submitted: ['Under Review', 'Assigned', 'Closed'],
  'Under Review': ['Assigned', 'In Progress', 'Closed'],
  Assigned: ['In Progress', 'Under Review', 'Closed'],
  'In Progress': ['Resolved', 'Assigned'],
  Resolved: ['Closed', 'In Progress'],
  Closed: ['In Progress'],
};

export function canUserTransitionStatus(
  role: UserRole,
  currentStatus: ReportStatus,
  targetStatus: ReportStatus
): { allowed: boolean; reason?: string } {
  if (role === 'citizen') {
    return {
      allowed: false,
      reason: 'Citizens do not possess municipal authorization to update official complaint statuses.',
    };
  }

  // Only Administrator can reopen closed tickets
  if (currentStatus === 'Closed' && role !== 'admin') {
    return {
      allowed: false,
      reason: 'Only Municipal Administrators have authority to reopen closed tickets.',
    };
  }

  const allowedTargets = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition directly from "${currentStatus}" to "${targetStatus}".`,
    };
  }

  return { allowed: true };
}

export function getStatusStepIndex(status: ReportStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function getStatusBadgeColor(status: ReportStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'Submitted':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'Under Review':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'Assigned':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'In Progress':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' };
    case 'Resolved':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-700', dot: 'bg-teal-600' };
    case 'Closed':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' };
  }
}
