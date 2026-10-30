
from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.pipeline import Pipeline

# Training data only: do not use validation labels for fitting.
DATA_DIR = Path("data")
MODEL_DIR = Path("models/red_flags")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

intake = pd.read_csv(DATA_DIR / "time_train_intake.csv")
labels = pd.read_csv(DATA_DIR / "time_train_labels.csv")

data = intake.merge(
    labels[["visit_id", "red_flags"]],
    on="visit_id",
    validate="one_to_one",
)

def parse_flags(value):
    if pd.isna(value) or not str(value).strip():
        return []
    return [
        flag.strip()
        for flag in str(value).replace(",", ";").split(";")
        if flag.strip()
    ]

X = data["chief_complaint"].fillna("").astype(str)
flag_lists = data["red_flags"].apply(parse_flags)

mlb = MultiLabelBinarizer()
Y = mlb.fit_transform(flag_lists)

print("Training patients:", len(data))
print("Red-flag categories:", len(mlb.classes_))
print("Patients with red flags:", int(Y.any(axis=1).sum()))

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            analyzer="char",
            ngram_range=(2, 5),
            min_df=2,
            max_features=100000,
            sublinear_tf=True,
        ),
    ),
    (
        "classifier",
        OneVsRestClassifier(
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                solver="liblinear",
            ),
            n_jobs=1,
        ),
    ),
])

print("Training red-flag classifier...")
model.fit(X, Y)

joblib.dump(model, MODEL_DIR / "red_flag_model.pkl")
joblib.dump(mlb, MODEL_DIR / "red_flag_labels.pkl")

print("Training completed!")
print("Model saved to:", MODEL_DIR.resolve())
