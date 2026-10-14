import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { Bell, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { UserRole } from '../../types/civic';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenNotifications,
  onOpenAuthModal,
}) => {
  const { currentUser, role, switchDemoRole } = useAuth();
  const { unreadNotificationCount, resetAllDemoData } = useReports();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Universal 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onNavigate('home')}
          className="text-xl font-extrabold tracking-tight text-slate-900 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center font-black text-base shadow-sm">
            C
          </span>
          <span>CivicAI</span>
        </button>

        {/* Zone 2: 4-5 Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentView === 'home'
                ? 'border-teal-600 text-slate-950 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('my-reports')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentView === 'my-reports'
                ? 'border-teal-600 text-slate-950 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            My Reports
          </button>
          <button
            onClick={() => onNavigate('map')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentView === 'map'
                ? 'border-teal-600 text-slate-950 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Map & Hotspots
          </button>
          <button
            onClick={() => onNavigate('officer')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentView === 'officer'
                ? 'border-teal-600 text-slate-950 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Municipal Command
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentView === 'admin'
                ? 'border-teal-600 text-slate-950 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Admin & SLA
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Notification Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {/* In-app Notification Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="View notifications"
            className="relative min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* User profile / login trigger */}
          <button
            onClick={onOpenAuthModal}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </span>
            <span className="max-w-[110px] truncate">{currentUser.name}</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => onNavigate('report')}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-950 hover:bg-teal-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* Discrete Competition Evaluator Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Competition Evaluator:</span>
            <span className="text-slate-300">Active Role:</span>
            <div className="inline-flex rounded-md p-0.5 bg-slate-800 border border-slate-700">
              {(['citizen', 'officer', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchDemoRole(r)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    role === r
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <span className="hidden lg:inline text-slate-500 text-[11px]">
              (Simulates server-enforced RBAC for judging)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Reset all sample reports back to original competition demo dataset?')) {
                  resetAllDemoData();
                }
              }}
              className="text-slate-400 hover:text-teal-400 text-[11px] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Seed Data</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
