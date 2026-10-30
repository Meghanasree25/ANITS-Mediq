
from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

BASE = Path(__file__).resolve().parent
DATA_PATH = BASE / "data" / "prepared_train.csv"
MODEL_DIR = BASE / "models" / "final"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

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


def make_preprocessor():
    return ColumnTransformer([
        (
            "numeric",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]),
            NUMERIC
        ),
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            CATEGORICAL
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


def train_model(name, X, y, filename, balanced=False):
    print(f"\nTraining {name}...", flush=True)

    model = Pipeline([
        ("preprocessor", make_preprocessor()),
        (
            "classifier",
            LogisticRegression(
                max_iter=1500,
                class_weight="balanced" if balanced else None,
                solver="lbfgs"
            )
        )
    ])

    model.fit(X, y)

    path = MODEL_DIR / filename
    joblib.dump(model, path)

    print(f"Saved: {path}", flush=True)
    print(f"Training records: {len(X)}", flush=True)

    return model


def main():
    print("=" * 55)
    print("MEDIQ - FINAL MODEL TRAINING")
    print("=" * 55)

    df = pd.read_csv(DATA_PATH)

    if len(df) != 21455:
        raise ValueError(
            f"Unexpected training record count: {len(df)}"
        )

    if df["visit_id"].isna().any():
        raise ValueError("Missing visit IDs")

    if df["visit_id"].duplicated().any():
        raise ValueError("Duplicate visit IDs")

    X = df[NUMERIC + CATEGORICAL + TEXT].copy()

    for col in NUMERIC:
        X[col] = pd.to_numeric(X[col], errors="coerce")

    X[CATEGORICAL] = X[CATEGORICAL].fillna("unknown")

    X["combined_text"] = (
        X[TEXT]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
    )

    X = X[NUMERIC + CATEGORICAL + ["combined_text"]]

    y_triage = df["triage_level"].astype(int)
    y_department = df["department"]

    train_model(
        "Final Triage Model",
        X,
        y_triage,
        "triage_model.pkl",
        balanced=True
    )

    train_model(
        "Final Department Model",
        X,
        y_department,
        "department_model.pkl"
    )

    print("\nFinal models trained successfully!")
    print("Saved in:", MODEL_DIR)
    print("Not approved for clinical use.")


if __name__ == "__main__":
    main()
