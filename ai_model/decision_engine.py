
import numpy as np
import pandas as pd
import joblib

from pathlib import Path
from safety_rules import apply_safety_rules

BASE = Path(__file__).resolve().parent

triage_model = joblib.load(
    BASE / "models" / "triage_model.pkl"
)

department_model = joblib.load(
    BASE / "models" / "department_model.pkl"
)

NUMERIC = [
    "age_years", "age_months",
    "bp_systolic", "bp_diastolic",
    "pulse_bpm", "temp_c", "spo2_pct"
]

CATEGORICAL = [
    "sex", "pregnant", "arrival_mode"
]

TEXT = [
    "chief_complaint",
    "known_conditions",
    "current_medications"
]


def predict_patient(patient):
    # Only intake-time fields are passed to the models.
    row = {
        col: patient.get(col)
        for col in NUMERIC + CATEGORICAL + TEXT
    }

    data = pd.DataFrame([row])

    for col in NUMERIC:
        data[col] = pd.to_numeric(
            data[col], errors="coerce"
        )

    data[CATEGORICAL] = (
        data[CATEGORICAL].fillna("unknown")
    )

    data["combined_text"] = (
        data[TEXT]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
    )

    X = data[NUMERIC + CATEGORICAL + ["combined_text"]]

    triage_probs = triage_model.predict_proba(X)[0]
    triage_classes = (
        triage_model.named_steps["classifier"].classes_
    )

    best_index = int(np.argmax(triage_probs))
    predicted_level = int(triage_classes[best_index])
    confidence = float(triage_probs[best_index])

    emergency_prob = float(
        triage_probs[
            np.isin(triage_classes, [1, 2])
        ].sum()
    )

    department = str(
        department_model.predict(X)[0]
    )

    # No ground-truth red_flags are supplied.
    rules = apply_safety_rules(row)

    # Prototype thresholds, not clinically validated.
    if rules["escalation_required"]:
        decision = "ABSTAIN"
        review = "URGENT_CLINICIAN_REVIEW"
    elif emergency_prob >= 0.10:
        decision = "ABSTAIN"
        review = "URGENT_CLINICIAN_REVIEW"
    elif confidence < 0.65:
        decision = "ABSTAIN"
        review = "CLINICIAN_REVIEW"
    else:
        decision = predicted_level
        review = "STANDARD_CLINICIAN_CONFIRMATION"

    return {
        "triage_level": decision,
        "suggested_triage_level": predicted_level,
        "department": department,
        "confidence": round(confidence, 4),
        "emergency_probability": round(
            emergency_prob, 4
        ),
        "review_status": review,
        "safety_reasons": rules["reasons"]
    }


if __name__ == "__main__":
    example = {
        "age_years": 65,
        "age_months": None,
        "sex": "M",
        "pregnant": None,
        "arrival_mode": "Walk-in",
        "bp_systolic": 120,
        "bp_diastolic": 80,
        "pulse_bpm": 95,
        "temp_c": 38.0,
        "spo2_pct": 88,
        "chief_complaint": "Difficulty breathing",
        "known_conditions": "Asthma",
        "current_medications": ""
    }

    result = predict_patient(example)

    print("\nMEDIQ AI - PATIENT DECISION")
    print("-" * 45)

    for key, value in result.items():
        print(f"{key}: {value}")
