import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportProvider, useReports } from './context/ReportContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { DemoBanner } from './components/common/DemoBanner';
import { CitizenHome } from './components/citizen/CitizenHome';
import { MyReports } from './components/citizen/MyReports';
import { ReportWizard } from './components/reporting/ReportWizard';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { AdminConsole } from './components/admin/AdminConsole';
import { HotspotMap } from './components/map/HotspotMap';
import { ReportDetailModal } from './components/citizen/ReportDetailModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { IssueCategory } from './types/civic';

function MainApp() {
  const { role } = useAuth();
  const { selectedReportId, setSelectedReportId, selectedReport } = useReports();

  const [currentView, setCurrentView] = useState<string>('home');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | undefined>(undefined);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const handleNavigate = (view: string, filter?: IssueCategory) => {
    setCategoryFilter(filter);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-16 md:pb-0">
      {/* Demo status banner */}
      <DemoBanner />

      {/* Top Bar Header with Top Bar Contract */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'home' && (
          <CitizenHome
            onNavigate={handleNavigate}
            onSelectReport={handleSelectReport}
          />
        )}

        {currentView === 'report' && (
          <ReportWizard
            initialCategory={categoryFilter}
            onCancel={() => handleNavigate('home')}
            onSuccess={(id) => {
              setSelectedReportId(id);
              handleNavigate('my-reports');
            }}
          />
        )}

        {currentView === 'my-reports' && (
          <MyReports
            initialCategory={categoryFilter}
            onSelectReport={handleSelectReport}
            onNavigateToReport={() => handleNavigate('report')}
          />
        )}

        {currentView === 'map' && (
          <HotspotMap onSelectReport={handleSelectReport} />
        )}

        {currentView === 'officer' && (
          <OfficerDashboard onSelectReport={handleSelectReport} />
        )}

        {currentView === 'admin' && <AdminConsole />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight">CivicAI</span>
            <span>·</span>
            <span>Smarter Cities, Faster Solutions.</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-400">
            Technology Innovation Competition Edition · Built with Gemini Vision, OpenStreetMap &amp; Full-Stack React
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Modals & Drawers */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReportId(null)}
          onOpenOfficerActions={() => {
            setSelectedReportId(null);
            handleNavigate('officer');
          }}
        />
      )}

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onSelectReport={handleSelectReport}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReportProvider>
        <MainApp />
      </ReportProvider>
    </AuthProvider>
  );
}
