import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DuplicateMatch, IssueCategory } from '../../../types/civic';

interface DuplicateReviewStepProps {
  potentialDuplicates: DuplicateMatch[];
  category: IssueCategory;
  description: string;
  address: string;
  landmark: string;
  photoDataUrl: string;
  submitError: string;
}

export const DuplicateReviewStep: React.FC<DuplicateReviewStepProps> = ({
  potentialDuplicates,
  category,
  description,
  address,
  landmark,
  photoDataUrl,
  submitError,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Step 5: Review &amp; Submit</h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify your complaint details before generating the municipal work ticket.
        </p>
      </div>

      {potentialDuplicates.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3" role="alert">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Possible Duplicate Reports Detected Nearby</span>
          </div>
          <p className="text-xs text-amber-800">
            Found {potentialDuplicates.length} active complaint{potentialDuplicates.length === 1 ? '' : 's'} registered within 150m.
            Review below to see if the issue is already in progress:
          </p>

          <div className="space-y-2">
            {potentialDuplicates.slice(0, 2).map((dup) => (
              <div
                key={dup.reportId}
                className="p-3 bg-white rounded-lg border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-mono font-bold text-slate-900">{dup.reportId}</div>
                  <div className="text-slate-600 mt-0.5">{dup.reason}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 self-start sm:self-auto">
                  Status: {dup.existingReport.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-slate-500 font-semibold uppercase block">Category:</span>
            <span className="text-base font-bold text-slate-900">{category}</span>
          </div>
          <div className="w-16 h-12 rounded bg-slate-900 overflow-hidden shrink-0">
            <img src={photoDataUrl} alt="Report thumbnail preview" className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          <span className="text-slate-500 font-semibold uppercase block">Description:</span>
          <p className="text-slate-800 font-medium mt-0.5">{description}</p>
        </div>

        <div>
          <span className="text-slate-500 font-semibold uppercase block">Location:</span>
          <p className="text-slate-800 font-medium mt-0.5">
            {address} {landmark ? `(Landmark: ${landmark})` : ''}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700" role="alert">
          {submitError}
        </div>
      )}
    </div>
  );
};
