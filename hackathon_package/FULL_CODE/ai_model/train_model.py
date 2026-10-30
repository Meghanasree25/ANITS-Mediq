
import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    recall_score,
    confusion_matrix
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

print("=" * 55)
print("MEDIQ AI - MODEL TRAINING")
print("=" * 55)

df = pd.read_csv(DATA_DIR / "prepared_train.csv")

# Use patient information available at registration.
# Never include the target labels as input features.
numeric_cols = [
    "age_years",
    "age_months",
    "bp_systolic",
    "bp_diastolic",
    "pulse_bpm",
    "temp_c",
    "spo2_pct"
]

categorical_cols = [
    "sex",
    "pregnant",
    "arrival_mode"
]

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

features = numeric_cols + categorical_cols + ["combined_text"]
X = df[features].copy()

for col in numeric_cols:
    X[col] = pd.to_numeric(X[col], errors="coerce")

X[categorical_cols] = X[categorical_cols].fillna("unknown")
X["combined_text"] = X["combined_text"].fillna("")

y_triage = df["triage_level"].astype(int)
y_department = df["department"]

# Same split for both prediction tasks.
train_idx, val_idx = train_test_split(
    np.arange(len(df)),
    test_size=0.20,
    random_state=42,
    stratify=y_triage
)

def make_preprocessor():
    return ColumnTransformer([
        (
            "numeric",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]),
            numeric_cols
        ),
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_cols
        ),
        (
            "text",
            TfidfVectorizer(
                max_features=12000,
                ngram_range=(1, 2),
                min_df=2,
                sublinear_tf=True
            ),
            "combined_text"
        )
    ])

def train_and_evaluate(name, y, filename, balanced=False):
    print(f"\nTraining {name}...")

    model = Pipeline([
        ("preprocessor", make_preprocessor()),
        ("classifier", LogisticRegression(
            max_iter=1500,
            class_weight="balanced" if balanced else None,
            solver="lbfgs"
        ))
    ])

    model.fit(X.iloc[train_idx], y.iloc[train_idx])

    predictions = model.predict(X.iloc[val_idx])
    actual = y.iloc[val_idx]

    print(f"\n{name} Accuracy:",
          round(accuracy_score(actual, predictions) * 100, 2), "%")

    print("\nClassification Report:")
    print(classification_report(
        actual, predictions, zero_division=0
    ))

    joblib.dump(model, MODEL_DIR / filename)
    print("Saved:", MODEL_DIR / filename)

    return model, predictions

triage_model, triage_predictions = train_and_evaluate(
    "Triage Level",
    y_triage,
    "triage_model.pkl",
    balanced=True
)

department_model, department_predictions = train_and_evaluate(
    "Department Recommendation",
    y_department,
    "department_model.pkl"
)

# Emergency recall: how many true level 1/2 cases
# were identified as level 1/2?
actual_emergency = (
    y_triage.iloc[val_idx].to_numpy() <= 2
)

predicted_emergency = (
    np.asarray(triage_predictions) <= 2
)

emergency_recall = recall_score(
    actual_emergency,
    predicted_emergency,
    zero_division=0
)

missed = int(
    (actual_emergency & ~predicted_emergency).sum()
)

print("\n" + "=" * 55)
print("MEDIQ VALIDATION SUMMARY")
print("=" * 55)
print("Validation records:", len(val_idx))
print("Emergency recall:", round(emergency_recall * 100, 2), "%")
print("Missed emergencies:", missed)
print("Emergency confusion matrix:")
print(confusion_matrix(
    actual_emergency,
    predicted_emergency
))

print("\nBoth models trained and saved successfully!")
print("NOTE: Not approved for clinical use.")
