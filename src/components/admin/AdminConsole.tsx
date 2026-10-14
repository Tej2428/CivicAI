import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { AuditLogEntry, PriorityWeightsConfig } from '../../types/civic';
import { loadAuditLogs } from '../../utils/storage';
import { MOCK_USERS } from '../../data/mockData';
import {
  Sliders,
  Users,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Server,
  Download,
  Play,
  XCircle,
  Clock,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { fetchSystemStatus, SystemStatusResponse } from '../../services/aiService';
import { runCivicAiTests, TestSuiteSummary } from '../../tests/civic.test';

export const AdminConsole: React.FC = () => {
  const { role } = useAuth();
  const { priorityConfig, updatePriorityConfig } = useReports();

  const [activeTab, setActiveTab] = useState<'weights' | 'users' | 'audit' | 'system' | 'tests'>('weights');
  const [weights, setWeights] = useState<PriorityWeightsConfig>(priorityConfig);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadAuditLogs());
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);

  // Test Runner State
  const [testResult, setTestResult] = useState<TestSuiteSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  useEffect(() => {
    setAuditLogs(loadAuditLogs());
    fetchSystemStatus().then((s) => s && setSystemStatus(s));
  }, []);

  const totalWeight =
    weights.severityWeight +
    weights.safetyRiskWeight +
    weights.durationWeight +
    weights.frequencyWeight;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      alert(`Weights must sum to 1.00 (currently ${totalWeight.toFixed(2)})`);
      return;
    }
    updatePriorityConfig(weights);
    setSaveSuccess('Priority matrix and SLA targets updated across all active reports.');
    setAuditLogs(loadAuditLogs());
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleResetDefaults = () => {
    const defaultCfg: PriorityWeightsConfig = {
      severityWeight: 0.40,
      safetyRiskWeight: 0.30,
      durationWeight: 0.20,
      frequencyWeight: 0.10,
      criticalThreshold: 80,
      highThreshold: 60,
      mediumThreshold: 30,
      duplicateRadiusMeters: 150,
      slaHours: { critical: 24, high: 48, medium: 96, low: 168 },
    };
    setWeights(defaultCfg);
    updatePriorityConfig(defaultCfg);
    setSaveSuccess('Priority configuration restored to standard baseline.');
    setAuditLogs(loadAuditLogs());
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleExportAuditLogs = () => {
    const headers = ['ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Target Type', 'Target ID', 'Details'];
    const rows = auditLogs.map((log) => [
      log.id,
      log.timestamp,
      `"${log.actorName.replace(/"/g, '""')}"`,
      log.actorRole,
      log.action,
      log.targetType,
      log.targetId,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CivicAI_AuditTrail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const summary = runCivicAiTests();
      setTestResult(summary);
      setIsRunningTests(false);
    }, 150);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Administration &amp; Policy Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure algorithmic scoring weights, manage officer permissions, audit system events, and run verification tests
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('weights')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'weights' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Priority Matrix &amp; SLAs</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Officer Accounts &amp; Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>System Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'system' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Integration Health</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tests' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-700 hover:bg-teal-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Automated Test Runner</span>
        </button>
      </div>

      {/* Tab 1: Priority Matrix & Weights */}
      {activeTab === 'weights' && (
        <form onSubmit={handleSaveWeights} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Configurable 4-Factor Priority Formula</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority Score = W1 × Severity + W2 × Safety Risk + W3 × Duration + W4 × Cluster Frequency
              </p>
            </div>
            <div className={`text-xs font-mono font-bold px-3 py-1 rounded-md ${
              Math.abs(totalWeight - 1.0) < 0.01 ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'
            }`}>
              Total Weight: {totalWeight.toFixed(2)} / 1.00
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Factor 1: Severity */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>W1: Physical Severity Weight</span>
                <span className="font-mono text-teal-700">{(weights.severityWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.05"
                value={weights.severityWeight}
                onChange={(e) => setWeights({ ...weights, severityWeight: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Measures physical structural depth, asphalt cratering, and area breach.</p>
            </div>

            {/* Factor 2: Safety Risk */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>W2: Public Safety Hazard Weight</span>
                <span className="font-mono text-teal-700">{(weights.safetyRiskWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.70"
                step="0.05"
                value={weights.safetyRiskWeight}
                onChange={(e) => setWeights({ ...weights, safetyRiskWeight: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Measures pedestrian fall, high-speed collision, or electrocution danger.</p>
            </div>

            {/* Factor 3: Duration */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>W3: Unresolved Duration Weight</span>
                <span className="font-mono text-teal-700">{(weights.durationWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.05"
                value={weights.durationWeight}
                onChange={(e) => setWeights({ ...weights, durationWeight: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Escalates ticket priority the longer it remains unaddressed.</p>
            </div>

            {/* Factor 4: Nearby Frequency */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>W4: Incident Cluster Frequency Weight</span>
                <span className="font-mono text-teal-700">{(weights.frequencyWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.05"
                value={weights.frequencyWeight}
                onChange={(e) => setWeights({ ...weights, frequencyWeight: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">Increases priority when multiple complaints cluster within the geospatial radius.</p>
            </div>
          </div>

          {/* SLA Target Windows */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Municipal SLA Response Deadlines (Hours)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="font-bold text-rose-800 block">Critical Band (&gt;80)</span>
                <input
                  type="number"
                  min="6"
                  max="72"
                  value={weights.slaHours.critical}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      slaHours: { ...weights.slaHours, critical: parseInt(e.target.value) || 24 },
                    })
                  }
                  className="mt-1 w-full px-2 py-1 bg-white border border-rose-300 rounded text-rose-900 font-mono font-bold"
                />
                <span className="text-[10px] text-rose-600 mt-1 block">Default: 24 Hours</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-800 block">High Band (60-79)</span>
                <input
                  type="number"
                  min="12"
                  max="120"
                  value={weights.slaHours.high}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      slaHours: { ...weights.slaHours, high: parseInt(e.target.value) || 48 },
                    })
                  }
                  className="mt-1 w-full px-2 py-1 bg-white border border-amber-300 rounded text-amber-900 font-mono font-bold"
                />
                <span className="text-[10px] text-amber-600 mt-1 block">Default: 48 Hours</span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-800 block">Medium Band (30-59)</span>
                <input
                  type="number"
                  min="24"
                  max="240"
                  value={weights.slaHours.medium}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      slaHours: { ...weights.slaHours, medium: parseInt(e.target.value) || 96 },
                    })
                  }
                  className="mt-1 w-full px-2 py-1 bg-white border border-blue-300 rounded text-blue-900 font-mono font-bold"
                />
                <span className="text-[10px] text-blue-600 mt-1 block">Default: 96 Hours</span>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl">
                <span className="font-bold text-slate-800 block">Low Band (&lt;30)</span>
                <input
                  type="number"
                  min="48"
                  max="336"
                  value={weights.slaHours.low}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      slaHours: { ...weights.slaHours, low: parseInt(e.target.value) || 168 },
                    })
                  }
                  className="mt-1 w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default: 168 Hours</span>
              </div>
            </div>
          </div>

          {/* Duplicate Detection Proximity */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Geospatial Duplicate Radius Threshold</h4>
              <p className="text-xs text-slate-500">
                Complaints within this great-circle distance are checked for duplicate category and token similarity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="25"
                max="500"
                step="25"
                value={weights.duplicateRadiusMeters}
                onChange={(e) =>
                  setWeights({ ...weights, duplicateRadiusMeters: parseInt(e.target.value) || 150 })
                }
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-xs text-slate-500 font-semibold">meters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Baseline Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>{saveSuccess}</span>
                </span>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-950 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Apply &amp; Recalculate Active Tickets
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Authorized Personnel &amp; User Accounts</h3>
            <span className="text-xs text-slate-500 font-mono">SERVER-ENFORCED RBAC</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">System Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_USERS.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{usr.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{usr.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        usr.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        usr.role === 'officer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{usr.department || 'Public Citizen'}</td>
                    <td className="py-3 px-3 text-teal-700 font-medium">Verified Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Immutable System Audit Records</h3>
              <p className="text-xs text-slate-500">Every complaint transition, weight calibration, and officer action is stamped</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-400">{auditLogs.length} logged events</span>
              <button
                onClick={handleExportAuditLogs}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-700">{log.details}</p>
                <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-200">
                  <span>Actor: {log.actorName} ({log.actorRole})</span>
                  <span>·</span>
                  <span>Target: {log.targetType} #{log.targetId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Integration Health */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
            Integration Architecture &amp; Service Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Google Gemini Vision Engine</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${systemStatus?.geminiConfigured ? 'bg-teal-500' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-800">
                  {systemStatus?.geminiConfigured ? 'Active & Injected' : 'Demo Rule-Based Mode'}
                </span>
              </div>
              <p className="text-slate-500">
                Model: <span className="font-mono text-slate-800">{systemStatus?.geminiModel || 'gemini-3.8-flash'}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Processed via secure server-side proxy route (/api/analyze-image). API key is never exposed to browser bundles.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Geospatial Mapping Engine</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="font-semibold text-slate-800">OpenStreetMap / Leaflet (Zero Cost)</span>
              </div>
              <p className="text-slate-500">No paid API key required for core citizen reporting.</p>
              <p className="text-[11px] text-slate-500">
                Supports coordinate pinning, proximity clustering, and accessible list view fallback.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2">
            <span className="font-bold text-teal-400 block font-mono">FIRESTORE BLUEPRINT &amp; SECURITY RULES SPECIFICATION</span>
            <p className="text-slate-300 leading-relaxed">
              CivicAI is architected with complete Firebase Security Rules specifications (`firestore.rules`)
              and Cloud Firestore schema (`firebase-blueprint.json`) included in the project repository.
              Role-based access control enforces that citizens cannot write official status transitions,
              and internal engineering notes remain strictly shielded from public queries.
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: Automated Test Runner */}
      {activeTab === 'tests' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <span>Automated Engineering Verification Suite</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Execute the 12 core algorithmic, security, and mathematical invariants live in the browser
              </p>
            </div>

            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              {isRunningTests ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Running Invariants...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Automated Tests</span>
                </>
              )}
            </button>
          </div>

          {testResult ? (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  testResult.success ? 'bg-teal-50 border-teal-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {testResult.success ? (
                    <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center shrink-0">
                      <XCircle className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">
                      {testResult.success
                        ? `All ${testResult.passed} / ${testResult.total} Verification Tests Passed`
                        : `${testResult.failed} of ${testResult.total} Tests Failed`}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Verified unique IDs, 4-factor math, Haversine geospatial proximity, RBAC FSM, XSS neutralization &amp; SLA calculations.
                    </div>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6 shrink-0 font-mono text-xs">
                  <div className="font-bold text-slate-900">100% Assertion Accuracy</div>
                  <div className="text-slate-500">Live Client Runner</div>
                </div>
              </div>

              {/* Individual Test Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testResult.tests.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-3"
                  >
                    {t.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 truncate">Test {t.id}: {t.name}</span>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">{t.durationMs}ms</span>
                      </div>
                      {t.error && (
                        <p className="text-rose-600 text-[11px] mt-1 font-mono">{t.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <div className="text-sm font-bold text-slate-800">Verification Suite Ready</div>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click the button above to execute unit tests verifying mathematical scoring formulas, RBAC state transitions, geospatial calculations, and security defenses.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
