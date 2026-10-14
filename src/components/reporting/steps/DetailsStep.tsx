import React from 'react';
import { IssueCategory } from '../../../types/civic';
import { ISSUE_CATEGORIES } from '../../../constants/civicConstants';

interface DetailsStepProps {
  category: IssueCategory;
  description: string;
  landmark: string;
  fieldErrors: Record<string, string>;
  onCategoryChange: (cat: IssueCategory) => void;
  onDescriptionChange: (desc: string) => void;
  onLandmarkChange: (lm: string) => void;
}

export const DetailsStep: React.FC<DetailsStepProps> = ({
  category,
  description,
  landmark,
  fieldErrors,
  onCategoryChange,
  onDescriptionChange,
  onLandmarkChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Step 2: Issue Information</h2>
        <p className="text-xs text-slate-500 mt-1">
          Select category and describe the nature of the infrastructure failure.
        </p>
      </div>

      <div>
        <label htmlFor="issue-category" className="block text-xs font-bold text-slate-700 uppercase mb-2">
          Issue Category <span className="text-rose-500">*</span>
        </label>
        <select
          id="issue-category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as IssueCategory)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium bg-white min-h-[44px]"
        >
          {ISSUE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="issue-description" className="block text-xs font-bold text-slate-700 uppercase mb-2">
          Description of Problem <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="issue-description"
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g. Hazardous pothole measuring approximately 15cm deep in active bus lane, swerving cars..."
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
        {fieldErrors.description && (
          <p className="text-xs text-rose-600 mt-1" role="alert">{fieldErrors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="issue-landmark" className="block text-xs font-bold text-slate-700 uppercase mb-2">
          Prominent Landmark (Optional)
        </label>
        <input
          id="issue-landmark"
          type="text"
          value={landmark}
          onChange={(e) => onLandmarkChange(e.target.value)}
          placeholder="e.g. Across from St. Jude Medical Clinic, near pillar 14"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm min-h-[44px]"
        />
      </div>
    </div>
  );
};
