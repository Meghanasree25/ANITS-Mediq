
from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
OUTPUT = BASE / "models" / "time_split"
OUTPUT.mkdir(parents=True, exist_ok=True)

NUMERIC = [
    "age_years", "age_months", "bp_systolic",
    "bp_diastolic", "pulse_bpm", "temp_c", "spo2_pct"
]

CATEGORICAL = [
    "sex", "pregnant", "arrival_mode"
]

TEXT = [
    "chief_complaint",
    "known_conditions",
    "current_medications"
]


def prepare_features(df):
    df = df.copy()

    for col in NUMERIC:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df[CATEGORICAL] = df[CATEGORICAL].fillna("unknown")

    df["combined_text"] = (
        df[TEXT]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
    )

    return df[NUMERIC + CATEGORICAL + ["combined_text"]]


def make_model(balanced=False):
    preprocessor = ColumnTransformer([
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

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(
            max_iter=1500,
            class_weight="balanced" if balanced else None,
            solver="lbfgs"
        ))
    ])


train = pd.read_csv(DATA / "time_train_intake.csv")
train_labels = pd.read_csv(DATA / "time_train_labels.csv")

val = pd.read_csv(DATA / "time_val_intake.csv")
val_labels = pd.read_csv(DATA / "time_val_labels.csv")

train = train.merge(
    train_labels[["visit_id", "triage_level", "department"]],
    on="visit_id",
    validate="one_to_one"
)

val = val.merge(
    val_labels[["visit_id", "triage_level", "department"]],
    on="visit_id",
    validate="one_to_one"
)

X_train = prepare_features(train)
X_val = prepare_features(val)

print("Training records:", len(X_train))
print("Validation records:", len(X_val))

triage_model = make_model(balanced=True)
print("\nTraining triage model...", flush=True)
triage_model.fit(X_train, train["triage_level"].astype(int))
joblib.dump(triage_model, OUTPUT / "triage_model.pkl")

triage_pred = triage_model.predict(X_val)
print(
    "Validation triage accuracy:",
    round(accuracy_score(val["triage_level"], triage_pred) * 100, 2),
    "%",
    flush=True
)

department_model = make_model()
print("\nTraining department model...", flush=True)
department_model.fit(X_train, train["department"])
joblib.dump(department_model, OUTPUT / "department_model.pkl")

department_pred = department_model.predict(X_val)
print(
    "Validation department accuracy:",
    round(
        accuracy_score(val["department"], department_pred) * 100,
        2
    ),
    "%",
    flush=True
)

print("\nModels saved to:", OUTPUT)
print("Existing MEDIQ models were not modified.")
