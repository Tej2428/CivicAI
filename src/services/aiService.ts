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

/**
 * Client service to request server-side image analysis.
 * Uses 25-second AbortController timeout to prevent UI hangs.
 */
export async function requestImageAnalysis(params: {
  imageBase64: string;
  mimeType?: string;
  userHintCategory?: string;
  userDescription?: string;
}): Promise<ImageTriageResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Analysis rate limit reached. Please wait a minute before requesting another AI review.');
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${res.status}`);
    }

    const data: ImageTriageResponse = await res.json();
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    const isAbort = err instanceof Error && err.name === 'AbortError';
    const errorMsg = isAbort
      ? 'AI request timed out after 25 seconds. Engaged offline triage simulator.'
      : err instanceof Error
      ? err.message
      : 'Network communication failure';

    console.warn('[AI Service] Request failed, engaging reliable fallback:', errorMsg);

    // Reliable fallback prevents citizen work from being lost
    return {
      success: false,
      isRealAi: false,
      errorMessage: errorMsg,
      assessment: {
        category: (params.userHintCategory as any) || 'Other civic infrastructure issue',
        visibleEvidence: 'Physical infrastructure defect documented in attached citizen photograph.',
        severity: 'medium',
        severityScore: 60,
        publicSafetyRiskScore: 55,
        publicSafetyConcerns: 'Public accessibility or physical hazard requiring scheduled municipal verification.',
        suggestedSeverityReasoning: 'Triage simulator activated due to offline or timed-out AI endpoint.',
        isUnclearOrIrrelevant: false,
        recommendedHumanReview: true,
        modelConfidenceNotes: 'DEMO / OFFLINE FALLBACK: Server vision unavailable. Citizen category retained.',
        analyzedAt: new Date().toISOString(),
        isSimulatedDemo: true,
      },
    };
  }
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/system-status', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
