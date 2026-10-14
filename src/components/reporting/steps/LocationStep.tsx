import React from 'react';
import { Compass } from 'lucide-react';

interface QuickLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
}

interface LocationStepProps {
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  gpsStatus: string;
  fieldErrors: Record<string, string>;
  quickLocations: QuickLocation[];
  onRequestGpsLocation: () => void;
  onAddressChange: (addr: string) => void;
  onNeighborhoodChange: (nh: string) => void;
  onLatitudeChange: (lat: number) => void;
  onLongitudeChange: (lng: number) => void;
  onSelectQuickLocation: (loc: QuickLocation) => void;
}

export const LocationStep: React.FC<LocationStepProps> = ({
  address,
  neighborhood,
  latitude,
  longitude,
  gpsStatus,
  fieldErrors,
  quickLocations,
  onRequestGpsLocation,
  onAddressChange,
  onNeighborhoodChange,
  onLatitudeChange,
  onLongitudeChange,
  onSelectQuickLocation,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Step 3: Location</h2>
        <p className="text-xs text-slate-500 mt-1">
          Accurate coordinates allow municipal crews to locate the defect and support duplicate detection.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRequestGpsLocation}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
        >
          <Compass className="w-4 h-4 text-teal-400" />
          <span>Use My Device Location</span>
        </button>
        {gpsStatus && <span className="text-xs text-slate-600 font-mono" role="status">{gpsStatus}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="loc-address" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Street Address / Description <span className="text-rose-500">*</span>
          </label>
          <input
            id="loc-address"
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
          {fieldErrors.address && <p className="text-xs text-rose-600 mt-1" role="alert">{fieldErrors.address}</p>}
        </div>

        <div>
          <label htmlFor="loc-neighborhood" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Neighborhood / Ward
          </label>
          <input
            id="loc-neighborhood"
            type="text"
            value={neighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="loc-latitude" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Latitude
          </label>
          <input
            id="loc-latitude"
            type="number"
            step="0.0001"
            value={latitude}
            onChange={(e) => onLatitudeChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="loc-longitude" className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Longitude
          </label>
          <input
            id="loc-longitude"
            type="number"
            step="0.0001"
            value={longitude}
            onChange={(e) => onLongitudeChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-600 mb-2">Quick City Locations:</div>
        <div className="flex flex-wrap gap-2">
          {quickLocations.map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => onSelectQuickLocation(loc)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-md border border-slate-200 text-slate-700 transition-colors cursor-pointer min-h-[36px]"
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
