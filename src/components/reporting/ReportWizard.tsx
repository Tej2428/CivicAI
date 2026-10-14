import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  AiAssessment,
  DuplicateMatch,
  IssueCategory,
} from '../../types/civic';
import { requestImageAnalysis, ImageTriageResponse } from '../../services/aiService';
import { compressImage } from '../../services/imageCompression';
import { computePriorityScore } from '../../utils/priorityScorer';
import { findPotentialDuplicates } from '../../utils/duplicateDetector';
import { generateComplaintId } from '../../utils/idGenerator';
import { validateReportInput, validateImageFile, sanitizeText } from '../../utils/validation';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
} from 'lucide-react';
import { PhotoUploadStep } from './steps/PhotoUploadStep';
import { DetailsStep } from './steps/DetailsStep';
import { LocationStep } from './steps/LocationStep';
import { AiReviewStep } from './steps/AiReviewStep';
import { DuplicateReviewStep } from './steps/DuplicateReviewStep';

interface ReportWizardProps {
  onCancel: () => void;
  onSuccess: (reportId: string) => void;
  initialCategory?: IssueCategory;
}

const QUICK_LOCATIONS = [
  { name: 'Central Ward (Oak St)', address: '422 Oak Street', lat: 37.7758, lng: -122.4201, neighborhood: 'Central Ward' },
  { name: 'Downtown Market', address: '90 Market Square', lat: 37.7766, lng: -122.4170, neighborhood: 'Downtown East' },
  { name: 'West End Library', address: '732 Grand Avenue', lat: 37.7725, lng: -122.4241, neighborhood: 'West End' },
  { name: 'North Park Promenade', address: 'North Park Promenade #88', lat: 37.7812, lng: -122.4180, neighborhood: 'North Park' },
  { name: 'Riverside Walk', address: 'Riverside Canal Bridge #RB-09', lat: 37.7665, lng: -122.4230, neighborhood: 'Riverside Ward' },
];

