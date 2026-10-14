import React, { useState, useEffect } from 'react';
import { Info, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { fetchSystemStatus, SystemStatusResponse } from '../../services/aiService';

export const DemoBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);

  useEffect(() => {
    fetchSystemStatus().then((res) => {
      if (res) setSystemStatus(res);
    });
  }, []);

  if (dismissed) return null;

  return (
    <div className="bg-slate-100 border-b border-slate-200 text-slate-800 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-bold text-slate-950 uppercase tracking-wider text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
            Competition Prototype
          </span>
          <span className="text-slate-600 truncate">
            {systemStatus?.geminiConfigured ? (
              <span className="text-teal-700 font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Gemini 3.8 Flash Vision Connected
              </span>
            ) : (
              <span>
                Demonstration mode with 16 realistic civic records. Real-world Gemini API vision enabled via server-side endpoint.
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-slate-500">
            OpenStreetMap &amp; Haversine duplicate detection active
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
