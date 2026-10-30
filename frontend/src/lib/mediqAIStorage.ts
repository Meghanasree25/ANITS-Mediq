
import { supabase } from "./supabase";
import type { MEDIQPrediction } from "./mediqAI";

export interface SavedMEDIQPrediction extends MEDIQPrediction {
  id: string;
  patient_registration_id: string;
  created_at: string;
}

export async function saveMEDIQPrediction(
  patientId: string,
  prediction: MEDIQPrediction
): Promise<SavedMEDIQPrediction> {
  const { data, error } = await supabase
    .from("mediq_ai_predictions")
    .insert({
      patient_registration_id: patientId,
      triage_level: String(prediction.triage_level),
      suggested_triage_level:
        prediction.suggested_triage_level,
      recommended_department: prediction.department,
      model_confidence: prediction.confidence,
      emergency_probability:
        prediction.emergency_probability,
      review_status: prediction.review_status,
      safety_reasons: prediction.safety_reasons,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to save MEDIQ AI prediction: ${error.message}`
    );
  }

  return {
    id: data.id,
    patient_registration_id: data.patient_registration_id,
    created_at: data.created_at,
    triage_level:
      data.triage_level === "ABSTAIN"
        ? "ABSTAIN"
        : Number(data.triage_level),
    suggested_triage_level: data.suggested_triage_level,
    department: data.recommended_department,
    confidence: data.model_confidence,
    emergency_probability: data.emergency_probability,
    review_status: data.review_status,
    safety_reasons: data.safety_reasons ?? [],
  };
}

export async function getLatestMEDIQPrediction(
  patientId: string
): Promise<SavedMEDIQPrediction | null> {
  const { data, error } = await supabase
    .from("mediq_ai_predictions")
    .select("*")
    .eq("patient_registration_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to retrieve MEDIQ AI prediction: ${error.message}`
    );
  }

  if (!data) return null;

  return {
    id: data.id,
    patient_registration_id: data.patient_registration_id,
    created_at: data.created_at,
    triage_level:
      data.triage_level === "ABSTAIN"
        ? "ABSTAIN"
        : Number(data.triage_level),
    suggested_triage_level: data.suggested_triage_level,
    department: data.recommended_department,
    confidence: data.model_confidence,
    emergency_probability: data.emergency_probability,
    review_status: data.review_status,
    safety_reasons: data.safety_reasons ?? [],
  };
}
