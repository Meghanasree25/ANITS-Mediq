
const AI_API_URL = "http://127.0.0.1:8000";

export interface MEDIQPatientInput {
  age_years: number;
  age_months?: number | null;
  sex: string;
  pregnant?: string | null;
  arrival_mode: string;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  pulse_bpm?: number | null;
  temp_c?: number | null;
  spo2_pct?: number | null;
  chief_complaint: string;
  known_conditions?: string;
  current_medications?: string;
}

export interface MEDIQPrediction {
  triage_level: number | "ABSTAIN";
  suggested_triage_level: number;
  department: string;
  confidence: number;
  emergency_probability: number;
  review_status: string;
  safety_reasons: string[];
}

interface MEDIQAPIResponse {
  status: string;
  prediction: MEDIQPrediction;
  disclaimer: string;
}

export async function getMEDIQPrediction(
  patient: MEDIQPatientInput
): Promise<MEDIQPrediction> {
  const response = await fetch(`${AI_API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    throw new Error(
      `MEDIQ AI request failed: HTTP ${response.status}`
    );
  }

  const result: MEDIQAPIResponse = await response.json();

  if (result.status !== "success" || !result.prediction) {
    throw new Error("Invalid MEDIQ AI response");
  }

  return result.prediction;
}
