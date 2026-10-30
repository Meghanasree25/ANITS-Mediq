/* ==========================================================================
   MEDIQ — TOUCH-TO-TRIAGE CLINICAL TYPES
   Multilingual, accessible patient triage data contracts
   ========================================================================== */

export type LanguageCode = "en" | "te" | "hi";

export interface LocalizedText {
  en: string;
  te: string;
  hi: string;
}

export type BodyRegionId =
  | "Head"
  | "Neck"
  | "Chest"
  | "Abdomen"
  | "LeftArm"
  | "RightArm"
  | "LeftLeg"
  | "RightLeg"
  | "head"
  | "eyes"
  | "ears"
  | "throat"
  | "neck"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "back"
  | "shoulders"
  | "arms"
  | "hands"
  | "legs"
  | "knees"
  | "feet";

export type BodyView = "front" | "back";

export interface BodyRegionInfo {
  id: BodyRegionId;
  label: LocalizedText;
  view: BodyView | "both";
  svgPathFront?: string;
  svgPathBack?: string;
  description: LocalizedText;
}

export interface SymptomOption {
  id: string;
  regionId: BodyRegionId;
  label: LocalizedText;
  iconName: string;
  isRedFlag: boolean;
  redFlagCode?: string;
  typicalDepartment: string;
  clinicalPrompt: string;
}

export type SymptomDuration =
  | "just_started"
  | "yesterday"
  | "several_days"
  | "over_a_week";

export type PainSeverity =
  | "mild"
  | "moderate"
  | "severe"
  | "unbearable";

export type OnsetType = "sudden" | "gradual";

export interface VisualQuestionnaireAnswers {
  duration: SymptomDuration;
  severity: PainSeverity;
  onsetTime?: OnsetType;
  otherSymptoms?: string[];
  isGettingWorse: boolean;
  hasOccurredBefore: boolean;
  additionalNotes?: string;
}

export interface PatientDemographics {
  fullName: string;
  ageYears: number;
  gender: "M" | "F" | "Other";
  isPregnant: boolean;
  arrivalMode: "Walk-in" | "Ambulance" | "Wheelchair" | "Assisted";
  phoneNumber?: string;
  knownConditions?: string[];
}

export interface ClinicalVitals {
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulseBpm?: number | null;
  tempC?: number | null;
  spo2Pct?: number | null;
  respRate?: number | null;
}

export type ESILevel = 1 | 2 | 3 | 4 | 5;

export interface TriageEvaluationResult {
  triageLevel: ESILevel | "ABSTAIN";
  suggestedTriageLevel: ESILevel;
  department: string;
  confidence: number;
  emergencyProbability: number;
  reviewStatus:
    | "STANDARD_CLINICIAN_CONFIRMATION"
    | "CLINICIAN_REVIEW"
    | "URGENT_CLINICIAN_REVIEW"
    | "ESCALATED_EMERGENCY";
  safetyReasons: string[];
  isEmergencyEscalated: boolean;
  timestamp: string;
  source: "MEDIQ_ML_BACKEND" | "CLINICAL_SAFETY_ENGINE";
}

export interface PatientTriageRecord {
  id: string;
  token: string;
  demographics: PatientDemographics;
  selectedRegion: BodyRegionId;
  selectedSymptoms: SymptomOption[];
  questionnaire: VisualQuestionnaireAnswers;
  vitals?: ClinicalVitals;
  aiEvaluation: TriageEvaluationResult;
  clinicianReview?: {
    isConfirmed: boolean;
    isOverridden: boolean;
    confirmedLevel: ESILevel;
    overrideReason?: string;
    reviewedBy?: string;
    reviewedAt?: string;
  };
  status:
    | "Waiting"
    | "Under Review"
    | "In Consultation"
    | "Completed"
    | "Emergency Casualty";
  createdAt: string;
  languageUsed: LanguageCode;
}
