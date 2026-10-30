
import { supabase } from "./supabase";

export async function testAssessmentFunction(
  registrationId: string
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Please log in first.");
    return;
  }

  const { data, error } =
    await supabase.functions.invoke(
      "record-triage-assessment",
      {
        body: {
          patient_registration_id: registrationId,
        },
      }
    );

  if (error) {
    console.error("Function test failed:", error);
    return;
  }

  console.log("MEDIQ function response:", data);
}
