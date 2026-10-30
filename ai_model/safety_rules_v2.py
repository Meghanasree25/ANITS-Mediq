
import math


def apply_safety_rules(patient):
    """
    Experimental rules for the synthetic TalentAP H1 dataset.
    Based on triage_primer.md, Section 3 and Section 8.

    Not for clinical use.
    """

    reasons = []

    def number(field):
        try:
            value = float(patient.get(field))
            return value if math.isfinite(value) else None
        except (TypeError, ValueError):
            return None

    age = number("age_years")
    months = number("age_months")
    spo2 = number("spo2_pct")
    pulse = number("pulse_bpm")
    systolic = number("bp_systolic")
    diastolic = number("bp_diastolic")
    temp = number("temp_c")

    pregnant = str(patient.get("pregnant") or "").strip().upper() == "Y"

    # Validate recorded values before applying thresholds.
    if spo2 is not None and not (50 <= spo2 <= 100):
        reasons.append("Unreliable oxygen saturation reading")
        spo2 = None

    if pulse is not None and not (25 <= pulse <= 250):
        reasons.append("Unreliable pulse reading")
        pulse = None

    if systolic is not None and not (20 <= systolic <= 260):
        reasons.append("Unreliable systolic BP reading")
        systolic = None

    if diastolic is not None and not (20 <= diastolic <= 260):
        reasons.append("Unreliable diastolic BP reading")
        diastolic = None

    # Convert likely Fahrenheit readings.
    if temp is not None and 86 <= temp <= 113:
        temp = (temp - 32) * 5 / 9
    elif temp is not None and not (30 <= temp <= 45):
        reasons.append("Unreliable temperature reading")
        temp = None

    # Oxygen saturation
    if spo2 is not None and spo2 < 92:
        reasons.append("Danger-zone oxygen saturation")

    # Temperature
    if temp is not None and temp <= 35:
        reasons.append("Danger-zone temperature")

    # Age-dependent heart rate
    if age is not None and pulse is not None:
        if age == 0 and months is not None and months < 3:
            if pulse > 180 or pulse < 60:
                reasons.append("Critical infant pulse")
        elif age < 3:
            if pulse > 160 or (age < 8 and pulse < 60):
                reasons.append("Danger-zone child pulse")
        elif age < 8:
            if pulse > 140 or pulse < 60:
                reasons.append("Danger-zone child pulse")
        elif age < 16:
            if pulse > 120 or pulse <= 40:
                reasons.append("Danger-zone adolescent pulse")
        elif pulse >= 131 or pulse <= 40:
            reasons.append("Danger-zone adult pulse")

    # Blood pressure
    if age is not None and systolic is not None:
        if age >= 10 and systolic <= 90:
            reasons.append("Danger-zone low systolic BP")
        if age >= 16 and systolic >= 220:
            reasons.append("Danger-zone high systolic BP")

    # Pregnancy
    if pregnant:
        if (systolic is not None and systolic >= 160) or (
            diastolic is not None and diastolic >= 110
        ):
            reasons.append("Severe-range pregnancy BP")

    # Fever in very young infants
    if (
        age == 0
        and months is not None
        and months < 3
        and temp is not None
        and (temp >= 38 or temp < 36)
    ):
        reasons.append("Danger-zone infant temperature")

    return {
        "escalation_required": bool(reasons),
        "reasons": reasons
    }
