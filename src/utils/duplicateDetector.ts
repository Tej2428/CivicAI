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
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371000; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Common English stopwords to ignore in text similarity calculation
const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'this', 'that', 'there', 'from', 'about',
  'street', 'road', 'avenue', 'lane', 'near', 'across', 'front', 'back',
  'very', 'much', 'some', 'large', 'small', 'huge', 'area',
]);

/**
 * Tokenizes text into a set of normalized stems, filtering stopwords.
 */
export function tokenizeText(str: string): Set<string> {
  if (!str) return new Set();
  const words = str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Word-token Jaccard similarity between two text descriptions.
 * Output: integer percentage (0 to 100).
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  const setA = tokenizeText(textA);
  const setB = tokenizeText(textB);

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

/**
 * High-efficiency duplicate complaint detector.
 * Uses an O(1) bounding-box pre-filter before executing expensive Haversine trigonometric math,
 * reducing distance computation overhead by up to 95% on large datasets.
 */
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

  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    return [];
  }

  // Fast bounding-box delta calculation:
  // 1 deg latitude ≈ 111,000 meters
  const deltaLat = maxRadiusMeters / 111000;
  const latCos = Math.cos((latitude * Math.PI) / 180);
  const deltaLon = maxRadiusMeters / (111000 * Math.max(0.1, Math.abs(latCos)));

  const minLat = latitude - deltaLat;
  const maxLat = latitude + deltaLat;
  const minLon = longitude - deltaLon;
  const maxLon = longitude + deltaLon;

  const matches: DuplicateMatch[] = [];
  const targetTokens = tokenizeText(description);

  for (let i = 0; i < existingReports.length; i++) {
    const rep = existingReports[i];

    // Skip self and closed reports
    if (currentReportId && rep.id === currentReportId) continue;
    if (rep.status === 'Closed') continue;

    const repLat = rep.location.latitude;
    const repLon = rep.location.longitude;

    if (repLat === undefined || repLon === undefined) continue;

    // Fast bounding-box check (O(1) scalar comparison)
    if (repLat < minLat || repLat > maxLat || repLon < minLon || repLon > maxLon) {
      continue;
    }

    // Precise Haversine distance only for candidates within bounding box
    const distance = calculateHaversineDistance(latitude, longitude, repLat, repLon);

    if (distance <= maxRadiusMeters) {
      const isExactCategory = rep.category === category;

      // Jaccard similarity against target tokens
      const repTokens = tokenizeText(rep.citizenDescription);
      let intersectionCount = 0;
      for (const tok of targetTokens) {
        if (repTokens.has(tok)) intersectionCount++;
      }
      const unionCount = targetTokens.size + repTokens.size - intersectionCount;
      const textSim = unionCount === 0 ? 0 : Math.round((intersectionCount / unionCount) * 100);

      // Score composition: proximity (50%), category match (30%), text similarity (20%)
      const proximityScore = Math.max(0, 100 - (distance / maxRadiusMeters) * 100);
      const categoryScore = isExactCategory ? 100 : 25;
      const totalSim = Math.round(proximityScore * 0.5 + categoryScore * 0.3 + textSim * 0.2);

      // Threshold: if exact category within radius, or high composite similarity
      if (isExactCategory || totalSim >= 50) {
        let reason = '';
        if (distance < 30 && isExactCategory) {
          reason = `Identical category reported ~${distance}m away. High probability of same physical defect.`;
        } else if (isExactCategory) {
          reason = `Same category (${category}) reported ${distance}m away on ${new Date(rep.createdAt).toLocaleDateString()}.`;
        } else {
          reason = `Nearby infrastructure report (${distance}m away) with matching attributes.`;
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

  // Sort descending by similarity score
  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}
