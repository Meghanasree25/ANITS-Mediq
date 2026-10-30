
import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import recall_score, precision_score

from safety_rules import apply_safety_rules

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
    df[text_cols]
    .fillna("")
    .astype(str)
    .agg(" ".join, axis=1)
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
val_df = df.iloc[val_idx].copy()

probabilities = model.predict_proba(X_val)
classes = model.named_steps["classifier"].classes_

emergency_probability = probabilities[
    :, np.isin(classes, [1, 2])
].sum(axis=1)

threshold = 0.10
ai_flags = emergency_probability >= threshold

# Only intake-time information is allowed in safety rules.
# Exclude true labels, red_flags and other target fields.
intake_fields = (
    numeric_cols
    + categorical_cols
    + text_cols
)

rule_flags = np.array([
    apply_safety_rules(
        row[intake_fields].to_dict()
    )["escalation_required"]
    for _, row in val_df.iterrows()
])

combined_flags = ai_flags | rule_flags

# First evaluate the same level-1/2 definition as before.
actual = val_df["triage_level"].to_numpy() <= 2

def show_metrics(name, predicted, actual):
    recall = recall_score(
        actual, predicted, zero_division=0
    )
    precision = precision_score(
        actual, predicted, zero_division=0
    )
    missed = int((actual & ~predicted).sum())
    false_alarms = int((~actual & predicted).sum())

    print(
        f"{name:<20}"
        f"{recall * 100:>9.2f}%"
        f"{precision * 100:>12.2f}%"
        f"{missed:>10}"
        f"{false_alarms:>14}"
    )

print("\nMEDIQ COMBINED SAFETY EVALUATION")
print("-" * 70)
print(
    f"{'Method':<20}"
    f"{'Recall':>10}"
    f"{'Precision':>13}"
    f"{'Missed':>10}"
    f"{'False Alarms':>14}"
)

show_metrics("AI only", ai_flags, actual)
show_metrics("Rules only", rule_flags, actual)
show_metrics("AI + Rules", combined_flags, actual)

# Also evaluate the dataset's explicit emergency label.
actual_true_emergency = (
    val_df["true_emergency"].astype(int).to_numpy() == 1
)

print("\nUSING DATASET true_emergency LABEL")
print("-" * 70)
show_metrics("AI only", ai_flags, actual_true_emergency)
show_metrics("Rules only", rule_flags, actual_true_emergency)
show_metrics("AI + Rules", combined_flags, actual_true_emergency)

print("\nNOTE: Validation set reused for exploration.")
print("Results are not independent clinical validation.")
