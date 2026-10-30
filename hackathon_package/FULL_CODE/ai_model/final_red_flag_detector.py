import pandas as pd
from red_flag_detector import detect_red_flags as predict_red_flags


def detect_red_flags(patient):
    result = predict_red_flags(
        patient.get("chief_complaint")
    )

    flags = set(result["red_flags"])

    age_months = pd.to_numeric(
        patient.get("age_months"), errors="coerce"
    )
    age_years = pd.to_numeric(
        patient.get("age_years"), errors="coerce"
    )

    # Prevent infant-fever flags for patients
    # whose recorded age excludes infancy.
    not_infant = (
        pd.notna(age_months) and age_months >= 3
    ) or (
        pd.isna(age_months)
        and pd.notna(age_years)
        and age_years >= 1
    )

    if not_infant:
        flags.discard("RF_HIGH_FEVER_INFANT")

    return ";".join(sorted(flags))
