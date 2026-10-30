
import argparse
from pathlib import Path

import pandas as pd

from decision_engine import predict_patient

BASE = Path(__file__).resolve().parent

# Use only intake-time features.
INPUT_FIELDS = [
    "age_years", "age_months", "sex", "pregnant",
    "arrival_mode", "bp_systolic", "bp_diastolic",
    "pulse_bpm", "temp_c", "spo2_pct",
    "chief_complaint", "known_conditions",
    "current_medications"
]

# Initial independent red-flag detector.
# These are prediction rules, not ground-truth labels.
RED_FLAG_KEYWORDS = {
    "RF_CHEST_PAIN_CARDIAC": [
        "chest pain", "chest heaviness",
        "seene mein dard", "chaati noppi"
    ],
    "RF_STROKE_SIGNS": [
        "slurred", "paralysis", "face deviated",
        "one side"
    ],
    "RF_RESP_DISTRESS": [
        "cannot breathe", "gasping",
        "difficulty breathing", "shwasa aadatledu"
    ],
    "RF_ALTERED_SENSORIUM": [
        "unconscious", "not responding", "behosh"
    ],
    "RF_SEIZURE": [
        "seizure", "convuls", "fits", "mirgi"
    ],
    "RF_SEVERE_BLEEDING": [
        "severe bleeding", "vomiting blood",
        "blood in vomit"
    ],
    "RF_SUICIDAL": [
        "suicide", "ending life"
    ],
    "RF_ANAPHYLAXIS": [
        "throat closing", "lips and face swollen"
    ],
    "RF_TRAUMA_MAJOR": [
        "major accident", "fell from roof"
    ],
    "RF_BURNS_MAJOR": [
        "severe burns", "major burns"
    ]
}


def detect_red_flags(patient):
    complaint = str(
        patient.get("chief_complaint") or ""
    ).lower()

    flags = {
        code
        for code, keywords in RED_FLAG_KEYWORDS.items()
        if any(word in complaint for word in keywords)
    }

    age_months = pd.to_numeric(
        patient.get("age_months"), errors="coerce"
    )
    age_years = pd.to_numeric(
        patient.get("age_years"), errors="coerce"
    )
    temperature = pd.to_numeric(
        patient.get("temp_c"), errors="coerce"
    )

    infant = (
        pd.notna(age_months) and age_months < 3
    ) or (
        pd.isna(age_months)
        and pd.notna(age_years)
        and age_years < 0.25
    )

    if infant and pd.notna(temperature) and temperature >= 38:
        flags.add("RF_HIGH_FEVER_INFANT")

    return ";".join(sorted(flags))


def generate_predictions(input_path, output_path):
    intake = pd.read_csv(input_path)

    if "visit_id" not in intake.columns:
        raise ValueError("Input CSV is missing visit_id")

    if intake["visit_id"].isna().any():
        raise ValueError("Input contains missing visit_id")

    if intake["visit_id"].duplicated().any():
        raise ValueError("Input contains duplicate visit_id")

    rows = []

    for _, record in intake.iterrows():
        patient = {
            field: record.get(field)
            for field in INPUT_FIELDS
        }

        # Ground-truth triage, department, emergency
        # status and red_flags are never passed in.
        result = predict_patient(patient)

        rows.append({
            "visit_id": record["visit_id"],
            "triage_level": result["triage_level"],
            "department": (
                ""
                if result["triage_level"] == "ABSTAIN"
                else result["department"]
            ),
            "red_flags": detect_red_flags(patient),
            "confidence": result["confidence"]
        })

    predictions = pd.DataFrame(rows, columns=[
        "visit_id", "triage_level", "department",
        "red_flags", "confidence"
    ])

    output_path = Path(output_path)
    output_path.parent.mkdir(
        parents=True, exist_ok=True
    )

    predictions.to_csv(output_path, index=False)

    print(f"Generated {len(predictions)} predictions")
    print(f"Saved to: {output_path}")
    print("\nTriage distribution:")
    print(
        predictions["triage_level"]
        .astype(str)
        .value_counts()
        .sort_index()
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    generate_predictions(args.input, args.out)
