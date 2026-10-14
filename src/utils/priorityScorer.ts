import { PriorityScoreBreakdown, PriorityWeightsConfig, SeverityLevel } from '../types/civic';

export const DEFAULT_PRIORITY_CONFIG: PriorityWeightsConfig = {
  severityWeight: 0.40,
  safetyRiskWeight: 0.30,
  durationWeight: 0.20,
  frequencyWeight: 0.10,
  criticalThreshold: 80,
  highThreshold: 60,
  mediumThreshold: 30,
  duplicateRadiusMeters: 150,
  slaHours: {
    critical: 24,
    high: 48,
    medium: 96,
    low: 168,
  },
};

/**
 * Calculates unresolved duration factor (0 - 100).
 * Scaled so 0 hours = 0, 24 hours = 25, 72 hours = 60, 7+ days (168h) = 100.
 */
export function calculateDurationScore(createdAtIso: string, resolvedAtIso?: string): number {
  const start = new Date(createdAtIso).getTime();
  const end = resolvedAtIso ? new Date(resolvedAtIso).getTime() : Date.now();
  const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
  
  if (hours <= 0) return 0;
  if (hours >= 168) return 100; // 7 days cap
  // Log-linear curve
  return Math.min(100, Math.round((hours / 168) * 100));
}

/**
 * Calculates nearby frequency factor (0 - 100) based on count of nearby complaints within 30 days.
 * 0 reports = 10, 1-2 reports = 35, 3-5 reports = 65, 6+ reports = 100.
 */
export function calculateFrequencyScore(nearbyCount: number): number {
  if (nearbyCount <= 0) return 0;
  if (nearbyCount === 1) return 25;
  if (nearbyCount === 2) return 45;
  if (nearbyCount === 3) return 65;
  if (nearbyCount === 4) return 85;
  return 100;
}

export function severityLevelToScore(level: SeverityLevel): number {
  switch (level) {
    case 'critical': return 95;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 25;
  }
}

interface ComputePriorityParams {
  severityScore: number; // 0 - 100
  publicSafetyRiskScore: number; // 0 - 100
  createdAtIso: string;
  nearbyRecentCount: number;
  config?: PriorityWeightsConfig;
  forceHumanReview?: boolean;
}

export function computePriorityScore(params: ComputePriorityParams): PriorityScoreBreakdown {
  const cfg = params.config || DEFAULT_PRIORITY_CONFIG;
  
  const clampedSeverity = Math.min(100, Math.max(0, params.severityScore));
  const clampedSafety = Math.min(100, Math.max(0, params.publicSafetyRiskScore));
  const durationScore = calculateDurationScore(params.createdAtIso);
  const frequencyScore = calculateFrequencyScore(params.nearbyRecentCount);

  const sevContrib = clampedSeverity * cfg.severityWeight;
  const safetyContrib = clampedSafety * cfg.safetyRiskWeight;
  const durContrib = durationScore * cfg.durationWeight;
  const freqContrib = frequencyScore * cfg.frequencyWeight;

  const totalRaw = sevContrib + safetyContrib + durContrib + freqContrib;
  const totalScore = Math.min(100, Math.max(0, Math.round(totalRaw)));

  let band: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (totalScore >= cfg.criticalThreshold) {
    band = 'Critical';
  } else if (totalScore >= cfg.highThreshold) {
    band = 'High';
  } else if (totalScore >= cfg.mediumThreshold) {
    band = 'Medium';
  }

  // Dangerous condition rule: if safety risk >= 80 or severity >= 90, require immediate human review
  const requiresImmediateHumanReview =
    params.forceHumanReview === true ||
    clampedSafety >= 80 ||
    clampedSeverity >= 90 ||
    band === 'Critical';

  // Plain-language explanation
  const explanation = [
    `Overall score ${totalScore}/100 (${band} priority band).`,
    `Physical severity contributed ${(sevContrib).toFixed(1)} pts (${clampedSeverity}/100 at ${(cfg.severityWeight * 100)}%).`,
    `Public safety hazard contributed ${(safetyContrib).toFixed(1)} pts (${clampedSafety}/100 at ${(cfg.safetyRiskWeight * 100)}%).`,
    durationScore > 30 ? `Unresolved duration is escalating (+${durContrib.toFixed(1)} pts).` : `Recently submitted (+${durContrib.toFixed(1)} pts).`,
    params.nearbyRecentCount > 0 ? `Cluster frequency: ${params.nearbyRecentCount} related issues recorded nearby (+${freqContrib.toFixed(1)} pts).` : `Isolated report (+${freqContrib.toFixed(1)} pts).`,
    requiresImmediateHumanReview ? `Flagged for immediate municipal engineer verification due to elevated safety hazard.` : `Standard scheduled field inspection queue.`
  ].join(' ');

  return {
    totalScore,
    band,
    factors: {
      severity: { score: clampedSeverity, weight: cfg.severityWeight, contribution: Math.round(sevContrib * 10) / 10 },
      publicSafetyRisk: { score: clampedSafety, weight: cfg.safetyRiskWeight, contribution: Math.round(safetyContrib * 10) / 10 },
      unresolvedDuration: { score: durationScore, weight: cfg.durationWeight, contribution: Math.round(durContrib * 10) / 10 },
      nearbyFrequency: { score: frequencyScore, weight: cfg.frequencyWeight, contribution: Math.round(freqContrib * 10) / 10 },
    },
    explanation,
    requiresImmediateHumanReview,
    lastAssessedAt: new Date().toISOString(),
  };
}
