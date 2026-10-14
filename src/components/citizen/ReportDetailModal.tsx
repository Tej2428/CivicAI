import React, { useState } from 'react';
import { CivicReport, ReportStatus, UserRole } from '../../types/civic';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { getStatusBadgeColor, STATUS_ORDER } from '../../utils/statusTransitions';
import { SvgVisual } from '../common/SvgVisual';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  FileText,
  Lock,
  Camera,
  ExternalLink,
} from 'lucide-react';

interface ReportDetailModalProps {
  report: CivicReport;
  onClose: () => void;
  onOpenOfficerActions?: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onOpenOfficerActions,
}) => {
  const { role, currentUser } = useAuth();
  const badge = getStatusBadgeColor(report.status);
  const isOfficerOrAdmin = role === 'officer' || role === 'admin';

  // Check if citizen is viewing their own report
  const isOwner = currentUser.id === report.reporterId;

  // Keyboard accessibility: Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-report-id"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span id="modal-report-id" className="font-mono text-base font-extrabold text-slate-900">{report.id}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border}`}>
              {report.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOfficerOrAdmin && onOpenOfficerActions && (
              <button
                onClick={onOpenOfficerActions}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
              >
                Officer Actions
              </button>
            )}
            <button
              onClick={onClose}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Top Grid: Photo + Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[220px]">
              {report.photoUrl.startsWith('data:image/svg') ? (
                <SvgVisual category={report.category} className="w-full h-full min-h-[220px]" />
              ) : (
                <img
                  src={report.photoUrl}
                  alt={`Photograph evidence for ${report.id}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase block mb-0.5">Category</span>
                <span className="text-base font-extrabold text-slate-900">{report.category}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase block mb-0.5">Location</span>
                <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div>{report.location.address}</div>
                    {report.location.landmark && (
                      <div className="text-slate-500 text-[11px] mt-0.5">Landmark: {report.location.landmark}</div>
                    )}
                    {report.location.latitude && (
                      <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                        {report.location.latitude.toFixed(4)}, {report.location.longitude?.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold uppercase block mb-0.5">Submitted On</span>
                  <span className="font-mono text-slate-700">{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold uppercase block mb-0.5">Assigned Unit</span>
                  <span className="font-semibold text-slate-900">{report.assignedTeam || 'Triage Queue'}</span>
                </div>
              </div>

              {/* Priority badge */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-semibold uppercase block mb-1">Suggested Priority</span>
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold text-sm ${
                    report.priority.band === 'Critical' ? 'text-rose-600' :
                    report.priority.band === 'High' ? 'text-amber-600' : 'text-slate-800'
                  }`}>
                    {report.priority.band} Priority ({report.priority.totalScore}/100)
                  </span>
                  {report.priority.requiresImmediateHumanReview && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      SAFETY REVIEW REQUIRED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Description */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Citizen Problem Statement</h4>
            <p className="text-sm text-slate-800 leading-relaxed">{report.citizenDescription}</p>
          </div>

          {/* Explainable Priority Score Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Explainable Priority Assessment Breakdown</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Updated {new Date(report.priority.lastAssessedAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{report.priority.explanation}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Severity (40%)</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {report.priority.factors.severity.score}/100
                </span>
                <span className="text-[10px] text-slate-500 block">+{report.priority.factors.severity.contribution} pts</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Safety Hazard (30%)</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {report.priority.factors.publicSafetyRisk.score}/100
                </span>
                <span className="text-[10px] text-slate-500 block">+{report.priority.factors.publicSafetyRisk.contribution} pts</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration (20%)</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {report.priority.factors.unresolvedDuration.score}/100
                </span>
                <span className="text-[10px] text-slate-500 block">+{report.priority.factors.unresolvedDuration.contribution} pts</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cluster Freq (10%)</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {report.priority.factors.nearbyFrequency.score}/100
                </span>
                <span className="text-[10px] text-slate-500 block">+{report.priority.factors.nearbyFrequency.contribution} pts</span>
              </div>
            </div>
          </div>

          {/* AI Evidence Triage Box */}
          {report.aiAssessment && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>AI Visual Evidence Analysis</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {report.aiAssessment.isSimulatedDemo ? 'DEMO SIMULATION' : 'GEMINI 3.8 FLASH'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{report.aiAssessment.visibleEvidence}</p>
              <div className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <span className="font-bold">Safety Assessment: </span>
                {report.aiAssessment.publicSafetyConcerns}
              </div>
            </div>
          )}

          {/* Resolution Evidence (If resolved) */}
          {report.resolution && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Municipal Resolution Evidence</span>
                </h4>
                <span className="text-xs font-mono text-teal-800">
                  {new Date(report.resolution.resolvedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-teal-900 font-medium leading-relaxed">
                {report.resolution.resolutionSummary}
              </p>

              <div className="text-xs text-teal-800 space-y-1 pt-2 border-t border-teal-200">
                <div>
                  <span className="font-bold">Certified by: </span>
                  {report.resolution.resolvedByOfficerName}
                </div>
                <div>
                  <span className="font-bold">Verification: </span>
                  {report.resolution.verificationMethod}
                </div>
              </div>

              {report.resolution.resolutionPhotoUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-teal-300 max-h-48 bg-slate-900">
                  <img
                    src={report.resolution.resolutionPhotoUrl}
                    alt="Resolution completion proof"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Status Timeline History */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status History &amp; Public Log</h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {report.statusHistory.map((item, idx) => (
                <div key={item.id} className="relative text-xs space-y-1">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span className="font-bold text-slate-900 uppercase">{item.newStatus}</span>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 text-xs">{item.publicUpdate}</p>
                  <div className="text-[11px] text-slate-400 font-medium">Actor: {item.actorName} ({item.actorRole})</div>
                </div>
              ))}
            </div>
          </div>

          {/* Protected Internal Officer Notes (Visible only to authorized officers & admin) */}
          {isOfficerOrAdmin && (
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Internal Municipal Officer Notes (Protected)</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">RESTRICTED ACCESS</span>
              </div>

              {report.internalNotes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No internal engineering notes recorded.</p>
              ) : (
                <div className="space-y-2">
                  {report.internalNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-800 rounded-lg text-xs space-y-1 border border-slate-700">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                        <span className="font-bold text-slate-200">{note.authorName}</span>
                        <span>{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
