import React from 'react';
import { Home, PlusCircle, FileText, Bell, MapPin } from 'lucide-react';
import { useReports } from '../../context/ReportContext';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenNotifications,
  onOpenAuthModal,
}) => {
  const { unreadNotificationCount } = useReports();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentView === 'home' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Home</span>
        </button>

        {/* My Reports */}
        <button
          onClick={() => onNavigate('my-reports')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentView === 'my-reports' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">My Reports</span>
        </button>

        {/* Report (Prominent Center Button) */}
        <button
          onClick={() => onNavigate('report')}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-teal-600 hover:text-teal-700"
        >
          <div className="w-10 h-10 rounded-full bg-slate-950 text-teal-400 flex items-center justify-center shadow-md">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-slate-900 tracking-tight mt-0.5">Report</span>
        </button>

        {/* Map */}
        <button
          onClick={() => onNavigate('map')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentView === 'map' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Map</span>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-900 transition-colors"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-teal-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadNotificationCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Alerts</span>
        </button>
      </div>
    </div>
  );
};
