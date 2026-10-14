import React from 'react';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { AiAssessment } from '../../../types/civic';

interface AiReviewStepProps {
  isAnalyzing: boolean;
  aiAssessment: AiAssessment | null;
  isRealAiResult: boolean;
  onReAnalyze: () => void;
}

export const AiReviewStep: React.FC<AiReviewStepProps> = ({
  isAnalyzing,
  aiAssessment,
  isRealAiResult,
  onReAnalyze,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Step 4: AI Triage Assessment</h2>
          <p className="text-xs text-slate-500 mt-1">
            Computer vision preliminary classification and severity recommendation.
          </p>
        </div>
        <button
          type="button"
          onClick={onReAnalyze}
          disabled={isAnalyzing}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 text-slate-700 transition-colors min-h-[36px] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>Re-Analyze</span>
        </button>
      </div>

      {isAnalyzing ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3" aria-live="polite">
          <div className="w-10 h-10 rounded-full border-3 border-teal-500 border-t-transparent animate-spin mx-auto" />
          <div className="text-sm font-bold text-slate-900">Analyzing photograph via Gemini vision service...</div>
          <div className="text-xs text-slate-500">Checking physical evidence, depth indicators, and safety concerns</div>
        </div>
      ) : aiAssessment ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-sm text-slate-900">AI Assessment Result</span>
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                isRealAiResult ? 'bg-teal-100 text-teal-800 font-bold' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isRealAiResult ? 'GEMINI 3.8 FLASH' : 'DEMO MODE SIMULATOR'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Predicted Category:</span>
              <span className="font-bold text-slate-900">{aiAssessment.category}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Suggested Severity:</span>
              <span
                className={`font-bold uppercase ${
                  aiAssessment.severity === 'critical'
                    ? 'text-rose-600'
                    : aiAssessment.severity === 'high'
                    ? 'text-amber-600'
                    : 'text-slate-800'
                }`}
              >
                {aiAssessment.severity} ({aiAssessment.severityScore}/100)
              </span>
            </div>
          </div>

          <div className="text-xs space-y-1">
            <span className="text-slate-500 font-semibold block">Visible Evidence:</span>
            <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
              {aiAssessment.visibleEvidence}
            </p>
          </div>

          <div className="text-xs space-y-1">
            <span className="text-slate-500 font-semibold block">Potential Public Safety Concerns:</span>
            <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
              {aiAssessment.publicSafetyConcerns}
            </p>
          </div>

          {aiAssessment.recommendedHumanReview && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Human Review Flagged: </span>
                Elevated hazard risk requires on-site engineer verification upon submission.
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200">
            {aiAssessment.modelConfidenceNotes}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          AI analysis has not run yet. Click "Re-Analyze" to trigger vision triage.
        </div>
      )}
    </div>
  );
};
