
import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import recall_score, precision_score

BASE = Path(__file__).resolve().parent

df = pd.read_csv(BASE / "data" / "prepared_train.csv")
model = joblib.load(BASE / "models" / "triage_model.pkl")

numeric_cols = [
    "age_years", "age_months",
    "bp_systolic", "bp_diastolic",
    "pulse_bpm", "temp_c", "spo2_pct"
]

categorical_cols = ["sex", "pregnant", "arrival_mode"]
text_cols = [
    "chief_complaint",
    "known_conditions",
    "current_medications"
]

df["combined_text"] = (
    df[text_cols].fillna("").astype(str).agg(" ".join, axis=1)
)

X = df[numeric_cols + categorical_cols + ["combined_text"]].copy()

for col in numeric_cols:
    X[col] = pd.to_numeric(X[col], errors="coerce")

X[categorical_cols] = X[categorical_cols].fillna("unknown")
X["combined_text"] = X["combined_text"].fillna("")

y = df["triage_level"].astype(int)

_, val_idx = train_test_split(
    np.arange(len(df)),
    test_size=0.20,
    random_state=42,
    stratify=y
)

X_val = X.iloc[val_idx]
y_val = y.iloc[val_idx]

probabilities = model.predict_proba(X_val)
classes = model.named_steps["classifier"].classes_

emergency_indices = np.isin(classes, [1, 2])
emergency_prob = probabilities[:, emergency_indices].sum(axis=1)

actual_emergency = (y_val.to_numpy() <= 2)

print("\nMEDIQ EMERGENCY THRESHOLD EVALUATION")
print("-" * 60)
print(f"{'Threshold':<12}{'Recall':<12}{'Precision':<12}{'Missed':<10}{'False Alarms'}")

for threshold in [0.50, 0.40, 0.30, 0.20, 0.10]:
    predicted = emergency_prob >= threshold

    recall = recall_score(
        actual_emergency, predicted, zero_division=0
    )
    precision = precision_score(
        actual_emergency, predicted, zero_division=0
    )

    missed = int((actual_emergency & ~predicted).sum())
    false_alarms = int((~actual_emergency & predicted).sum())

    print(
        f"{threshold:<12.2f}"
        f"{recall * 100:<12.2f}"
        f"{precision * 100:<12.2f}"
        f"{missed:<10}"
        f"{false_alarms}"
    )

# Investigate emergency cases missed at threshold 0.10
threshold = 0.10
predicted = emergency_prob >= threshold

missed_mask = actual_emergency & ~predicted

missed_cases = df.iloc[val_idx].loc[
    missed_mask,
    [
        "visit_id",
        "age_years",
        "bp_systolic",
        "pulse_bpm",
        "spo2_pct",
        "chief_complaint",
        "triage_level",
        "true_emergency",
        "red_flags"
    ]
].copy()

missed_cases["emergency_probability"] = (
    emergency_prob[missed_mask]
)

print("\nMISSED LEVEL 1/2 CASES AT THRESHOLD 0.10")
print("-" * 60)
print(missed_cases.to_string(index=False))

output = BASE / "data" / "missed_emergencies.csv"
missed_cases.to_csv(output, index=False)

print("\nSaved:", output)
