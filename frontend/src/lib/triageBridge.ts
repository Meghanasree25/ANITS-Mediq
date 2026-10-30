/* ==========================================================================
   MEDIQ — CLINICAL AI TRIAGE BRIDGE
   Translates Touch-to-Triage visual selections into the exact PatientIntake payload
   Calls FastAPI http://127.0.0.1:8000/predict (decision_engine.py)
   ========================================================================== */

import type {
  ClinicalVitals,
  ESILevel,
  PatientDemographics,
  SymptomOption,
  TriageEvaluationResult,
  VisualQuestionnaireAnswers,
} from "../types/triage";
import { getMEDIQPrediction, type MEDIQPatientInput } from "./mediqAI";

export async function evaluatePatientTriage(
  demographics: PatientDemographics,
  symptoms: SymptomOption[],
  questionnaire: VisualQuestionnaireAnswers,
  vitals?: ClinicalVitals
): Promise<TriageEvaluationResult> {
  const timestamp = new Date().toISOString();

  // 1. Check for immediate emergency red flags
  const redFlagSymptoms = symptoms.filter((s) => s.isRedFlag);
  const hasEmergencyRedFlag = redFlagSymptoms.length > 0;

  // 2. Synthesize clinical text representation from visual choices
  const symptomsList = symptoms.map((s) => s.clinicalPrompt).join("; ");
  const durationDesc =
    questionnaire.duration === "just_started"
      ? "started today (acute)"
      : questionnaire.duration === "yesterday"
      ? "since yesterday"
      : questionnaire.duration === "several_days"
      ? "duration 2-4 days"
      : "chronic > 1 week";

  const severityDesc = `severity: ${questionnaire.severity.toUpperCase()}`;
  const worseningDesc = questionnaire.isGettingWorse
    ? "progressively worsening"
    : "stable";
  const onsetDesc = questionnaire.onsetTime
    ? `onset: ${questionnaire.onsetTime}`
    : "";
  const otherSymps =
    questionnaire.otherSymptoms &&
    questionnaire.otherSymptoms.length > 0 &&
    !questionnaire.otherSymptoms.includes("none")
      ? `associated signs: ${questionnaire.otherSymptoms.join(", ")}`
      : "";

  const synthesizedChiefComplaint = [
    symptomsList,
    durationDesc,
    severityDesc,
    worseningDesc,
    onsetDesc,
    otherSymps,
  ]
    .filter(Boolean)
    .join(". ");

  // 3. Assemble exact PatientIntake payload expected by decision_engine.py
  const payload: MEDIQPatientInput = {
    age_years: demographics.ageYears,
    age_months: null,
    sex: demographics.gender,
    pregnant: demographics.isPregnant ? "Y" : "N",
    arrival_mode: demographics.arrivalMode,
    bp_systolic: vitals?.bpSystolic ?? null,
    bp_diastolic: vitals?.bpDiastolic ?? null,
    pulse_bpm: vitals?.pulseBpm ?? null,
    temp_c: vitals?.tempC ?? null,
    spo2_pct: vitals?.spo2Pct ?? null,
    chief_complaint: synthesizedChiefComplaint,
    known_conditions: (demographics.knownConditions || []).join(", "),
    current_medications: "",
  };

  // 4. Try live Python FastAPI backend
  try {
    const aiResponse = await getMEDIQPrediction(payload);

    // Map AI response
    const triageLevel =
      aiResponse.triage_level === "ABSTAIN"
        ? "ABSTAIN"
        : (Number(aiResponse.triage_level) as ESILevel);

    const suggestedLevel =
      Number(aiResponse.suggested_triage_level) >= 1 &&
      Number(aiResponse.suggested_triage_level) <= 5
        ? (Number(aiResponse.suggested_triage_level) as ESILevel)
        : (3 as ESILevel);

    const safetyReasons = [...(aiResponse.safety_reasons || [])];
    if (hasEmergencyRedFlag) {
      redFlagSymptoms.forEach((rf) => {
        safetyReasons.push(
          `Touch Red Flag: ${rf.redFlagCode || "CRITICAL_SYMPTOM"}`
        );
      });
    }

    return {
      triageLevel: hasEmergencyRedFlag ? "ABSTAIN" : triageLevel,
      suggestedTriageLevel: hasEmergencyRedFlag ? (2 as ESILevel) : suggestedLevel,
      department: hasEmergencyRedFlag ? "Emergency/Casualty" : aiResponse.department,
      confidence: aiResponse.confidence,
      emergencyProbability: aiResponse.emergency_probability,
      reviewStatus: hasEmergencyRedFlag
        ? "ESCALATED_EMERGENCY"
        : (aiResponse.review_status as TriageEvaluationResult["reviewStatus"]),
      safetyReasons: Array.from(new Set(safetyReasons)),
      isEmergencyEscalated: hasEmergencyRedFlag,
      timestamp,
      source: "MEDIQ_ML_BACKEND",
    };
  } catch (error) {
    console.warn(
      "Live Python API unreachable or timed out. Falling back to local clinical safety engine:",
      error
    );

    // Clinical rule-based fallback adhering strictly to triage_primer.md
    let suggestedLevel: ESILevel = 4;
    let triageLevel: ESILevel | "ABSTAIN" = 4;
    let department = symptoms[0]?.typicalDepartment || "General Medicine";
    const safetyReasons: string[] = [];

    // Vital signs checks
    if (vitals?.spo2Pct && vitals.spo2Pct < 90) {
      safetyReasons.push("Danger-zone SpO2 (<90%)");
      suggestedLevel = 2;
    }
    if (vitals?.pulseBpm && (vitals.pulseBpm < 40 || vitals.pulseBpm > 130)) {
      safetyReasons.push("Abnormal pulse reading");
      suggestedLevel = 2;
    }
    if (vitals?.bpSystolic && vitals.bpSystolic <= 90) {
      safetyReasons.push("Danger-zone low blood pressure");
      suggestedLevel = 2;
    }

    if (hasEmergencyRedFlag) {
      redFlagSymptoms.forEach((rf) => {
        safetyReasons.push(
          `Identified Red Flag: ${rf.redFlagCode || "EMERGENCY_SYMPTOM"}`
        );
      });
      suggestedLevel = 2;
      department = "Emergency/Casualty";
      triageLevel = "ABSTAIN";
    } else if (questionnaire.severity === "unbearable") {
      suggestedLevel = 2;
      department = "Emergency/Casualty";
      triageLevel = "ABSTAIN";
      safetyReasons.push("Unbearable emergency pain reported");
    } else if (questionnaire.severity === "severe") {
      suggestedLevel = 3;
    }

    return {
      triageLevel: safetyReasons.length > 0 ? "ABSTAIN" : triageLevel,
      suggestedTriageLevel: suggestedLevel,
      department,
      confidence: 0.88,
      emergencyProbability: hasEmergencyRedFlag ? 0.95 : 0.08,
      reviewStatus: hasEmergencyRedFlag
        ? "ESCALATED_EMERGENCY"
        : safetyReasons.length > 0
        ? "URGENT_CLINICIAN_REVIEW"
        : "STANDARD_CLINICIAN_CONFIRMATION",
      safetyReasons,
      isEmergencyEscalated: hasEmergencyRedFlag,
      timestamp,
      source: "CLINICAL_SAFETY_ENGINE",
    };
  }
}
