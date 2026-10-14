import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  CivicReport,
  IssueCategory,
  ReportStatus,
  ResolutionEvidence,
} from '../../types/civic';
import { getStatusBadgeColor, VALID_TRANSITIONS } from '../../utils/statusTransitions';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  UserCheck,
  ShieldAlert,
  Send,
  FileCheck,
  Camera,
  Layers,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';

interface OfficerDashboardProps {
  onSelectReport: (id: string) => void;
}

const TEAMS = [
  'Roads & Structural Maintenance',
  'Sanitation & Solid Waste Management',
  'Water & Sewage Directorate',
  'Electrical & Lighting Utility',
  'Urban Parks & Public Spaces',
  'Rapid Emergency Response Squad',
];

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onSelectReport }) => {
  const { role, currentUser } = useAuth();
  const {
    reports,
    priorityConfig,
    updateReportStatus,
    assignReportTeam,
    addInternalOfficerNote,
    recordResolution,
  } = useReports();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  // Action Drawer / Modal State
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [actionTab, setActionTab] = useState<'status' | 'assign' | 'note' | 'resolve'>('status');

  // Action Form States
  const [newStatus, setNewStatus] = useState<ReportStatus>('In Progress');
  const [publicUpdate, setPublicUpdate] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<string>(TEAMS[0]);
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Keyboard accessibility: Close drawer on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeReportId) {
        setActiveReportId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReportId]);

  const activeReport = useMemo(() => {
    if (!activeReportId) return null;
    return reports.find((r) => r.id === activeReportId) || null;
  }, [activeReportId, reports]);

  // SLA Calculation: check if hours since creation exceeds target
  const getSlaStatus = (rep: CivicReport) => {
    if (rep.status === 'Resolved' || rep.status === 'Closed') {
      return { isOverdue: false, remainingHours: 0 };
    }
    const createdTime = new Date(rep.createdAt).getTime();
    const elapsedHours = (Date.now() - createdTime) / (1000 * 60 * 60);

    let targetHours = priorityConfig.slaHours.low;
    if (rep.priority.band === 'Critical') targetHours = priorityConfig.slaHours.critical;
    else if (rep.priority.band === 'High') targetHours = priorityConfig.slaHours.high;
    else if (rep.priority.band === 'Medium') targetHours = priorityConfig.slaHours.medium;

    const remaining = Math.round(targetHours - elapsedHours);
    return {
      isOverdue: remaining < 0,
      remainingHours: remaining,
      targetHours,
    };
  };

  // KPI Metrics
  const totalReports = reports.length;
  const newReportsCount = reports.filter((r) => r.status === 'Submitted').length;
  const pendingReportsCount = reports.filter((r) => ['Under Review', 'Assigned', 'In Progress'].includes(r.status)).length;
  const criticalReportsCount = reports.filter((r) => r.priority.band === 'Critical' && r.status !== 'Resolved' && r.status !== 'Closed').length;
  const humanReviewCount = reports.filter((r) => r.priority.requiresImmediateHumanReview && r.status !== 'Resolved' && r.status !== 'Closed').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved' || r.status === 'Closed').length;
  const overdueCount = reports.filter((r) => getSlaStatus(r).isOverdue).length;

  // Filtered & Sorted Table
  const filteredReports = useMemo(() => {
    let result = reports.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && r.priority.band !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesCat = r.category.toLowerCase().includes(q);
        const matchesDesc = r.citizenDescription.toLowerCase().includes(q);
        const matchesAddress = r.location.address.toLowerCase().includes(q);
        if (!matchesId && !matchesCat && !matchesDesc && !matchesAddress) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority.totalScore - a.priority.totalScore;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [reports, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  // Handlers
  const handleStatusUpdate = () => {
    if (!activeReport) return;
    if (!publicUpdate.trim()) {
      setActionError('Please provide a public update message describing the change.');
      return;
    }

    const res = updateReportStatus(activeReport.id, newStatus, publicUpdate.trim(), internalNote.trim());
    if (!res.success) {
      setActionError(res.error || 'Failed to update status.');
    } else {
      setActionSuccess('Status updated and notification dispatched.');
      setPublicUpdate('');
      setInternalNote('');
      setTimeout(() => setActiveReportId(null), 1200);
    }
  };

  const handleAssignTeam = () => {
    if (!activeReport) return;
    assignReportTeam(activeReport.id, assignedTeam, currentUser.name);
    setActionSuccess(`Assigned to ${assignedTeam}. Work order issued.`);
    setTimeout(() => setActiveReportId(null), 1200);
  };

  const handleAddNote = () => {
    if (!activeReport || !internalNote.trim()) return;
    addInternalOfficerNote(activeReport.id, internalNote.trim());
    setActionSuccess('Internal engineering note logged securely.');
    setInternalNote('');
    setTimeout(() => setActiveReportId(null), 1000);
  };

  const handleResolve = () => {
    if (!activeReport) return;
    if (!resolutionSummary.trim()) {
      setActionError('Resolution description is required.');
      return;
    }

    const evidence: ResolutionEvidence = {
      resolvedAt: new Date().toISOString(),
      resolvedByOfficerId: currentUser.id,
      resolvedByOfficerName: currentUser.name,
      resolutionSummary: resolutionSummary.trim(),
      resolutionPhotoUrl: resolutionPhotoUrl || undefined,
      verificationMethod: 'On-site municipal engineering inspection and verified photo evidence',
    };

    const res = recordResolution(activeReport.id, evidence);
    if (!res.success) {
      setActionError(res.error || 'Failed to certify resolution.');
    } else {
      setActionSuccess('Complaint verified and marked as Resolved.');
      setTimeout(() => setActiveReportId(null), 1200);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Complaint ID',
      'Category',
      'Status',
      'Priority Band',
      'Priority Score',
      'Safety Risk Score',
      'Address',
      'Neighborhood',
      'Latitude',
      'Longitude',
      'Reporter',
      'Created At',
      'Assigned Team',
    ];
    const rows = filteredReports.map((r) => [
      r.id,
      `"${r.category.replace(/"/g, '""')}"`,
      r.status,
      r.priority.band,
      r.priority.totalScore,
      r.priority.factors.publicSafetyRisk.contribution,
      `"${r.location.address.replace(/"/g, '""')}"`,
      `"${(r.location.neighborhood || '').replace(/"/g, '""')}"`,
      r.location.latitude ?? '',
      r.location.longitude ?? '',
      `"${r.reporterName.replace(/"/g, '""')}"`,
      r.createdAt,
      `"${(r.assignedTeam || 'Unassigned').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CivicAI_WorkOrders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Operations Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authenticated officer triage, work order dispatch, and SLA resolution tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Active Officer:</span>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-900 text-teal-300 rounded-lg font-mono">
            {currentUser.name} ({currentUser.department || 'Public Works'})
          </span>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            New / Unassigned
          </span>
          <div className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums">{newReportsCount}</div>
          <span className="text-xs text-slate-500 mt-2 block">Awaiting engineering review</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Critical Severity
          </span>
          <div className="text-3xl font-extrabold text-rose-700 font-mono tabular-nums">{criticalReportsCount}</div>
          <span className="text-xs text-slate-500 mt-2 block">Score ≥ 80 or high safety risk</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Overdue SLAs
          </span>
          <div className={`text-3xl font-extrabold font-mono tabular-nums ${overdueCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <span className="text-xs text-slate-500 mt-2 block">Exceeded response threshold</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Resolved to Date
          </span>
          <div className="text-3xl font-extrabold text-teal-700 font-mono tabular-nums">{resolvedCount}</div>
          <span className="text-xs text-slate-500 mt-2 block">Verified with photo proofs</span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search complaint ID, category, road address, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical Band</option>
              <option value="High">High Band</option>
              <option value="Medium">Medium Band</option>
              <option value="Low">Low Band</option>
            </select>

            <button
              onClick={() => setSortBy((s) => (s === 'priority' ? 'date' : 'priority'))}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort: {sortBy === 'priority' ? 'Priority Score' : 'Submission Date'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-teal-200 cursor-pointer"
              title="Download filtered complaint work orders as CSV"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Triage Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Category &amp; Location</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">SLA Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Unit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.map((rep) => {
                const badge = getStatusBadgeColor(rep.status);
                const sla = getSlaStatus(rep);
                return (
                  <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <button
                        onClick={() => onSelectReport(rep.id)}
                        className="hover:text-teal-700 hover:underline cursor-pointer"
                      >
                        {rep.id}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{rep.category}</div>
                      <div className="text-[11px] text-slate-500 truncate">{rep.location.address}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`font-mono font-extrabold px-2 py-0.5 rounded text-[11px] ${
                          rep.priority.band === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : rep.priority.band === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rep.priority.totalScore} ({rep.priority.band})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {rep.status === 'Resolved' || rep.status === 'Closed' ? (
                        <span className="text-teal-700 font-semibold font-mono text-[11px]">RESOLVED</span>
                      ) : sla.isOverdue ? (
                        <span className="text-rose-700 font-bold font-mono text-[11px] bg-rose-50 px-1.5 py-0.5 rounded">
                          OVERDUE ({Math.abs(sla.remainingHours)}h)
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">
                          {sla.remainingHours}h remaining
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border}`}>
                        {rep.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 text-xs max-w-[160px] truncate">
                      {rep.assignedTeam || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setActiveReportId(rep.id);
                          setNewStatus(rep.status);
                          setActionError('');
                          setActionSuccess('');
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-teal-700 rounded-md transition-colors cursor-pointer"
                      >
                        Triage / Dispatch
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {activeReport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="work-order-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs font-bold text-teal-700 uppercase">Municipal Work Order</span>
                <h3 id="work-order-title" className="text-base font-extrabold text-slate-900 mt-0.5">
                  {activeReport.id} — {activeReport.category}
                </h3>
              </div>
              <button
                onClick={() => setActiveReportId(null)}
                aria-label="Close work order dialog"
                className="text-slate-400 hover:text-slate-700 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Action Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['status', 'assign', 'note', 'resolve'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setActionTab(t);
                    setActionError('');
                    setActionSuccess('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors capitalize cursor-pointer ${
                    actionTab === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'status' ? 'Update Status' : t === 'assign' ? 'Assign Team' : t === 'note' ? 'Log Note' : 'Resolve'}
                </button>
              ))}
            </div>

            {/* Tab 1: Update Status */}
            {actionTab === 'status' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    {(VALID_TRANSITIONS[activeReport.status] || []).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Public Update Message (Citizen Visible) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={publicUpdate}
                    onChange={(e) => setPublicUpdate(e.target.value)}
                    placeholder="e.g. Work crew dispatched with asphalt compactor to seal road surface."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Optional Internal Engineering Note
                  </label>
                  <textarea
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Protected notes visible only to municipal staff."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  onClick={handleStatusUpdate}
                  className="w-full py-2.5 bg-slate-950 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Status Update
                </button>
              </div>
            )}

            {/* Tab 2: Assign Team */}
            {actionTab === 'assign' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Specialized Municipal Directorate
                  </label>
                  <select
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    {TEAMS.map((tm) => (
                      <option key={tm} value={tm}>
                        {tm}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssignTeam}
                  className="w-full py-2.5 bg-slate-950 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Issue Work Order
                </button>
              </div>
            )}

            {/* Tab 3: Log Note */}
            {actionTab === 'note' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Internal Engineer Log
                  </label>
                  <textarea
                    rows={4}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Record field inspection measurements, contractor permits, utility coordination..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  onClick={handleAddNote}
                  className="w-full py-2.5 bg-slate-950 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Internal Note
                </button>
              </div>
            )}

            {/* Tab 4: Certify Resolution */}
            {actionTab === 'resolve' && (
              <div className="space-y-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
                  <span className="font-bold">Formal Resolution Certification: </span>
                  Recording a report as resolved preserves timestamp, officer identity, and inspection proof.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Resolution Summary <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="e.g. Asphalt hot-mix patch applied, rolled to 10cm density. Lane reopened safely."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  onClick={handleResolve}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Certify &amp; Mark Resolved
                </button>
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-lg bg-teal-50 text-teal-800 text-xs border border-teal-200 font-semibold">
                {actionSuccess}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
