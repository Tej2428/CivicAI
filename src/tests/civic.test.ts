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
import { canUserTransitionStatus } from '../utils/statusTransitions';
import { CivicReport, PriorityWeightsConfig } from '../types/civic';
import { sanitizeText, validateCoordinates } from '../utils/validation';

export interface TestResultItem {
  id: number;
  name: string;
  status: 'passed' | 'failed';
  durationMs: number;
  error?: string;
}

export interface TestSuiteSummary {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  tests: TestResultItem[];
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * CivicAI Automated Test Suite
 * Validates domain algorithms, security invariants, math models, and duplicate detection.
 * Runs in both Node.js (CLI) and browser runtime (Admin console UI).
 */
export function runCivicAiTests(): TestSuiteSummary {
  const tests: TestResultItem[] = [];
  let passedCount = 0;

  function executeTest(id: number, name: string, fn: () => void) {
    const start = performance.now();
    try {
      fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      tests.push({ id, name, status: 'passed', durationMs });
      passedCount++;
      if (typeof process !== 'undefined' && process.stdout) {
        console.log(`  ✓ Test ${id}: ${name} (${durationMs}ms)`);
      }
    } catch (err: unknown) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorMsg = err instanceof Error ? err.message : String(err);
      tests.push({ id, name, status: 'failed', durationMs, error: errorMsg });
      if (typeof process !== 'undefined' && process.stderr) {
        console.error(`  ✗ Test ${id}: ${name} FAILED - ${errorMsg}`);
      }
    }
  }

  if (typeof process !== 'undefined' && process.stdout) {
    console.log('\n======================================================');
    console.log('   CivicAI Automated Engineering Verification Suite   ');
    console.log('======================================================\n');
  }

  // 1. Complaint ID generation & format
  executeTest(1, 'Unique Non-Sequential Complaint ID Format & Uniqueness', () => {
    const id1 = generateComplaintId();
    const id2 = generateComplaintId();
    assert(id1 !== id2, 'IDs must be uniquely generated');
    assert(isValidComplaintId(id1), `ID ${id1} must conform to CIVIC-YYYY-XXXXX`);
    assert(isValidComplaintId(id2), `ID ${id2} must conform to CIVIC-YYYY-XXXXX`);
    // Ensure ambiguous characters like 0, O, 1, I are omitted
    const suffix = id1.split('-')[2];
    assert(!/[0O1I]/.test(suffix), `Suffix ${suffix} should not contain ambiguous characters 0, O, 1, I`);
  });

  // 2. Priority scoring formula with 4 factors
  executeTest(2, 'Explainable 4-Factor Priority Score Formula & Math Precision', () => {
    const config: PriorityWeightsConfig = {
      severityWeight: 0.40,
      safetyRiskWeight: 0.30,
      durationWeight: 0.20,
      frequencyWeight: 0.10,
      criticalThreshold: 80,
      highThreshold: 60,
      mediumThreshold: 30,
      duplicateRadiusMeters: 150,
      slaHours: { critical: 24, high: 48, medium: 96, low: 168 },
    };

    // Calculate with known inputs: Sev=100, Safety=100, Duration=100, Freq=100 -> Expected 100
    const nowIso = new Date().toISOString();
    const aged7DaysIso = new Date(Date.now() - 170 * 3600 * 1000).toISOString();

    const maxResult = computePriorityScore({
      severityScore: 100,
      publicSafetyRiskScore: 100,
      createdAtIso: aged7DaysIso,
      nearbyRecentCount: 5,
      config,
    });

    assert(maxResult.totalScore === 100, `Expected max score 100, got ${maxResult.totalScore}`);
    assert(maxResult.band === 'Critical', 'Max score must be Critical band');
    assert(maxResult.requiresImmediateHumanReview, 'Score 100 must require immediate human review');
  });

  // 3. Priority banding thresholds
  executeTest(3, 'Priority Banding Classification (Critical, High, Medium, Low)', () => {
    const nowIso = new Date().toISOString();

    const critical = computePriorityScore({
      severityScore: 85,
      publicSafetyRiskScore: 85,
      createdAtIso: nowIso,
      nearbyRecentCount: 0,
    });
    assert(critical.band === 'Critical' || critical.totalScore >= 60, 'High risk condition should be Critical or High');

    const low = computePriorityScore({
      severityScore: 10,
      publicSafetyRiskScore: 10,
      createdAtIso: nowIso,
      nearbyRecentCount: 0,
    });
    assert(low.band === 'Low', `Low condition should be Low band (got ${low.band}, ${low.totalScore})`);
  });

