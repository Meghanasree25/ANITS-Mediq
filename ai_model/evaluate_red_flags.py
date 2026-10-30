
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    precision_recall_fscore_support,
)

DATA_DIR = Path("data")
MODEL_DIR = Path("models/red_flags")

intake = pd.read_csv(DATA_DIR / "time_val_intake.csv")
labels = pd.read_csv(DATA_DIR / "time_val_labels.csv")

data = intake.merge(
    labels[["visit_id", "red_flags"]],
    on="visit_id",
    validate="one_to_one",
)

model = joblib.load(MODEL_DIR / "red_flag_model.pkl")
mlb = joblib.load(MODEL_DIR / "red_flag_labels.pkl")

def parse_flags(value):
    if pd.isna(value) or not str(value).strip():
        return []
    return [
        code.strip()
        for code in str(value).replace(",", ";").split(";")
        if code.strip()
    ]

X = data["chief_complaint"].fillna("").astype(str)
Y_true = mlb.transform(data["red_flags"].apply(parse_flags))

print("Generating red-flag probabilities...")

probabilities = model.predict_proba(X)

# Initial threshold for comparison, not yet optimized.
threshold = 0.50
Y_pred = (probabilities >= threshold).astype(int)

precision, recall, f1, _ = precision_recall_fscore_support(
    Y_true,
    Y_pred,
    average="micro",
    zero_division=0,
)

print()
print("MEDIQ RED-FLAG VALIDATION RESULTS")
print("--------------------------------")
print("Validation patients:", len(data))
print("Threshold:", threshold)
print("Precision:", round(precision, 4))
print("Recall:", round(recall, 4))
print("Micro F1:", round(f1, 4))
print("Patients with predicted flags:", int(Y_pred.any(axis=1).sum()))
print("Actual patients with flags:", int(Y_true.any(axis=1).sum()))
print()
print("Existing MEDIQ red-flag F1 benchmark: 0.1505")
print("Official baseline red-flag F1 benchmark: 0.3507")

# Per-category red-flag performance
p, r, f, support = precision_recall_fscore_support(
    Y_true,
    Y_pred,
    average=None,
    zero_division=0,
)

report = pd.DataFrame({
    "Red Flag": mlb.classes_,
    "Support": support,
    "Precision": p.round(3),
    "Recall": r.round(3),
    "F1": f.round(3),
})

print("\nPER-CATEGORY RED-FLAG PERFORMANCE")
print("--------------------------------")
print(report.sort_values("Support", ascending=False).to_string(index=False))

print("\nCategories with zero recall:")
print(
    report[
        (report["Support"] > 0) &
        (report["Recall"] == 0)
    ][["Red Flag", "Support"]].to_string(index=False)
)
