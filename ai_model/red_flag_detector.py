
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "models" / "red_flags"

model = joblib.load(MODEL_DIR / "red_flag_model.pkl")
mlb = joblib.load(MODEL_DIR / "red_flag_labels.pkl")

MISSING_COMPLAINTS = {
    "",
    "na",
    "n/a",
    "nan",
    "none",
    "null",
    "unknown",
    "not available",
    "not provided",
    "-",
    "--",
    ".",
    "?",
}

def normalize_complaint(value):
    if value is None or pd.isna(value):
        return ""

    return " ".join(str(value).strip().lower().split())


def detect_red_flags(complaint, threshold=0.50):
    text = normalize_complaint(complaint)

    if text in MISSING_COMPLAINTS:
        return {
            "red_flags": [],
            "complaint_available": False,
            "requires_data_review": True,
        }

    probabilities = model.predict_proba([text])[0]

    indices = np.where(probabilities >= threshold)[0]

    flags = [
        str(mlb.classes_[i])
        for i in indices
    ]

    return {
        "red_flags": flags,
        "complaint_available": True,
        "requires_data_review": False,
    }


if __name__ == "__main__":
    test_cases = [
        "na",
        "-",
        None,
        "having pressure in chest and sweating",
    ]

    for complaint in test_cases:
        print(
            repr(complaint),
            "=>",
            detect_red_flags(complaint),
        )