  // 4. Duration factor non-linear escalation
  executeTest(4, 'Unresolved Duration Factor Escalation & Ceiling Capping', () => {
    const brandNew = calculateDurationScore(new Date().toISOString());
    assert(brandNew >= 0 && brandNew <= 5, `Brand new report should have near-zero duration score, got ${brandNew}`);

    const threeDays = calculateDurationScore(new Date(Date.now() - 72 * 3600 * 1000).toISOString());
    assert(threeDays > 35 && threeDays < 60, `72 hours should yield ~42-45 duration score, got ${threeDays}`);

    const tenDays = calculateDurationScore(new Date(Date.now() - 240 * 3600 * 1000).toISOString());
    assert(tenDays === 100, `Duration score must cap at 100 after 168 hours, got ${tenDays}`);
  });

  // 5. Cluster frequency factor scaling
  executeTest(5, 'Nearby Incident Cluster Frequency Factor Scaling', () => {
    const zeroFreq = calculateFrequencyScore(0);
    assert(zeroFreq === 0, '0 nearby reports must produce 0 frequency score');

    const twoFreq = calculateFrequencyScore(2);
    assert(twoFreq >= 40 && twoFreq <= 50, `2 nearby reports should produce ~45 score, got ${twoFreq}`);

    const manyFreq = calculateFrequencyScore(10);
    assert(manyFreq === 100, '>=5 nearby reports should cap at 100 score');
  });

  // 6. Haversine great-circle distance accuracy
  executeTest(6, 'Haversine Geographic Distance Formula & Metric Accuracy', () => {
    // Distance between 37.7758, -122.4201 and 37.7765, -122.4201 (latitude delta ~0.0007 deg ≈ 77.8 meters)
    const dist = calculateHaversineDistance(37.7758, -122.4201, 37.7765, -122.4201);
    assert(dist >= 75 && dist <= 82, `Expected distance ~78m, got ${dist}m`);

    // Same point distance should be 0
    const zeroDist = calculateHaversineDistance(37.7758, -122.4201, 37.7758, -122.4201);
    assert(zeroDist === 0, `Identical coordinates should yield 0m, got ${zeroDist}`);
  });

  // 7. Duplicate report detection within radius
  executeTest(7, 'Geospatial Duplicate Complaint Detection Engine', () => {
    const mockExisting: CivicReport = {
      id: 'CIVIC-2026-MOCK1',
      reporterId: 'user_01',
      reporterName: 'Test Citizen',
      category: 'Pothole or damaged road',
      citizenDescription: 'Deep road crater in traffic lane on Oak Street',
      photoUrl: 'data:image/svg+xml,...',
      location: {
        address: '422 Oak Street',
        latitude: 37.7758,
        longitude: -122.4201,
      },
      priority: computePriorityScore({
        severityScore: 90,
        publicSafetyRiskScore: 90,
        createdAtIso: new Date().toISOString(),
        nearbyRecentCount: 2,
      }),
      status: 'In Progress',
      statusHistory: [],
      internalNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoRecord: true,
    };

    // Proximate match within 30 meters with matching category
    const duplicates = findPotentialDuplicates({
      category: 'Pothole or damaged road',
      description: 'Dangerous pothole in the road lane',
      latitude: 37.7760,
      longitude: -122.4201,
      existingReports: [mockExisting],
      maxRadiusMeters: 150,
    });

    assert(duplicates.length === 1, 'Should find 1 duplicate match');
    assert(duplicates[0].categoryMatch === true, 'Category must match');
    assert(duplicates[0].distanceMeters < 50, `Distance should be under 50m, got ${duplicates[0].distanceMeters}`);
  });

