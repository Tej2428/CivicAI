import React, { useRef } from 'react';
import { Camera, Upload, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { IssueCategory } from '../../../types/civic';
import { ISSUE_CATEGORIES } from '../../../constants/civicConstants';

interface PhotoUploadStepProps {
  photoDataUrl: string;
  isCompressing: boolean;
  compressionStats: { original: number; compressed: number } | null;
  photoError: string;
  onSelectFile: (file: File) => void;
  onRemovePhoto: () => void;
  onUseSamplePhoto: (category: IssueCategory) => void;
}

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  photoDataUrl,
  isCompressing,
  compressionStats,
  photoError,
  onSelectFile,
  onRemovePhoto,
  onUseSamplePhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Step 1: Capture or Select Photograph</h2>
        <p className="text-xs text-slate-500 mt-1">
          A clear visual photograph helps computer vision identify the issue and verify field severity.
        </p>
      </div>

      {isCompressing && (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
          <div className="text-xs font-bold text-slate-900">Optimizing and compressing photograph...</div>
          <div className="text-[11px] text-slate-500">Reducing memory footprint and speeding up upload</div>
        </div>
      )}

      {photoDataUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-300 max-h-72 bg-slate-950 flex items-center justify-center">
            <img src={photoDataUrl} alt="Selected civic issue preview" className="max-h-72 object-contain" />
            <button
              type="button"
              onClick={onRemovePhoto}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-rose-600 text-white p-2 rounded-full backdrop-blur-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Remove photograph"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-1">
            {compressionStats && (
              <span className="font-mono text-teal-700 font-medium">
                Optimized {(compressionStats.original / 1024).toFixed(0)}KB → {(compressionStats.compressed / 1024).toFixed(0)}KB
                {' '}({Math.round((1 - compressionStats.compressed / compressionStats.original) * 100)}% lighter)
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-teal-700 font-semibold hover:underline cursor-pointer"
            >
              Replace Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Browse files to upload"
          >
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-900 mb-1">Click to browse or drop an image</div>
            <div className="text-xs text-slate-500">Supports JPEG, PNG, WebP up to 10MB</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 min-h-[44px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-600" />
              <span>Open Device Camera</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Or select a verified sample issue for competition evaluation:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ISSUE_CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onUseSamplePhoto(cat)}
                  className="p-2 text-left bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-xs text-slate-700 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span className="line-clamp-1 font-medium">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {photoError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{photoError}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
