import { CivicReport, DuplicateMatch, IssueCategory } from '../types/civic';

/**
 * Calculates great-circle distance between two points in meters using Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Simple word-token Jaccard similarity between two text descriptions.
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  const tokenize = (str: string) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : Math.round((intersectionCount / unionCount) * 100);
}

interface FindDuplicatesParams {
  category: IssueCategory;
  description: string;
  latitude?: number;
  longitude?: number;
  existingReports: CivicReport[];
  currentReportId?: string;
  maxRadiusMeters?: number; // default 150m
}

export function findPotentialDuplicates(params: FindDuplicatesParams): DuplicateMatch[] {
  const {
    category,
    description,
    latitude,
    longitude,
    existingReports,
    currentReportId,
    maxRadiusMeters = 150,
  } = params;

  if (latitude === undefined || longitude === undefined) {
    // If coordinates are missing, explain that duplicate detection is limited to text/landmark
    return [];
  }

  const matches: DuplicateMatch[] = [];

  for (const rep of existingReports) {
    // Skip self and closed reports older than 45 days
    if (currentReportId && rep.id === currentReportId) continue;
    if (rep.status === 'Closed') continue;

    if (rep.location.latitude === undefined || rep.location.longitude === undefined) {
      continue;
    }

    const distance = calculateHaversineDistance(
      latitude,
      longitude,
      rep.location.latitude,
      rep.location.longitude
    );

    // If within radius
    if (distance <= maxRadiusMeters) {
      const isExactCategory = rep.category === category;
      const textSim = calculateTextSimilarity(description, rep.citizenDescription);

      // Score composition: proximity (50%), category match (30%), text similarity (20%)
      const proximityScore = Math.max(0, 100 - (distance / maxRadiusMeters) * 100);
      const categoryScore = isExactCategory ? 100 : 25;
      const totalSim = Math.round(proximityScore * 0.5 + categoryScore * 0.3 + textSim * 0.2);

      // Threshold: if exact category & within radius, or high text match
      if (isExactCategory || totalSim >= 50) {
        let reason = '';
        if (distance < 30 && isExactCategory) {
          reason = `Identical category reported ~${distance}m away. Likely the exact same location.`;
        } else if (isExactCategory) {
          reason = `Same category (${category}) reported ${distance}m away on ${new Date(rep.createdAt).toLocaleDateString()}.`;
        } else {
          reason = `Similar infrastructure report located ${distance}m away with matching characteristics.`;
        }

        matches.push({
          reportId: rep.id,
          existingReport: rep,
          distanceMeters: distance,
          categoryMatch: isExactCategory,
          similarityScore: totalSim,
          reason,
        });
      }
    }
  }

  // Sort by highest similarity
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}
