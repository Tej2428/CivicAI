import React from 'react';
import { IssueCategory } from '../../types/civic';

interface SvgVisualProps {
  category: IssueCategory | string;
  className?: string;
  showBadge?: boolean;
}

export const SvgVisual: React.FC<SvgVisualProps> = ({ category, className = 'w-full h-40', showBadge = false }) => {
  const getCategoryIllustration = () => {
    switch (category) {
      case 'Pothole or damaged road':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#1e293b" />
            {/* Asphalt texture lines */}
            <line x1="0" y1="120" x2="400" y2="120" stroke="#334155" strokeWidth="2" strokeDasharray="16 16" />
            <line x1="0" y1="122" x2="400" y2="122" stroke="#475569" strokeWidth="1" strokeDasharray="8 24" />
            {/* Road lane line */}
            <line x1="0" y1="40" x2="400" y2="40" stroke="#f1f5f9" strokeWidth="4" strokeDasharray="30 20" opacity="0.3" />
            {/* Deep crater */}
            <path
              d="M100 130 C130 90 270 85 310 120 C340 160 280 200 210 205 C140 210 80 180 100 130 Z"
              fill="#0f172a"
            />
            <path
              d="M125 140 C145 110 250 105 285 130 C305 160 260 185 205 190 C150 195 110 170 125 140 Z"
              fill="#020617"
            />
            {/* Gravel bits */}
            <circle cx="160" cy="150" r="4" fill="#64748b" />
            <circle cx="230" cy="140" r="5" fill="#475569" />
            <circle cx="190" cy="170" r="6" fill="#334155" />
            <circle cx="260" cy="165" r="4" fill="#64748b" />
            {/* Depth label */}
            <rect x="20" y="195" width="120" height="26" rx="4" fill="#0f172a" fillOpacity="0.8" />
            <text x="28" y="212" fill="#38bdf8" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              DEPTH ~14CM
            </text>
          </svg>
        );

      case 'Garbage accumulation':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#1e293b" />
            {/* Sidewalk pavement */}
            <rect x="0" y="160" width="400" height="80" fill="#334155" />
            <line x1="120" y1="160" x2="120" y2="240" stroke="#475569" strokeWidth="2" />
            <line x1="260" y1="160" x2="260" y2="240" stroke="#475569" strokeWidth="2" />
            {/* Green Dumpster */}
            <rect x="60" y="90" width="110" height="100" rx="4" fill="#047857" />
            <rect x="55" y="82" width="120" height="12" rx="2" fill="#065f46" />
            {/* Trash bags piled up */}
            <path d="M160 180 Q190 120 230 160 Q270 110 320 170 Q340 190 320 200 L160 200 Z" fill="#78350f" />
            <circle cx="210" cy="155" r="28" fill="#1e1e1e" />
            <circle cx="265" cy="145" r="24" fill="#a16207" />
            <circle cx="295" cy="165" r="22" fill="#3f3f46" />
            {/* Waste alert */}
            <rect x="20" y="195" width="130" height="26" rx="4" fill="#0f172a" fillOpacity="0.8" />
            <text x="28" y="212" fill="#34d399" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              OVERFLOW HAZARD
            </text>
          </svg>
        );

      case 'Blocked drainage or waterlogging':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#0f172a" />
            {/* Water pool */}
            <rect x="0" y="110" width="400" height="130" fill="#0284c7" fillOpacity="0.4" />
            <ellipse cx="200" cy="170" rx="180" ry="50" fill="#0369a1" fillOpacity="0.6" />
            {/* Curb Storm Drain Grate */}
            <rect x="130" y="130" width="140" height="70" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="3" />
            <line x1="150" y1="130" x2="150" y2="200" stroke="#64748b" strokeWidth="4" />
            <line x1="175" y1="130" x2="175" y2="200" stroke="#64748b" strokeWidth="4" />
            <line x1="200" y1="130" x2="200" y2="200" stroke="#64748b" strokeWidth="4" />
            <line x1="225" y1="130" x2="225" y2="200" stroke="#64748b" strokeWidth="4" />
            <line x1="250" y1="130" x2="250" y2="200" stroke="#64748b" strokeWidth="4" />
            {/* Silt & debris on grate */}
            <path d="M120 155 Q160 120 210 160 Q230 145 270 170 L250 195 L130 190 Z" fill="#78350f" fillOpacity="0.85" />
            {/* Water waves */}
            <path d="M50 140 Q80 135 110 140" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <path d="M290 150 Q320 145 350 150" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <rect x="20" y="195" width="130" height="26" rx="4" fill="#0f172a" fillOpacity="0.8" />
            <text x="28" y="212" fill="#7dd3fc" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              DRAIN OCCLUDED
            </text>
          </svg>
        );

      case 'Damaged streetlight':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#090d16" />
            {/* Night sky with subtle stars */}
            <circle cx="80" cy="50" r="1.5" fill="#f8fafc" />
            <circle cx="160" cy="30" r="1.5" fill="#f8fafc" />
            <circle cx="340" cy="40" r="1.5" fill="#f8fafc" />
            {/* Tilted light pole */}
            <line x1="200" y1="240" x2="230" y2="60" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
            {/* Broken luminaire arm */}
            <path d="M230 60 Q260 40 285 55" stroke="#94a3b8" strokeWidth="8" fill="none" />
            {/* Dangling spark/wire */}
            <path d="M285 60 Q295 90 275 110 Q295 130 280 150" stroke="#eab308" strokeWidth="3" fill="none" />
            <circle cx="280" cy="155" r="4" fill="#ef4444" />
            <rect x="20" y="195" width="140" height="26" rx="4" fill="#0f172a" fillOpacity="0.8" />
            <text x="28" y="212" fill="#f87171" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              EXPOSED CONDUCTOR
            </text>
          </svg>
        );

      case 'Water leakage':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#1e293b" />
            {/* Ground surface */}
            <rect x="0" y="150" width="400" height="90" fill="#0f172a" />
            {/* Pressurized water geyser */}
            <path d="M190 150 Q200 40 205 25 Q210 40 220 150 Z" fill="#38bdf8" fillOpacity="0.85" />
            {/* Water ripples */}
            <ellipse cx="205" cy="150" rx="90" ry="25" fill="#0284c7" fillOpacity="0.7" />
            <ellipse cx="205" cy="165" rx="140" ry="35" fill="#0369a1" fillOpacity="0.4" />
            <rect x="20" y="195" width="135" height="26" rx="4" fill="#0f172a" fillOpacity="0.8" />
            <text x="28" y="212" fill="#38bdf8" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              MAIN LINE RUPTURE
            </text>
          </svg>
        );

      case 'Damaged sidewalk':
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#1e293b" />
            {/* Displaced concrete slabs */}
            <rect x="40" y="110" width="150" height="100" fill="#94a3b8" />
            <rect x="180" y="75" width="170" height="110" fill="#64748b" transform="rotate(-6 180 75)" />
            {/* Heaved root line */}
            <path d="M150 170 Q190 140 240 180" stroke="#451a03" strokeWidth="8" fill="none" />
            <rect x="20" y="195" width="130" height="26" rx="4" fill="#0f172a" fillOpacity="0.8" />
            <text x="28" y="212" fill="#fcd34d" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              LIP HEIGHT &gt;8CM
            </text>
          </svg>
        );

      default:
        return (
          <svg className="w-full h-full" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="#0f172a" />
            <circle cx="200" cy="110" r="50" stroke="#0d9488" strokeWidth="3" fill="#134e4a" fillOpacity="0.4" />
            <path d="M185 110 L195 120 L215 95" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <text x="200" y="185" fill="#f8fafc" fontSize="14" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600">
              CIVIC INFRASTRUCTURE
            </text>
          </svg>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900 ${className}`}>
      {getCategoryIllustration()}
      {showBadge && (
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-slate-200 border border-slate-700">
          {category}
        </div>
      )}
    </div>
  );
};
