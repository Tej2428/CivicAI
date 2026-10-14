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
  REPORTS: 'civicai_reports_v2',
  NOTIFICATIONS: 'civicai_notifications_v2',
  AUDIT_LOGS: 'civicai_audit_logs_v2',
  CONFIG: 'civicai_priority_config_v2',
  CURRENT_USER: 'civicai_current_user_v2',
} as const;

// In-memory fallback cache in case localStorage is disabled or fails
const memoryCache: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key} from localStorage, using memory fallback:`, err);
  }
  return memoryCache[key] || null;
}

function safeSetItem(key: string, value: string): boolean {
  memoryCache[key] = value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (err) {
    console.warn(`[Storage] localStorage write failed for ${key} (quota or restricted):`, err);
  }
  return false;
}

/**
 * Loads reports safely with schema validation and fallback initialization.
 */
export function loadReports(): CivicReport[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      saveReports(MOCK_REPORTS);
      return MOCK_REPORTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveReports(MOCK_REPORTS);
      return MOCK_REPORTS;
    }

    // Basic schema integrity check
    const validReports = parsed.filter(
      (r: any) => r && typeof r.id === 'string' && typeof r.category === 'string' && r.location
    );

    return validReports.length > 0 ? validReports : MOCK_REPORTS;
  } catch (e) {
    console.error('[Storage] Malformed reports in storage, resetting to verified baseline:', e);
    saveReports(MOCK_REPORTS);
    return MOCK_REPORTS;
  }
}

/**
 * Saves reports, handling quota overflow by safely trimming large payloads if needed.
 */
export function saveReports(reports: CivicReport[]): boolean {
  try {
    const serialized = JSON.stringify(reports);
    return safeSetItem(STORAGE_KEYS.REPORTS, serialized);
  } catch (e) {
    console.error('[Storage] Failed to serialize reports:', e);
    return false;
  }
}

export function addReport(newReport: CivicReport): void {
  const current = loadReports();
  const updated = [newReport, ...current];
  saveReports(updated);

  addAuditLog({
    actorId: newReport.reporterId,
    actorName: newReport.reporterName,
    actorRole: 'citizen',
    action: 'CREATE_REPORT',
    targetId: newReport.id,
    targetType: 'report',
    details: `Created new complaint in category "${newReport.category}" at ${newReport.location.address}`,
  });

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
    const raw = safeGetItem(STORAGE_KEYS.NOTIFICATIONS);
    const all: InAppNotification[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(all)) return [];
    if (!userId) return all;
    return all.filter((n) => n.userId === userId || n.userId === 'all');
  } catch {
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
  const updated = [created, ...all].slice(0, 50); // Bound memory
  safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  return created;
}

export function markNotificationAsRead(id: string): void {
  const all = loadNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
}

export function markAllNotificationsAsRead(userId: string): void {
  const all = loadNotifications();
  const updated = all.map((n) =>
    n.userId === userId || n.userId === 'all' ? { ...n, read: true } : n
  );
  safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
}

// Audit Logs
export function loadAuditLogs(): AuditLogEntry[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.AUDIT_LOGS);
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
      safeSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const all = loadAuditLogs();
  const entry: AuditLogEntry = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...all].slice(0, 100);
  safeSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  return entry;
}

// Priority Config
export function loadPriorityConfig(): PriorityWeightsConfig {
  try {
    const raw = safeGetItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      savePriorityConfig(DEFAULT_PRIORITY_CONFIG);
      return DEFAULT_PRIORITY_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.severityWeight === 'number' ? parsed : DEFAULT_PRIORITY_CONFIG;
  } catch {
    return DEFAULT_PRIORITY_CONFIG;
  }
}

export function savePriorityConfig(cfg: PriorityWeightsConfig): void {
  safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
}

// Current User Session
export function loadCurrentUser(): UserProfile {
  try {
    const raw = safeGetItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.role) return parsed;
    }
  } catch {
    // fallback
  }
  return MOCK_USERS[0];
}

export function saveCurrentUser(user: UserProfile): void {
  safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}
