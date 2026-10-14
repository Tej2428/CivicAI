import {
  AuditLogEntry,
  CivicReport,
  InAppNotification,
  PriorityWeightsConfig,
  UserProfile,
} from '../types/civic';
import { MOCK_REPORTS, MOCK_USERS } from '../data/mockData';
import { DEFAULT_PRIORITY_CONFIG } from './priorityScorer';

const STORAGE_KEYS = {
  REPORTS: 'civicai_reports_v1',
  NOTIFICATIONS: 'civicai_notifications_v1',
  AUDIT_LOGS: 'civicai_audit_logs_v1',
  CONFIG: 'civicai_priority_config_v1',
  CURRENT_USER: 'civicai_current_user_v1',
  DEMO_MODE: 'civicai_demo_mode_active',
};

export function loadReports(): CivicReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      // Initialize with mock reports
      saveReports(MOCK_REPORTS);
      return MOCK_REPORTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reports from storage:', e);
    return MOCK_REPORTS;
  }
}

export function saveReports(reports: CivicReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save reports to storage:', e);
  }
}

export function addReport(newReport: CivicReport): void {
  const current = loadReports();
  const updated = [newReport, ...current];
  saveReports(updated);

  // Dispatch audit log
  addAuditLog({
    actorId: newReport.reporterId,
    actorName: newReport.reporterName,
    actorRole: 'citizen',
    action: 'CREATE_REPORT',
    targetId: newReport.id,
    targetType: 'report',
    details: `Created new complaint in category "${newReport.category}" at ${newReport.location.address}`,
  });

  // Dispatch notification to citizen
  addNotification({
    userId: newReport.reporterId,
    reportId: newReport.id,
    title: 'Complaint Registered',
    message: `Your complaint #${newReport.id} (${newReport.category}) was received and queued for review.`,
    type: 'status_change',
  });
}

export function updateReport(updatedReport: CivicReport): void {
  const current = loadReports();
  const index = current.findIndex((r) => r.id === updatedReport.id);
  if (index !== -1) {
    current[index] = { ...updatedReport, updatedAt: new Date().toISOString() };
    saveReports(current);
  }
}

export function resetDemoData(): void {
  // Reset reports back to original mock set
  saveReports(MOCK_REPORTS);

  addAuditLog({
    actorId: 'system',
    actorName: 'System Maintenance',
    actorRole: 'admin',
    action: 'RESET_DEMO_DATA',
    targetId: 'all',
    targetType: 'system',
    details: 'Reset system sample database to clean competition evaluation baseline.',
  });
}

// In-App Notifications
export function loadNotifications(userId?: string): InAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: InAppNotification[] = raw ? JSON.parse(raw) : [];
    if (!userId) return all;
    return all.filter((n) => n.userId === userId || n.userId === 'all');
  } catch (e) {
    return [];
  }
}

export function addNotification(
  notif: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>
): InAppNotification {
  const all = loadNotifications();
  const created: InAppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const updated = [created, ...all].slice(0, 50); // Keep last 50
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
  return created;
}

export function markNotificationAsRead(id: string): void {
  const all = loadNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to mark notification read:', e);
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  const all = loadNotifications();
  const updated = all.map((n) => (n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n));
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to mark all notifications read:', e);
  }
}

// Audit Logs
export function loadAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const initialLogs: AuditLogEntry[] = [
        {
          id: 'log_01',
          actorId: 'user_adm_01',
          actorName: 'Municipal Admin Sarah Chen',
          actorRole: 'admin',
          action: 'SYSTEM_INITIALIZATION',
          targetId: 'civicai-core',
          targetType: 'system',
          timestamp: '2026-10-01T08:00:00Z',
          details: 'CivicAI platform deployed with default priority matrix and 8 infrastructure categories.',
        },
        {
          id: 'log_02',
          actorId: 'user_off_01',
          actorName: 'Officer Rajesh Kumar',
          actorRole: 'officer',
          action: 'VERIFY_RESOLUTION',
          targetId: 'CIVIC-2026-D3201',
          targetType: 'report',
          timestamp: '2026-10-07T16:45:00Z',
          details: 'Verified hydro-vac drainage line restoration on Pine Blvd with 150 GPM water run.',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function addAuditLog(
  log: Omit<AuditLogEntry, 'id' | 'timestamp'>
): AuditLogEntry {
  const all = loadAuditLogs();
  const entry: AuditLogEntry = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...all].slice(0, 100); // Keep last 100
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }
  return entry;
}

// Priority Config
export function loadPriorityConfig(): PriorityWeightsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      savePriorityConfig(DEFAULT_PRIORITY_CONFIG);
      return DEFAULT_PRIORITY_CONFIG;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PRIORITY_CONFIG;
  }
}

export function savePriorityConfig(cfg: PriorityWeightsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

// Current User Session
export function loadCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  // Default to citizen user
  return MOCK_USERS[0];
}

export function saveCurrentUser(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save current user:', e);
  }
}
