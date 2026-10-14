import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import {
  AiAssessment,
  CivicReport,
  DuplicateMatch,
  IssueCategory,
  LocationData,
  SeverityLevel,
} from '../../types/civic';
import { requestImageAnalysis, ImageTriageResponse } from '../../services/aiService';
import { computePriorityScore } from '../../utils/priorityScorer';
import { findPotentialDuplicates } from '../../utils/duplicateDetector';
import { generateComplaintId } from '../../utils/idGenerator';
import { SvgVisual } from '../common/SvgVisual';
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Info,
  ShieldAlert,
  Compass,
} from 'lucide-react';

interface ReportWizardProps {
  onCancel: () => void;
  onSuccess: (reportId: string) => void;
  initialCategory?: IssueCategory;
}

const CATEGORIES: IssueCategory[] = [
  'Pothole or damaged road',
  'Garbage accumulation',
  'Blocked drainage or waterlogging',
  'Damaged streetlight',
  'Water leakage',
  'Damaged sidewalk',
  'Other civic infrastructure issue',
  'Uncertain or unclassifiable',
];

// Default sample locations for city demonstration
const QUICK_LOCATIONS: { name: string; address: string; lat: number; lng: number; neighborhood: string }[] = [
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [category, setCategory] = useState<IssueCategory>(initialCategory || 'Pothole or damaged road');
  const [description, setDescription] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [address, setAddress] = useState<string>('422 Oak Street, Central Ward');
  const [latitude, setLatitude] = useState<number>(37.7758);
  const [longitude, setLongitude] = useState<number>(-122.4201);
  const [neighborhood, setNeighborhood] = useState<string>('Central Ward');
  const [gpsStatus, setGpsStatus] = useState<string>('');

  // AI Assessment State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAssessment, setAiAssessment] = useState<AiAssessment | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isRealAiResult, setIsRealAiResult] = useState<boolean>(false);

  // Duplicate Check
  const [potentialDuplicates, setPotentialDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Photo handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Image size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    setPhotoError('');
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const useSamplePhoto = (sampleCategory: IssueCategory) => {
    // Generate inline SVG data url matching sample category
    const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><text x="40" y="80" fill="%2338bdf8" font-size="24" font-family="sans-serif" font-weight="bold">CIVICAI EVIDENCE PHOTOGRAPH</text><text x="40" y="120" fill="%23f8fafc" font-size="18" font-family="sans-serif">${encodeURIComponent(sampleCategory)}</text><circle cx="300" cy="240" r="80" fill="%230f172a"/><path d="M260 240 L290 270 L340 210" stroke="%232dd4bf" stroke-width="8" fill="none"/></svg>`;
    setPhotoDataUrl(svg);
    setCategory(sampleCategory);
    setPhotoError('');
  };

  // Run AI Image Triage
  const runAiAnalysis = async () => {
    if (!photoDataUrl) return;
    setIsAnalyzing(true);
    setAiMessage('');

    try {
      const res: ImageTriageResponse = await requestImageAnalysis({
        imageBase64: photoDataUrl,
        userHintCategory: category,
        userDescription: description,
      });

      setAiAssessment(res.assessment);
      setIsRealAiResult(res.isRealAi);

      if (res.isRealAi) {
        setAiMessage(`Analyzed by Gemini ${res.modelUsed || '3.8 Flash'}.`);
      } else {
        setAiMessage(res.errorMessage || 'Demonstration rule-based triage simulator.');
      }

      // Auto-suggest category if citizen has not firmly locked it
      if (res.assessment.category && res.assessment.category !== 'Uncertain or unclassifiable') {
        setCategory(res.assessment.category);
      }
    } catch (e: any) {
      setAiMessage(`Triage notice: ${e?.message || 'Using local verification.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // GPS Geolocation Handler
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('Acquiring GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setAddress(`GPS Lat: ${lat}, Lng: ${lng}`);
        setGpsStatus(`GPS coordinates locked (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsStatus(`GPS access denied or unavailable (${err.message}). Selected manual location.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Check for duplicates before Step 5
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

  // Navigation between steps
  const goToNextStep = async () => {
    if (step === 1) {
      if (!photoDataUrl) {
        setPhotoError('Please capture or upload a photograph of the issue to proceed.');
        return;
      }
      // Trigger AI triage as user moves forward
      runAiAnalysis();
      setStep(2);
    } else if (step === 2) {
      if (!description.trim()) {
        setDescription(`${category} observed at the reported location requiring municipal attention.`);
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      checkForDuplicates();
      setStep(5);
    }
  };

  // Final Submission
  const handleSubmitReport = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const complaintId = generateComplaintId();

      // Compute explainable priority score
      const priority = computePriorityScore({
        severityScore: aiAssessment?.severityScore || 65,
        publicSafetyRiskScore: aiAssessment?.publicSafetyRiskScore || 60,
        createdAtIso: new Date().toISOString(),
        nearbyRecentCount: potentialDuplicates.length,
        config: priorityConfig,
        forceHumanReview: aiAssessment?.recommendedHumanReview,
      });

      const locationData: LocationData = {
        address: address.trim() || 'Central Ward, Municipal Area',
        landmark: landmark.trim() || undefined,
        latitude,
        longitude,
        neighborhood,
      };

      const newRep = createNewReport({
        id: complaintId,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        category,
        citizenDescription: description.trim(),
        photoUrl: photoDataUrl,
        location: locationData,
        aiAssessment: aiAssessment || undefined,
        priority,
        status: 'Submitted',
        isDemoRecord: true,
      });

      setCreatedId(newRep.id);
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to register complaint. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Success view
  if (createdId) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Complaint Registered Successfully</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your report has been validated and queued in the municipal dispatch database.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase">Complaint ID:</span>
            <span className="font-mono font-bold text-slate-950 text-base">{createdId}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase">Category:</span>
            <span className="font-semibold text-slate-900">{category}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase">Location:</span>
            <span className="text-slate-900 truncate max-w-[240px]">{address}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold uppercase">Initial Priority:</span>
            <span className="font-bold text-teal-700">Calculated &amp; Queued</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onSuccess(createdId)}
            className="flex-1 py-3 px-4 bg-slate-950 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Track This Complaint
          </button>
          <button
            onClick={onCancel}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-8">
      {/* Step Tracker Header */}
      <div className="bg-slate-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase text-teal-400 font-bold tracking-wider">
            Report an Infrastructure Issue
          </span>
          <button onClick={onCancel} className="text-slate-400 hover:text-white" aria-label="Cancel">
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
        {/* Step 1: Photograph */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 1: Capture or Select Photograph</h3>
              <p className="text-xs text-slate-500 mt-1">
                A clear visual photograph helps computer vision identify the issue and verify field severity.
              </p>
            </div>

            {photoDataUrl ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-300 max-h-72 bg-slate-950 flex items-center justify-center">
                  <img src={photoDataUrl} alt="Selected civic issue preview" className="max-h-72 object-contain" />
                  <button
                    onClick={() => {
                      setPhotoDataUrl('');
                      setPhotoFile(null);
                    }}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-rose-600 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                    title="Remove photograph"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Photo attached successfully</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-700 font-semibold hover:underline"
                  >
                    Replace Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 mb-1">Click to browse or drop an image</div>
                  <div className="text-xs text-slate-500">Supports JPEG, PNG, WebP up to 10MB</div>
                </div>

                {/* Device Camera Input */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-600" />
                    <span>Open Device Camera</span>
                  </button>
                </div>

                {/* Quick Sample Selector for Demo Testing */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 mb-2">
                    Or select a sample issue for testing:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.slice(0, 6).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => useSamplePhoto(cat)}
                        className="p-2 text-left bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-xs text-slate-700 transition-colors cursor-pointer"
                      >
                        <span className="line-clamp-1 font-medium">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {photoError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Issue Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 2: Issue Information</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select category and describe the nature of the infrastructure failure.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-sm font-medium bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Description of Problem
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Hazardous pothole measuring approximately 15cm deep in active bus lane, swerving cars..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Prominent Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Across from St. Jude Medical Clinic, next to pillar 14"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 3: Location Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 3: Location</h3>
              <p className="text-xs text-slate-500 mt-1">
                Accurate coordinates allow municipal crews to locate the defect and support duplicate detection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRequestLocation}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-teal-400" />
                <span>Use My Device Location</span>
              </button>
              {gpsStatus && <span className="text-xs text-slate-600 font-mono">{gpsStatus}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Street Address / Description
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Neighborhood / Ward
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">Quick City Locations:</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      setAddress(loc.address);
                      setLatitude(loc.lat);
                      setLongitude(loc.lng);
                      setNeighborhood(loc.neighborhood);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-md border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: AI Assessment Verification */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Step 4: AI Triage Assessment</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Computer vision preliminary classification and severity recommendation.
                </p>
              </div>
              <button
                type="button"
                onClick={runAiAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 text-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>Re-Analyze</span>
              </button>
            </div>

            {isAnalyzing ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
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
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                    isRealAiResult ? 'bg-teal-100 text-teal-800 font-bold' : 'bg-slate-200 text-slate-700'
                  }`}>
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
                    <span className={`font-bold uppercase ${
                      aiAssessment.severity === 'critical' ? 'text-rose-600' :
                      aiAssessment.severity === 'high' ? 'text-amber-600' : 'text-slate-800'
                    }`}>
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
                AI analysis has not run yet. Click "Analyze" to trigger vision triage.
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review, Duplicate Check & Submit */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Step 5: Review &amp; Submit</h3>
              <p className="text-xs text-slate-500 mt-1">
                Verify your complaint details before generating the municipal work ticket.
              </p>
            </div>

            {/* Duplicate Alert if matches found */}
            {potentialDuplicates.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Possible Duplicate Reports Detected Nearby</span>
                </div>
                <p className="text-xs text-amber-800">
                  We found {potentialDuplicates.length} active complaint{potentialDuplicates.length === 1 ? '' : 's'} registered within 150m of your location.
                  Review below to see if the issue is already in progress:
                </p>

                <div className="space-y-2">
                  {potentialDuplicates.slice(0, 2).map((dup) => (
                    <div
                      key={dup.reportId}
                      className="p-3 bg-white rounded-lg border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{dup.reportId}</div>
                        <div className="text-slate-600 mt-0.5">{dup.reason}</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Status: {dup.existingReport.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-amber-900 font-medium pt-1">
                  You may continue to submit your complaint if this is a distinct issue or fresh occurrence.
                </div>
              </div>
            )}

            {/* Summary card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-slate-500 font-semibold uppercase block">Category:</span>
                  <span className="text-base font-bold text-slate-900">{category}</span>
                </div>
                <div className="w-16 h-12 rounded bg-slate-900 overflow-hidden shrink-0">
                  <img src={photoDataUrl} alt="Report thumbnail" className="w-full h-full object-cover" />
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold uppercase block">Description:</span>
                <p className="text-slate-800 font-medium mt-0.5">{description}</p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold uppercase block">Location:</span>
                <p className="text-slate-800 font-medium mt-0.5">
                  {address} {landmark ? `(Landmark: ${landmark})` : ''}
                </p>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Wizard Action Controls */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-950 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitReport}
              className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
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
