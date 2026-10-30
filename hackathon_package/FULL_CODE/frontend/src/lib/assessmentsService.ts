
import { supabase } from "./supabase";

export type AssessmentDecision =
  | "ESCALATE_NOW"
  | "CANNOT_ASSESS"
  | "NURSE_REVIEW";

export interface TriageAssessment {
  id: string;
  patient_registration_id: string;
  decision: AssessmentDecision;
  recommended_department: string | null;
  red_flags: string[];
  triggered_rules: string[];
  validation_issues: string[];
  engine_version: string;
  assessed_at: string;
}

export async function getLatestAssessment(
  registrationId: string
): Promise<TriageAssessment | null> {
  const { data, error } = await supabase
    .from("triage_assessments")
    .select(
      "id, patient_registration_id, decision, recommended_department, red_flags, triggered_rules, validation_issues, engine_version, assessed_at"
    )
    .eq("patient_registration_id", registrationId)
    .order("assessed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to fetch MEDIQ assessment:",
      error
    );
    throw error;
  }

  return data as TriageAssessment | null;
}

export async function getAssessmentHistory(
  registrationId: string
): Promise<TriageAssessment[]> {
  const { data, error } = await supabase
    .from("triage_assessments")
    .select(
      "id, patient_registration_id, decision, recommended_department, red_flags, triggered_rules, validation_issues, engine_version, assessed_at"
    )
    .eq("patient_registration_id", registrationId)
    .order("assessed_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error(
      "Failed to fetch assessment history:",
      error
    );
    throw error;
  }

  return (data ?? []) as TriageAssessment[];
}
