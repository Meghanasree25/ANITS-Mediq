
import pandas as pd


def apply_safety_rules(patient):
    """
    Prototype safety flags for synthetic MEDIQ data.

    Returns:
        escalation_required: bool
        reasons: list[str]

    This is not a validated clinical triage protocol.
    """
    reasons = []

    def number(field):
        value = patient.get(field)
        try:
            value = float(value)
            return None if pd.isna(value) else value
        except (TypeError, ValueError):
            return None

    spo2 = number("spo2_pct")
    pulse = number("pulse_bpm")
    bp = number("bp_systolic")

    complaint = str(
        patient.get("chief_complaint") or ""
    ).lower()

    # Illustrative safety triggers, not clinical thresholds
    if spo2 is not None and spo2 <= 90:
        reasons.append("Low oxygen saturation")

    if pulse is not None and (pulse < 40 or pulse > 150):
        reasons.append("Extremely abnormal pulse")

    if bp is not None and bp <= 0:
        reasons.append(
            "Invalid or critical blood pressure reading"
        )

    # Explicit dataset red flags
    red_flags = str(patient.get("red_flags") or "")

    if "RF_SEVERE_BLEEDING" in red_flags:
        reasons.append("Severe bleeding red flag")

    if "RF_RESP_DISTRESS" in red_flags:
        reasons.append("Respiratory distress red flag")

    # Simple multilingual complaint indicators
    danger_phrases = [
        "vomiting blood",
        "blood in vomit",
        "khoon ki ulti",
        "shwasa aadatledu"
    ]

    if any(phrase in complaint for phrase in danger_phrases):
        reasons.append("Potential emergency complaint")

    return {
        "escalation_required": bool(reasons),
        "reasons": reasons
    }


if __name__ == "__main__":
    df = pd.read_csv("data/missed_emergencies.csv")

    print("\nMEDIQ SAFETY RULE TEST")
    print("-" * 55)

    for _, patient in df.iterrows():
        result = apply_safety_rules(patient.to_dict())

        print("\nPatient:", patient["visit_id"])
        print("Escalation:", result["escalation_required"])
        print("Reasons:", ", ".join(result["reasons"]))
