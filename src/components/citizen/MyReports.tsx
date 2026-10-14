import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { CivicReport, IssueCategory, ReportStatus } from '../../types/civic';
import { getStatusBadgeColor } from '../../utils/statusTransitions';
import { SvgVisual } from '../common/SvgVisual';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Clock,
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MyReportsProps {
  onSelectReport: (id: string) => void;
  onNavigateToReport: () => void;
  initialCategory?: IssueCategory;
}

export const MyReports: React.FC<MyReportsProps> = ({
  onSelectReport,
  onNavigateToReport,
  initialCategory,
}) => {
  const { currentUser } = useAuth();
  const { reports } = useReports();

  const [tab, setTab] = useState<'my' | 'public'>('my');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Tab filter
      if (tab === 'my' && rep.reporterId !== currentUser.id) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && rep.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter !== 'ALL' && rep.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = rep.id.toLowerCase().includes(q);
        const matchesDesc = rep.citizenDescription.toLowerCase().includes(q);
        const matchesLoc = rep.location.address.toLowerCase().includes(q);
        const matchesCat = rep.category.toLowerCase().includes(q);
        if (!matchesId && !matchesDesc && !matchesLoc && !matchesCat) return false;
      }

      return true;
    });
  }, [reports, tab, currentUser.id, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaints &amp; Public Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track real-time inspection, dispatch status, and resolution evidence
          </p>
        </div>

        <button
          onClick={onNavigateToReport}
          className="px-5 py-2.5 bg-slate-950 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-teal-400" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Segmented Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            tab === 'my'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Submissions ({reports.filter((r) => r.reporterId === currentUser.id).length})
        </button>
        <button
          onClick={() => setTab('public')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            tab === 'public'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Public Issues ({reports.length})
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ID (e.g. CIVIC-2026-A1092), address, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Pothole or damaged road">Potholes &amp; Road</option>
              <option value="Garbage accumulation">Garbage &amp; Waste</option>
              <option value="Blocked drainage or waterlogging">Drainage &amp; Flooding</option>
              <option value="Damaged streetlight">Streetlights</option>
              <option value="Water leakage">Water Pipe Leaks</option>
              <option value="Damaged sidewalk">Sidewalks &amp; Curbs</option>
              <option value="Other civic infrastructure issue">Other Infrastructure</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Feed */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No matching complaints found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try adjusting your category filter, status filter, or search keywords.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="text-xs font-semibold text-teal-700 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((rep) => {
            const badge = getStatusBadgeColor(rep.status);
            return (
              <div
                key={rep.id}
                onClick={() => onSelectReport(rep.id)}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{rep.id}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border}`}>
                      {rep.status}
                    </span>
                  </div>

                  <SvgVisual category={rep.category} className="w-full h-32 rounded-lg mb-3" />

                  <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{rep.category}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{rep.citizenDescription}</p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{rep.location.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>Priority:</span>
                    <span className={`font-bold ${
                      rep.priority.band === 'Critical' ? 'text-rose-600' :
                      rep.priority.band === 'High' ? 'text-amber-600' : 'text-slate-700'
                    }`}>
                      {rep.priority.band} ({rep.priority.totalScore})
                    </span>
                    <span>·</span>
                    <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>{rep.statusHistory.length} status {rep.statusHistory.length === 1 ? 'log' : 'logs'}</span>
                  <span className="font-medium text-teal-700 flex items-center gap-1">
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
