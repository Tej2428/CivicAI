import { generateComplaintId, isValidComplaintId } from '../utils/idGenerator';
import {
  computePriorityScore,
  calculateDurationScore,
  calculateFrequencyScore,
  DEFAULT_PRIORITY_CONFIG,
} from '../utils/priorityScorer';
import {
  calculateHaversineDistance,
  calculateTextSimilarity,
  findPotentialDuplicates,
} from '../utils/duplicateDetector';
import { canUserTransitionStatus, VALID_TRANSITIONS } from '../utils/statusTransitions';
import { CivicReport, PriorityWeightsConfig } from '../types/civic';

/**
 * CivicAI Automated Test Suite
 * Validates domain rules, math formulas, security permissions, and duplicate detection.
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runCivicAiTests() {
  console.log('--- Running CivicAI Automated Test Suite ---');
  let passed = 0;

  // 1. Unique Complaint ID Generation
  const id1 = generateComplaintId();
  const id2 = generateComplaintId();
  assert(id1 !== id2, 'Complaint IDs must be unique');
  assert(isValidComplaintId(id1), `ID ${id1} must match format CIVIC-YYYY-XXXXX`);
  assert(isValidComplaintId(id2), `ID ${id2} must match format CIVIC-YYYY-XXXXX`);
  passed++;
  console.log('✓ Test 1: Unique Non-Sequential Complaint IDs passed');

  // 2. Priority Score Calculation & Banding
  const agedCriticalPriority = computePriorityScore({
    severityScore: 95,
    publicSafetyRiskScore: 92,
    createdAtIso: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), // 3 days unresolved
    nearbyRecentCount: 5,
  });
  assert(agedCriticalPriority.totalScore >= 80, `Score (${agedCriticalPriority.totalScore}) with severity 95, safety 92, 72h duration should be Critical`);
  assert(agedCriticalPriority.band === 'Critical', 'Band should be Critical');
  assert(agedCriticalPriority.requiresImmediateHumanReview === true, 'Critical condition must require immediate human review');

  // Verify that an acute hazard freshly reported still triggers immediate human review flag
  const freshHazardPriority = computePriorityScore({
    severityScore: 92,
    publicSafetyRiskScore: 90,
    createdAtIso: new Date().toISOString(),
    nearbyRecentCount: 1,
  });
  assert(freshHazardPriority.requiresImmediateHumanReview === true, 'Fresh acute hazard with safety >= 80 must flag immediate human review');

  const lowPriority = computePriorityScore({
    severityScore: 20,
    publicSafetyRiskScore: 15,
    createdAtIso: new Date().toISOString(),
    nearbyRecentCount: 0,
  });
  assert(lowPriority.band === 'Low', `Score ${lowPriority.totalScore} should be Low band`);
  passed++;
  console.log('✓ Test 2: Priority Score Formula & Safety Bands passed');

  // 3. Duration & Frequency Factors
  const nowIso = new Date().toISOString();
  const threeDaysAgoIso = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
  const durationScore = calculateDurationScore(threeDaysAgoIso);
  assert(durationScore > 35, '72h duration should yield >35 duration score');
  const freqScore = calculateFrequencyScore(4);
  assert(freqScore >= 80, '4 nearby reports should yield >=80 frequency score');
  passed++;
  console.log('✓ Test 3: Unresolved Duration & Frequency scaling passed');

  // 4. Duplicate Complaint Detection & Haversine Distance
  // Test distance between two coordinates in San Francisco ~150 meters
  const dist = calculateHaversineDistance(37.7758, -122.4201, 37.7765, -122.4201);
  assert(dist > 50 && dist < 120, `Distance should be ~78m (got ${dist}m)`);

  const mockExistingReport: CivicReport = {
    id: 'CIVIC-2026-TEST1',
    reporterId: 'user_1',
    reporterName: 'Citizen One',
    category: 'Pothole or damaged road',
    citizenDescription: 'Deep road crater in traffic lane',
    photoUrl: 'data:image/svg+xml,...',
    location: {
      address: '420 Oak Street',
      latitude: 37.7758,
      longitude: -122.4201,
    },
    priority: agedCriticalPriority,
    status: 'In Progress',
    statusHistory: [],
    internalNotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoRecord: true,
  };

  const duplicates = findPotentialDuplicates({
    category: 'Pothole or damaged road',
    description: 'Crater in road lane',
    latitude: 37.7759,
    longitude: -122.4202, // ~20 meters away
    existingReports: [mockExistingReport],
  });

  assert(duplicates.length === 1, 'Should detect duplicate within 30m');
  assert(duplicates[0].categoryMatch === true, 'Category must match');
  assert(duplicates[0].distanceMeters < 50, 'Distance should be under 50m');
  passed++;
  console.log('✓ Test 4: Duplicate Detection & Haversine Proximity passed');

  // 5. Role-Based Access Control on Status Transitions
  // Citizen cannot transition to In Progress or Resolved
  const citizenAttempt = canUserTransitionStatus('citizen', 'Submitted', 'In Progress');
  assert(citizenAttempt.allowed === false, 'Citizens must not be allowed to transition status');

  // Officer can transition Submitted -> Under Review or Assigned
  const officerAttemptValid = canUserTransitionStatus('officer', 'Submitted', 'Under Review');
  assert(officerAttemptValid.allowed === true, 'Officer must be permitted to triage Submitted to Under Review');

  // Officer cannot jump Submitted -> Resolved directly (must progress through work order)
  const invalidJump = canUserTransitionStatus('officer', 'Submitted', 'Resolved');
  assert(invalidJump.allowed === false, 'Officer cannot skip triage straight to Resolved');
  passed++;
  console.log('✓ Test 5: Server-Enforced RBAC & Finite State Transitions passed');

  // 6. Text Similarity Tokenization
  const sim = calculateTextSimilarity(
    'Pothole on Oak Street outside clinic',
    'Oak Street pothole in front of clinic'
  );
  assert(sim >= 50, `Text similarity should be >=50% (got ${sim}%)`);
  passed++;
  console.log('✓ Test 6: Text Token Jaccard Similarity passed');

  console.log(`\n🎉 All ${passed} CivicAI automated tests passed successfully!`);
  return { success: true, testsPassed: passed };
}

// Auto-run when executed directly via Node / tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('civic.test.ts')) {
  runCivicAiTests();
}
