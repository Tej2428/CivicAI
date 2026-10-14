import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  CivicReport,
  InAppNotification,
  IssueCategory,
  PriorityWeightsConfig,
  ReportStatus,
  ResolutionEvidence,
  UserRole,
} from '../types/civic';
import {
  addAuditLog,
  addNotification,
  addReport,
  loadNotifications,
  loadPriorityConfig,
  loadReports,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  resetDemoData as resetStorageDemoData,
  savePriorityConfig,
  updateReport,
} from '../utils/storage';
import { computePriorityScore, DEFAULT_PRIORITY_CONFIG } from '../utils/priorityScorer';
import { canUserTransitionStatus } from '../utils/statusTransitions';
import { useAuth } from './AuthContext';

interface ReportContextType {
  reports: CivicReport[];
  notifications: InAppNotification[];
  unreadNotificationCount: number;
  priorityConfig: PriorityWeightsConfig;
  selectedReportId: string | null;
  selectedReport: CivicReport | null;
  setSelectedReportId: (id: string | null) => void;
  createNewReport: (report: Omit<CivicReport, 'statusHistory' | 'internalNotes' | 'createdAt' | 'updatedAt'>) => CivicReport;
  updateReportStatus: (
    reportId: string,
    newStatus: ReportStatus,
    publicUpdate: string,
    internalNote?: string
  ) => { success: boolean; error?: string };
  assignReportTeam: (reportId: string, team: string, officerName?: string) => void;
  addInternalOfficerNote: (reportId: string, note: string) => void;
  recordResolution: (reportId: string, evidence: ResolutionEvidence) => { success: boolean; error?: string };
  updatePriorityConfig: (newConfig: PriorityWeightsConfig) => void;
  resetAllDemoData: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshData: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();
  const [reports, setReports] = useState<CivicReport[]>(() => loadReports());
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => loadNotifications(currentUser.id));
  const [priorityConfig, setPriorityConfig] = useState<PriorityWeightsConfig>(() => loadPriorityConfig());
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const refreshData = () => {
    setReports(loadReports());
    setNotifications(loadNotifications(currentUser.id));
    setPriorityConfig(loadPriorityConfig());
  };

  useEffect(() => {
    setNotifications(loadNotifications(currentUser.id));
  }, [currentUser.id]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [selectedReportId, reports]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const createNewReport = (
    data: Omit<CivicReport, 'statusHistory' | 'internalNotes' | 'createdAt' | 'updatedAt'>
  ): CivicReport => {
    const now = new Date().toISOString();
    const newReport: CivicReport = {
      ...data,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: `sh_${Date.now()}_init`,
          newStatus: data.status || 'Submitted',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          timestamp: now,
          publicUpdate: 'Complaint registered by citizen with initial photographic evidence.',
        },
      ],
      internalNotes: [],
    };

    addReport(newReport);
    setReports(loadReports());
    setNotifications(loadNotifications(currentUser.id));
    return newReport;
  };

  const updateReportStatus = (
    reportId: string,
    newStatus: ReportStatus,
    publicUpdate: string,
    internalNote?: string
  ): { success: boolean; error?: string } => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return { success: false, error: 'Complaint not found.' };

    const check = canUserTransitionStatus(role, target.status, newStatus);
    if (!check.allowed) {
      return { success: false, error: check.reason || 'Unauthorized status transition.' };
    }

    const now = new Date().toISOString();
    const newHistoryEntry = {
      id: `sh_${Date.now()}`,
      previousStatus: target.status,
      newStatus,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      timestamp: now,
      publicUpdate,
      internalNote,
    };

    const newInternalNotes = [...target.internalNotes];
    if (internalNote && internalNote.trim()) {
      newInternalNotes.push({
        id: `note_${Date.now()}`,
        authorName: currentUser.name,
        note: internalNote.trim(),
        timestamp: now,
      });
    }

    const updated: CivicReport = {
      ...target,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...target.statusHistory, newHistoryEntry],
      internalNotes: newInternalNotes,
    };

    updateReport(updated);
    setReports(loadReports());

    // Audit log
    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'UPDATE_STATUS',
      targetId: reportId,
      targetType: 'report',
      details: `Status updated from "${target.status}" to "${newStatus}". Update: ${publicUpdate}`,
    });

    // Notify citizen
    addNotification({
      userId: target.reporterId,
      reportId: target.id,
      title: `Complaint Status Updated: ${newStatus}`,
      message: `Your complaint #${target.id} was updated to "${newStatus}". ${publicUpdate}`,
      type: 'status_change',
    });

    setNotifications(loadNotifications(currentUser.id));
    return { success: true };
  };

  const assignReportTeam = (reportId: string, team: string, officerName?: string) => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;

    const now = new Date().toISOString();
    const updated: CivicReport = {
      ...target,
      assignedTeam: team,
      assignedOfficerName: officerName || currentUser.name,
      status: target.status === 'Submitted' ? 'Assigned' : target.status,
      updatedAt: now,
      statusHistory: [
        ...target.statusHistory,
        {
          id: `sh_${Date.now()}`,
          previousStatus: target.status,
          newStatus: target.status === 'Submitted' ? 'Assigned' : target.status,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          timestamp: now,
          publicUpdate: `Assigned to specialized response unit: ${team}.`,
        },
      ],
    };

    updateReport(updated);
    setReports(loadReports());

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'ASSIGN_TEAM',
      targetId: reportId,
      targetType: 'report',
      details: `Assigned complaint #${reportId} to team "${team}"`,
    });

    addNotification({
      userId: target.reporterId,
      reportId: target.id,
      title: `Team Assigned`,
      message: `Your complaint #${target.id} has been dispatched to ${team}.`,
      type: 'assignment',
    });

    setNotifications(loadNotifications(currentUser.id));
  };

  const addInternalOfficerNote = (reportId: string, note: string) => {
    if (role === 'citizen') return;
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;

    const updated: CivicReport = {
      ...target,
      internalNotes: [
        ...target.internalNotes,
        {
          id: `note_${Date.now()}`,
          authorName: currentUser.name,
          note: note.trim(),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    updateReport(updated);
    setReports(loadReports());

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'ADD_INTERNAL_NOTE',
      targetId: reportId,
      targetType: 'report',
      details: `Added internal officer note on complaint #${reportId}`,
    });
  };

  const recordResolution = (
    reportId: string,
    evidence: ResolutionEvidence
  ): { success: boolean; error?: string } => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return { success: false, error: 'Complaint not found.' };

    if (role === 'citizen') {
      return { success: false, error: 'Only authorized officers can certify resolution.' };
    }

    const now = new Date().toISOString();
    const updated: CivicReport = {
      ...target,
      status: 'Resolved',
      resolution: evidence,
      updatedAt: now,
      statusHistory: [
        ...target.statusHistory,
        {
          id: `sh_${Date.now()}`,
          previousStatus: target.status,
          newStatus: 'Resolved',
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          timestamp: now,
          publicUpdate: `Issue resolved: ${evidence.resolutionSummary}`,
        },
      ],
    };

    updateReport(updated);
    setReports(loadReports());

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'RESOLVE_REPORT',
      targetId: reportId,
      targetType: 'report',
      details: `Marked complaint #${reportId} as Resolved. Summary: ${evidence.resolutionSummary}`,
    });

    addNotification({
      userId: target.reporterId,
      reportId: target.id,
      title: `Complaint Resolved!`,
      message: `Your complaint #${target.id} (${target.category}) has been verified resolved. Thank you for reporting!`,
      type: 'resolution',
    });

    setNotifications(loadNotifications(currentUser.id));
    return { success: true };
  };

  const updatePriorityConfig = (newConfig: PriorityWeightsConfig) => {
    savePriorityConfig(newConfig);
    setPriorityConfig(newConfig);

    // Recalculate priority scores across all active reports
    const current = loadReports();
    const recalculated = current.map((rep) => {
      const recalculatedPriority = computePriorityScore({
        severityScore: rep.aiAssessment?.severityScore || 50,
        publicSafetyRiskScore: rep.aiAssessment?.publicSafetyRiskScore || 50,
        createdAtIso: rep.createdAt,
        nearbyRecentCount: 2,
        config: newConfig,
        forceHumanReview: rep.aiAssessment?.recommendedHumanReview,
      });
      return {
        ...rep,
        priority: recalculatedPriority,
      };
    });
    setReports(recalculated);

    addAuditLog({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'UPDATE_PRIORITY_CONFIG',
      targetId: 'config',
      targetType: 'config',
      details: `Updated priority weights: Sev=${newConfig.severityWeight}, Safety=${newConfig.safetyRiskWeight}, Duration=${newConfig.durationWeight}, Freq=${newConfig.frequencyWeight}`,
    });
  };

  const resetAllDemoData = () => {
    resetStorageDemoData();
    setReports(loadReports());
    setNotifications(loadNotifications(currentUser.id));
    setSelectedReportId(null);
  };

  const markNotificationRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(loadNotifications(currentUser.id));
  };

  const markAllNotificationsRead = () => {
    markAllNotificationsAsRead(currentUser.id);
    setNotifications(loadNotifications(currentUser.id));
  };

  return (
    <ReportContext.Provider
      value={{
        reports,
        notifications,
        unreadNotificationCount,
        priorityConfig,
        selectedReportId,
        selectedReport,
        setSelectedReportId,
        createNewReport,
        updateReportStatus,
        assignReportTeam,
        addInternalOfficerNote,
        recordResolution,
        updatePriorityConfig,
        resetAllDemoData,
        markNotificationRead,
        markAllNotificationsRead,
        refreshData,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export function useReports() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}