export const ReportWizard: React.FC<ReportWizardProps> = ({ onCancel, onSuccess, initialCategory }) => {
  const { currentUser } = useAuth();
  const { reports, priorityConfig, createNewReport } = useReports();

  const [step, setStep] = useState<number>(1);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Form Fields
  const [category, setCategory] = useState<IssueCategory>(initialCategory || 'Pothole or damaged road');
  const [description, setDescription] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [address, setAddress] = useState<string>('422 Oak Street, Central Ward');
  const [latitude, setLatitude] = useState<number>(37.7758);
  const [longitude, setLongitude] = useState<number>(-122.4201);
  const [neighborhood, setNeighborhood] = useState<string>('Central Ward');
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // AI Assessment State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAssessment, setAiAssessment] = useState<AiAssessment | null>(null);
  const [isRealAiResult, setIsRealAiResult] = useState<boolean>(false);

  // Duplicate Check
  const [potentialDuplicates, setPotentialDuplicates] = useState<DuplicateMatch[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Process and compress image file
  const processImageFile = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid && validation.error) {
      setPhotoError(validation.error);
      return;
    }

    setPhotoError('');
    setIsCompressing(true);

    try {
      const result = await compressImage(file);
      setPhotoDataUrl(result.dataUrl);
      setCompressionStats({
        original: result.originalSizeBytes,
        compressed: result.compressedSizeBytes,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compress photo.';
      setPhotoError(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const useSamplePhoto = (sampleCategory: IssueCategory) => {
    const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><text x="40" y="80" fill="%2338bdf8" font-size="24" font-family="sans-serif" font-weight="bold">CIVIC EVIDENCE SAMPLE</text><text x="40" y="120" fill="%23f8fafc" font-size="18" font-family="sans-serif">${encodeURIComponent(sampleCategory)}</text><circle cx="300" cy="240" r="80" fill="%230f172a"/><path d="M260 240 L290 270 L340 210" stroke="%232dd4bf" stroke-width="8" fill="none"/></svg>`;
    setPhotoDataUrl(svg);
    setCategory(sampleCategory);
    setPhotoError('');
    setCompressionStats(null);
  };

  const runAiAnalysis = async () => {
    if (!photoDataUrl) return;
    setIsAnalyzing(true);

    try {
      const res: ImageTriageResponse = await requestImageAnalysis({
        imageBase64: photoDataUrl,
        userHintCategory: category,
        userDescription: description,
      });

      setAiAssessment(res.assessment);
      setIsRealAiResult(res.isRealAi);

      if (res.assessment.category && res.assessment.category !== 'Uncertain or unclassifiable') {
        setCategory(res.assessment.category);
      }
    } catch {
      // Handled via fallback assessment
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('Acquiring high-accuracy GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setAddress(`GPS Position (${lat}, ${lng})`);
        setGpsStatus(`GPS coordinates locked (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsStatus(`GPS access unavailable (${err.message}). Selected manual location.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const checkForDuplicates = () => {
    const matches = findPotentialDuplicates({
      category,
      description,
      latitude,
      longitude,
      existingReports: reports,
      maxRadiusMeters: priorityConfig.duplicateRadiusMeters || 150,
    });
    setPotentialDuplicates(matches);
  };

  const goToNextStep = () => {
    setFieldErrors({});

    if (step === 1) {
      if (!photoDataUrl) {
        setPhotoError('Please capture or upload an issue photograph to proceed.');
        return;
      }
      runAiAnalysis();
      setStep(2);
    } else if (step === 2) {
      const cleanDesc = sanitizeText(description);
      if (!cleanDesc || cleanDesc.length < 5) {
        setDescription(`${category} reported on public right of way requiring municipal inspection.`);
      }
      setStep(3);
    } else if (step === 3) {
      if (!address.trim()) {
        setFieldErrors({ address: 'Please provide a street address or location description.' });
        return;
      }
      setStep(4);
    } else if (step === 4) {
      checkForDuplicates();
      setStep(5);
    }
  };

  const handleSubmitReport = () => {
    if (isSubmitting) return;

    // Validate entire model
    const validation = validateReportInput({
      category,
      description: sanitizeText(description),
      photoUrl: photoDataUrl,
      address: sanitizeText(address),
      latitude,
      longitude,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setSubmitError('Please correct the highlighted form errors before submission.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const complaintId = generateComplaintId();

      const priority = computePriorityScore({
        severityScore: aiAssessment?.severityScore || 65,
        publicSafetyRiskScore: aiAssessment?.publicSafetyRiskScore || 60,
        createdAtIso: new Date().toISOString(),
        nearbyRecentCount: potentialDuplicates.length,
        config: priorityConfig,
        forceHumanReview: aiAssessment?.recommendedHumanReview,
      });

      createNewReport({
        id: complaintId,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        category,
        citizenDescription: sanitizeText(description),
        photoUrl: photoDataUrl,
        location: {
          address: sanitizeText(address),
          landmark: landmark ? sanitizeText(landmark) : undefined,
          neighborhood: neighborhood || 'Central Ward',
          latitude,
          longitude,
        },
        aiAssessment: aiAssessment || undefined,
        priority,
        status: 'Submitted',
        isDemoRecord: false,
      });

      setCreatedId(complaintId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register complaint.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully created, display immediate confirmation
  if (createdId) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full uppercase">
            Complaint Registered
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Work Ticket #{createdId}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Your complaint has been queued for municipal review with automated priority scoring and location lock.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase">Category:</span>
            <span className="font-semibold text-slate-900">{category}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase">Location:</span>
            <span className="text-slate-900 truncate max-w-[240px]">{address}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onSuccess(createdId)}
            className="flex-1 min-h-[44px] py-3 px-4 bg-slate-950 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Track This Complaint
          </button>
          <button
            onClick={onCancel}
            className="min-h-[44px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-8">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase text-teal-400 font-bold tracking-wider">
            Report an Infrastructure Issue
          </span>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-md min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Cancel reporting"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold">
          {['Photograph', 'Details', 'Location', 'AI Assessment', 'Submit'].map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-colors ${
                    isCurrent
                      ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-400/20'
                      : isCompleted
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : stepNum}
                </div>
                <span className={`text-[10px] hidden sm:block ${isCurrent ? 'text-teal-300 font-bold' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === 1 && (
          <PhotoUploadStep
            photoDataUrl={photoDataUrl}
            isCompressing={isCompressing}
            compressionStats={compressionStats}
            photoError={photoError}
            onSelectFile={processImageFile}
            onRemovePhoto={() => {
              setPhotoDataUrl('');
              setCompressionStats(null);
            }}
            onUseSamplePhoto={useSamplePhoto}
          />
        )}

        {step === 2 && (
          <DetailsStep
            category={category}
            description={description}
            landmark={landmark}
            fieldErrors={fieldErrors}
            onCategoryChange={setCategory}
            onDescriptionChange={setDescription}
            onLandmarkChange={setLandmark}
          />
        )}

        {step === 3 && (
          <LocationStep
            address={address}
            neighborhood={neighborhood}
            latitude={latitude}
            longitude={longitude}
            gpsStatus={gpsStatus}
            fieldErrors={fieldErrors}
            quickLocations={QUICK_LOCATIONS}
            onRequestGpsLocation={handleRequestLocation}
            onAddressChange={setAddress}
            onNeighborhoodChange={setNeighborhood}
            onLatitudeChange={setLatitude}
            onLongitudeChange={setLongitude}
            onSelectQuickLocation={(loc) => {
              setAddress(loc.address);
              setLatitude(loc.lat);
              setLongitude(loc.lng);
              setNeighborhood(loc.neighborhood);
            }}
          />
        )}

        {step === 4 && (
          <AiReviewStep
            isAnalyzing={isAnalyzing}
            aiAssessment={aiAssessment}
            isRealAiResult={isRealAiResult}
            onReAnalyze={runAiAnalysis}
          />
        )}

        {step === 5 && (
          <DuplicateReviewStep
            potentialDuplicates={potentialDuplicates}
            category={category}
            description={description}
            address={address}
            landmark={landmark}
            photoDataUrl={photoDataUrl}
            submitError={submitError}
          />
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-950 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitReport}
              className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
