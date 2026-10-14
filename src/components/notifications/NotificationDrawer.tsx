import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { InAppNotification } from '../../types/civic';
import {
  X,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectReport,
}) => {
  const { currentUser } = useAuth();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useReports();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-700" />
            <h3 id="notification-drawer-title" className="text-base font-extrabold text-slate-900">Notifications</h3>
            {unreadNotificationCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                {unreadNotificationCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No notifications yet</p>
              <p className="text-[11px] text-slate-500 mt-1">
                You'll receive updates when your complaint status changes.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.reportId) {
                      onSelectReport(notif.reportId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                    notif.read
                      ? 'bg-white border-slate-200 hover:bg-slate-50'
                      : 'bg-teal-50/60 border-teal-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                      <span>{notif.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{notif.message}</p>

                  {notif.reportId && (
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-teal-700 font-semibold">
                      <span>Complaint #{notif.reportId}</span>
                      <span className="flex items-center gap-0.5">
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          In-app alerts are tied to account #{currentUser.id}
        </div>
      </div>
    </div>
  );
};
