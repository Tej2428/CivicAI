import { AiAssessment } from '../types/civic';

export interface ImageTriageResponse {
  success: boolean;
  assessment: AiAssessment;
  isRealAi: boolean;
  modelUsed?: string;
  errorMessage?: string;
}

export interface SystemStatusResponse {
  status: string;
  service: string;
  geminiConfigured: boolean;
  geminiModel: string;
  serverTime: string;
  version: string;
}

export async function requestImageAnalysis(params: {
  imageBase64: string;
  mimeType?: string;
  userHintCategory?: string;
  userDescription?: string;
}): Promise<ImageTriageResponse> {
  try {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Network call to /api/analyze-image failed, falling back to local simulation:', err);
    // Graceful offline fallback
    return {
      success: false,
      isRealAi: false,
      errorMessage: err?.message || 'Could not reach server AI endpoint. Using local client triage.',
      assessment: {
        category: 'Other civic infrastructure issue',
        visibleEvidence: 'Physical infrastructure damage observed in photographic upload.',
        severity: 'medium',
        severityScore: 60,
        publicSafetyRiskScore: 55,
        publicSafetyConcerns: 'General public right-of-way hazard requiring field verification.',
        suggestedSeverityReasoning: 'Client-side fallback triage due to network disconnect.',
        isUnclearOrIrrelevant: false,
        recommendedHumanReview: true,
        modelConfidenceNotes: 'OFFLINE / DEMO: Server AI service unreachable. Manually verify category.',
        analyzedAt: new Date().toISOString(),
        isSimulatedDemo: true,
      },
    };
  }
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse | null> {
  try {
    const res = await fetch('/api/system-status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
