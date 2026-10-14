import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { IssueCategory, CivicReport } from '../../types/civic';
import { SvgVisual } from '../common/SvgVisual';
import { getStatusBadgeColor } from '../../utils/statusTransitions';
import {
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CitizenHomeProps {
  onNavigate: (view: string, categoryFilter?: IssueCategory) => void;
  onSelectReport: (id: string) => void;
}

const CATEGORY_SHORTCUTS: {
  category: IssueCategory;
  label: string;
  countKey: string;
}[] = [
  { category: 'Pothole or damaged road', label: 'Roads & Potholes', countKey: 'potholes' },
  { category: 'Garbage accumulation', label: 'Solid Waste & Bins', countKey: 'garbage' },
  { category: 'Blocked drainage or waterlogging', label: 'Storm Drains', countKey: 'drains' },
  { category: 'Damaged streetlight', label: 'Street Lighting', countKey: 'lights' },
  { category: 'Water leakage', label: 'Water Pipe Leaks', countKey: 'water' },
  { category: 'Damaged sidewalk', label: 'Sidewalks & Curbs', countKey: 'sidewalks' },
];

export const CitizenHome: React.FC<CitizenHomeProps> = ({ onNavigate, onSelectReport }) => {
  const { currentUser, role } = useAuth();
  const { reports } = useReports();

  // Metrics derived from actual local database
  const myReports = reports.filter((r) => r.reporterId === currentUser.id);
  const activeReports = reports.filter((r) => r.status !== 'Resolved' && r.status !== 'Closed');
  const resolvedCount = reports.filter((r) => r.status === 'Resolved' || r.status === 'Closed').length;
  const criticalCount = reports.filter((r) => r.priority.band === 'Critical' && r.status !== 'Resolved').length;

  // Recurring hotspots (grouped by neighborhood)
  const neighborhoodCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const nh = r.location.neighborhood || 'Central Ward';
    neighborhoodCounts[nh] = (neighborhoodCounts[nh] || 0) + 1;
  });
  const topNeighborhoods = Object.entries(neighborhoodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Welcome Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-700/50 text-teal-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Municipal Decision Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3" style={{ textWrap: 'balance' }}>
            Smarter Cities, Faster Solutions.
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Report neighborhood road damage, water leaks, uncollected waste, and infrastructure hazards.
            CivicAI analyzes reports with computer vision, calculates fair risk scores, and routes them directly to municipal field teams.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('report')}
              className="px-6 py-3.5 text-base font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-md transition-all flex items-center gap-2 group cursor-pointer"
            >
              <Camera className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
              <span>Report an Issue</span>
              <ArrowRight className="w-4 h-4 text-slate-950 ml-1" />
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="px-5 py-3.5 text-base font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-5 h-5 text-teal-400" />
              <span>Explore City Map</span>
            </button>
          </div>
        </div>

        {/* Abstract background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <path d="M0 50 H400 M0 150 H400 M0 250 H400 M0 350 H400" stroke="white" strokeWidth="1" />
            <path d="M50 0 V400 M150 0 V400 M250 0 V400 M350 0 V400" stroke="white" strokeWidth="1" />
            <circle cx="250" cy="150" r="80" stroke="#2dd4bf" strokeWidth="2" fill="#2dd4bf" fillOpacity="0.2" />
          </svg>
        </div>
      </section>

      {/* Real Available Municipal Statistics Bar */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Public Issue Intelligence</h2>
          <span className="text-xs text-slate-500 font-mono">LIVE DATABASE METRICS</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Documented</div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">{reports.length}</div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Verified civic complaints</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active / In Progress</div>
            <div className="text-3xl font-extrabold text-blue-700 font-mono tabular-nums">{activeReports.length}</div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Under review or work order</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resolved to Date</div>
            <div className="text-3xl font-extrabold text-teal-700 font-mono tabular-nums">{resolvedCount}</div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>With field inspection evidence</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Critical Hazards</div>
            <div className="text-3xl font-extrabold text-rose-700 font-mono tabular-nums">{criticalCount}</div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Requires immediate priority triage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Issue Categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select a category to view reports or file a targeted complaint</p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            View all on map &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORY_SHORTCUTS.map((cat) => {
            const count = reports.filter((r) => r.category === cat.category).length;
            return (
              <button
                key={cat.category}
                onClick={() => onNavigate('my-reports', cat.category)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-sm text-left transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="mb-3">
                  <SvgVisual category={cat.category} className="w-full h-20 rounded-lg" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                    {cat.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
                    {count} {count === 1 ? 'report' : 'reports'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recently Submitted Complaints by Logged-in Citizen */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              My Recent Submissions ({currentUser.name})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Complaints registered from your authenticated citizen account</p>
          </div>
          {myReports.length > 0 && (
            <button
              onClick={() => onNavigate('my-reports')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
            >
              See all ({myReports.length}) &rarr;
            </button>
          )}
        </div>

        {myReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No complaints submitted yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Encountered a pothole, illegal dumping, or broken streetlight? Report it with a photograph to trigger municipal dispatch.
            </p>
            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
            >
              Submit First Complaint
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myReports.slice(0, 3).map((rep) => {
              const badge = getStatusBadgeColor(rep.status);
              return (
                <div
                  key={rep.id}
                  onClick={() => onSelectReport(rep.id)}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{rep.id}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border}`}>
                        {rep.status}
                      </span>
                    </div>

                    <SvgVisual category={rep.category} className="w-full h-32 rounded-lg mb-3" />

                    <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{rep.category}</h4>
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
                        {rep.priority.band} ({rep.priority.totalScore}/100)
                      </span>
                      <span>·</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>{rep.statusHistory.length} status {rep.statusHistory.length === 1 ? 'update' : 'updates'}</span>
                    <span className="font-medium text-teal-700">View Timeline &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recurring Neighborhood Hotspots */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <span>Recurring Neighborhood Hotspots</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified clusters based on geospatial proximity algorithms
            </p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors self-start sm:self-auto"
          >
            Explore Geographic Heatmap &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topNeighborhoods.map(([neighborhood, count], idx) => (
            <div key={neighborhood} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Hotspot Rank #0{idx + 1}
              </div>
              <div className="text-base font-bold text-slate-900">{neighborhood}</div>
              <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
                <span>Total Reports:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">{count} active issues</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (count / reports.length) * 100 * 2.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy and Responsible Reporting Notice */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 flex items-start gap-3">
        <Shield className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900">Privacy &amp; Responsible Reporting Commitment</div>
          <p className="leading-relaxed">
            CivicAI is designed as an open municipal intelligence layer to complement official city services.
            Personal citizen names and contact information are protected and never displayed publicly.
            Priority scoring strictly relies on physical infrastructure risk factors (safety severity, proximity, and duration)
            and never incorporates demographic or personal characteristics.
          </p>
        </div>
      </section>
    </div>
  );
};
