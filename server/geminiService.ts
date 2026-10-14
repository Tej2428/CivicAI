import { GoogleGenAI, Type } from '@google/genai';
import { AiAssessment, IssueCategory } from '../src/types/civic';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export interface ImageAnalysisRequest {
  imageBase64: string; // raw base64 or data URL
  mimeType?: string;
  userHintCategory?: string;
  userDescription?: string;
}

export interface ImageAnalysisResult {
  success: boolean;
  assessment: AiAssessment;
  isRealAi: boolean;
  modelUsed?: string;
  errorMessage?: string;
}

/**
 * Server-side Gemini API vision analysis for civic infrastructure.
 * Never called directly from the client.
 */
export async function analyzeCivicImage(
  req: ImageAnalysisRequest
): Promise<ImageAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Clean base64 string
  let rawBase64 = req.imageBase64;
  let mimeType = req.mimeType || 'image/jpeg';

  if (rawBase64.startsWith('data:')) {
    const parts = rawBase64.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) mimeType = match[1];
    rawBase64 = parts[1] || '';
  }

  // If no Gemini API key is provided in environment, generate an honest labeled demo assessment
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      success: false,
      isRealAi: false,
      errorMessage: 'GEMINI_API_KEY is not configured on the server. Showing rule-based demo triage assessment.',
      assessment: generateDemoAssessment(req.userHintCategory, req.userDescription),
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `
You are the CivicAI Municipal Infrastructure Vision Engine.
Analyze the provided photograph of a reported civic infrastructure problem.

You must classify the problem into exactly ONE of the following 8 categories:
1. Pothole or damaged road
2. Garbage accumulation
3. Blocked drainage or waterlogging
4. Damaged streetlight
5. Water leakage
6. Damaged sidewalk
7. Other civic infrastructure issue
8. Uncertain or unclassifiable

User provided description context: "${req.userDescription || 'None provided'}".
User preliminary category hint: "${req.userHintCategory || 'None'}".

Respond strictly with valid JSON conforming to this specification:
- category: One of the 8 exact strings listed above.
- visibleEvidence: Concise 1-2 sentence description of physical evidence visible in the image.
- severity: "low" | "medium" | "high" | "critical".
- severityScore: integer 0 to 100.
- publicSafetyRiskScore: integer 0 to 100.
- publicSafetyConcerns: Specific hazards (pedestrian injury, vehicular crash, contamination, property flooding).
- suggestedSeverityReasoning: Concise municipal triage justification for the severity rating.
- isUnclearOrIrrelevant: true if image is blurred, meme, selfie, or contains no civic issue.
- recommendedHumanReview: true if severe, borderline, or dangerous condition suspected.
- modelConfidenceNotes: Factual statement regarding visual clarity and prominent visual indicators (do not invent fake percentage numbers).
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: rawBase64,
              mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            visibleEvidence: { type: Type.STRING },
            severity: { type: Type.STRING },
            severityScore: { type: Type.INTEGER },
            publicSafetyRiskScore: { type: Type.INTEGER },
            publicSafetyConcerns: { type: Type.STRING },
            suggestedSeverityReasoning: { type: Type.STRING },
            isUnclearOrIrrelevant: { type: Type.BOOLEAN },
            recommendedHumanReview: { type: Type.BOOLEAN },
            modelConfidenceNotes: { type: Type.STRING },
          },
          required: [
            'category',
            'visibleEvidence',
            'severity',
            'severityScore',
            'publicSafetyRiskScore',
            'publicSafetyConcerns',
            'suggestedSeverityReasoning',
            'isUnclearOrIrrelevant',
            'recommendedHumanReview',
            'modelConfidenceNotes',
          ],
        },
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    // Validate category is one of the 8
    const validCategories: IssueCategory[] = [
      'Pothole or damaged road',
      'Garbage accumulation',
      'Blocked drainage or waterlogging',
      'Damaged streetlight',
      'Water leakage',
      'Damaged sidewalk',
      'Other civic infrastructure issue',
      'Uncertain or unclassifiable',
    ];

    let finalCategory: IssueCategory = 'Other civic infrastructure issue';
    if (validCategories.includes(parsed.category as IssueCategory)) {
      finalCategory = parsed.category as IssueCategory;
    }

    const assessment: AiAssessment = {
      category: finalCategory,
      visibleEvidence: parsed.visibleEvidence || 'Visual evidence identified in citizen photo.',
      severity: (['low', 'medium', 'high', 'critical'].includes(parsed.severity)
        ? parsed.severity
        : 'medium') as any,
      severityScore: Math.min(100, Math.max(0, Number(parsed.severityScore) || 50)),
      publicSafetyRiskScore: Math.min(
        100,
        Math.max(0, Number(parsed.publicSafetyRiskScore) || 50)
      ),
      publicSafetyConcerns:
        parsed.publicSafetyConcerns || 'Standard municipal safety assessment applied.',
      suggestedSeverityReasoning:
        parsed.suggestedSeverityReasoning || 'Triage rating derived from visible roadway condition.',
      isUnclearOrIrrelevant: Boolean(parsed.isUnclearOrIrrelevant),
      recommendedHumanReview: Boolean(parsed.recommendedHumanReview),
      modelConfidenceNotes:
        parsed.modelConfidenceNotes || 'Processed via Gemini 3.8 Vision model.',
      analyzedAt: new Date().toISOString(),
      isSimulatedDemo: false,
    };

    return {
      success: true,
      assessment,
      isRealAi: true,
      modelUsed: GEMINI_MODEL,
    };
  } catch (err: any) {
    console.error('Gemini vision API execution error:', err?.message || err);
    return {
      success: false,
      isRealAi: false,
      errorMessage: `Gemini API execution error: ${err?.message || 'Unknown network error'}. Fallen back to rule-based triage.`,
      assessment: generateDemoAssessment(req.userHintCategory, req.userDescription),
    };
  }
}

/**
 * Honest, clearly-labeled rule-based fallback when Gemini API key is not configured or network fails.
 */
function generateDemoAssessment(hintCategory?: string, userDesc?: string): AiAssessment {
  const desc = (userDesc || '').toLowerCase();
  let cat: IssueCategory = 'Other civic infrastructure issue';
  let sev: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let sevScore = 65;
  let safetyScore = 60;
  let concerns = 'Potential pedestrian trip or vehicular hazard.';
  let evidence = 'Urban physical damage pattern visible in submitted photo.';

  if (hintCategory?.includes('Pothole') || desc.includes('hole') || desc.includes('road') || desc.includes('asphalt')) {
    cat = 'Pothole or damaged road';
    sev = 'high';
    sevScore = 82;
    safetyScore = 78;
    concerns = 'Vehicular rim damage, tire blowout, two-wheeler swerve risk.';
    evidence = 'Pavement surface fracture and sub-base aggregate disruption.';
  } else if (hintCategory?.includes('Garbage') || desc.includes('trash') || desc.includes('waste') || desc.includes('dump')) {
    cat = 'Garbage accumulation';
    sev = 'medium';
    sevScore = 70;
    safetyScore = 62;
    concerns = 'Vector breeding (rodents/insects), leachate odor, pedestrian pathway blockage.';
    evidence = 'Solid waste overflow spanning sidewalk perimeter.';
  } else if (hintCategory?.includes('drain') || desc.includes('drain') || desc.includes('flood') || desc.includes('waterlog')) {
    cat = 'Blocked drainage or waterlogging';
    sev = 'high';
    sevScore = 80;
    safetyScore = 75;
    concerns = 'Crosswalk submergence, urban water accumulation, structural road saturation.';
    evidence = 'Catch basin grate occluded by leaves and sediment, standing water pool.';
  } else if (hintCategory?.includes('streetlight') || desc.includes('light') || desc.includes('dark') || desc.includes('lamp')) {
    cat = 'Damaged streetlight';
    sev = 'high';
    sevScore = 85;
    safetyScore = 88;
    concerns = 'Pedestrian route blackout and possible electrical hazard.';
    evidence = 'Non-functional or damaged lighting fixture pole.';
  } else if (hintCategory?.includes('Water') || desc.includes('leak') || desc.includes('pipe') || desc.includes('burst')) {
    cat = 'Water leakage';
    sev = 'high';
    sevScore = 86;
    safetyScore = 76;
    concerns = 'Municipal water loss and road foundation cavitation.';
    evidence = 'Pressurized potable water pooling from roadway crack.';
  } else if (hintCategory?.includes('Sidewalk') || desc.includes('walk') || desc.includes('curb') || desc.includes('trip')) {
    cat = 'Damaged sidewalk';
    sev = 'medium';
    sevScore = 65;
    safetyScore = 68;
    concerns = 'ADA wheelchair barrier and pedestrian stumbling hazard.';
    evidence = 'Displaced concrete paver slab upheaval.';
  }

  return {
    category: cat,
    visibleEvidence: evidence,
    severity: sev,
    severityScore: sevScore,
    publicSafetyRiskScore: safetyScore,
    publicSafetyConcerns: concerns,
    suggestedSeverityReasoning: `Demo rule-based assessment based on ${cat} signature.`,
    isUnclearOrIrrelevant: false,
    recommendedHumanReview: sevScore >= 80,
    modelConfidenceNotes: 'DEMO MODE: Rule-based assessment simulator. Configure GEMINI_API_KEY in Secrets for live Gemini 3.8 Flash vision.',
    analyzedAt: new Date().toISOString(),
    isSimulatedDemo: true,
  };
}