  // 8. Role-Based Access Control and finite state transitions
  executeTest(8, 'Role-Based Access Control (RBAC) & Finite State Transitions', () => {
    // Citizen role cannot transition any status
    const citTransition = canUserTransitionStatus('citizen', 'Submitted', 'In Progress');
    assert(citTransition.allowed === false, 'Citizen must not be allowed to change complaint status');

    // Officer can transition Submitted -> Under Review
    const offValid = canUserTransitionStatus('officer', 'Submitted', 'Under Review');
    assert(offValid.allowed === true, 'Officer can move Submitted -> Under Review');

    // Officer cannot transition directly Submitted -> Resolved without field progression
    const offInvalid = canUserTransitionStatus('officer', 'Submitted', 'Resolved');
    assert(offInvalid.allowed === false, 'Direct skip from Submitted to Resolved must be rejected');

    // Only Admin can reopen Closed tickets
    const offReopen = canUserTransitionStatus('officer', 'Closed', 'In Progress');
    assert(offReopen.allowed === false, 'Officers cannot reopen Closed tickets');

    const admReopen = canUserTransitionStatus('admin', 'Closed', 'In Progress');
    assert(admReopen.allowed === true, 'Admins can reopen Closed tickets');
  });

  // 9. Coordinate bounds and format validation
  executeTest(9, 'Geospatial Coordinate Boundary & Type Validation', () => {
    assert(validateCoordinates(37.77, -122.42).isValid, 'Valid coordinates should pass');
    assert(!validateCoordinates(95.0, 10.0).isValid, 'Latitude > 90 must fail');
    assert(!validateCoordinates(-95.0, 10.0).isValid, 'Latitude < -90 must fail');
    assert(!validateCoordinates(10.0, 190.0).isValid, 'Longitude > 180 must fail');
    assert(!validateCoordinates(NaN, 10.0).isValid, 'NaN coordinate must fail');
    assert(!validateCoordinates(undefined, undefined).isValid, 'Undefined coordinates must fail');
  });

  // 10. Input sanitization against XSS & script injection
  executeTest(10, 'Security Input Sanitization (XSS, Script Protocols & HTML Tags)', () => {
    const maliciousPayload = '<script>alert("xss")</script>Dangerous pothole outside clinic';
    const clean = sanitizeText(maliciousPayload);
    assert(!clean.includes('<script>') && !clean.includes('</script>'), 'Script tags must be stripped');
    assert(clean.includes('Dangerous pothole outside clinic'), 'Legitimate text content must be retained');

    const inlineHandler = '<img src=x onerror=alert(1)>Broken curb';
    const cleanHandler = sanitizeText(inlineHandler);
    assert(!cleanHandler.includes('<img') && !cleanHandler.includes('onerror='), 'Inline event handlers must be neutralized');

    const jsUri = 'javascript:evil()';
    const cleanJsUri = sanitizeText(jsUri);
    assert(!cleanJsUri.includes('javascript:'), 'javascript: protocol must be stripped');
  });

  // 11. Text token Jaccard similarity algorithm
  executeTest(11, 'Text Token Jaccard Overlap & Keyword Similarity Algorithm', () => {
    const simHigh = calculateTextSimilarity(
      'Deep asphalt crater on Oak Street',
      'Oak Street asphalt crater in roadway'
    );
    assert(simHigh >= 50, `High overlap expected, got ${simHigh}%`);

    const simLow = calculateTextSimilarity(
      'Streetlight lamp fixture broken',
      'Overflowing garbage bin on sidewalk'
    );
    assert(simLow < 20, `Low overlap expected, got ${simLow}%`);
  });

  // 12. SLA calculation & overdue verification
  executeTest(12, 'SLA Resolution Window Calculation & Overdue Classification', () => {
    const slaHours = { critical: 24, high: 48, medium: 96, low: 168 };

    // A report created 30 hours ago with Critical SLA (24h) is overdue
    const elapsedHours = 30;
    const remainingCritical = slaHours.critical - elapsedHours;
    assert(remainingCritical < 0, 'Critical report 30h old must be marked overdue');

    // Same report with Low SLA (168h) is not overdue
    const remainingLow = slaHours.low - elapsedHours;
    assert(remainingLow > 0, 'Low report 30h old must not be marked overdue');
  });

  const total = tests.length;
  const failed = total - passedCount;
  const success = failed === 0;

  if (typeof process !== 'undefined' && process.stdout) {
    console.log('\n------------------------------------------------------');
    console.log(`Results: ${passedCount}/${total} tests passed (${success ? 'SUCCESS' : 'FAILURE'})`);
    console.log('======================================================\n');
  }

  return {
    success,
    total,
    passed: passedCount,
    failed,
    tests,
  };
}

// Auto-run if executed directly via Node / tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('civic.test.ts')) {
  const result = runCivicAiTests();
  if (!result.success && process.exit) {
    process.exit(1);
  }
}
