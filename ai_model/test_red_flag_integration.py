
from pathlib import Path

import joblib
import pandas as pd

DATA_DIR = Path("data")
MODEL_DIR = Path("models/red_flags")
SUBMISSION_DIR = Path("submission")

intake = pd.read_csv(DATA_DIR / "time_val_intake.csv")

predictions = pd.read_csv(
    SUBMISSION_DIR / "MEDIQ_time_val_predictions.csv"
)

model = joblib.load(MODEL_DIR / "red_flag_model.pkl")
mlb = joblib.load(MODEL_DIR / "red_flag_labels.pkl")

complaints = intake["chief_complaint"].fillna("").astype(str)

probabilities = model.predict_proba(complaints)

threshold = 0.50

flag_predictions = (probabilities >= threshold).astype(int)

detected_flags = [
    ";".join(mlb.inverse_transform(flag_predictions)[i])
    for i in range(len(intake))
]

flag_data = pd.DataFrame({
    "visit_id": intake["visit_id"],
    "new_red_flags": detected_flags,
})

predictions = predictions.merge(
    flag_data,
    on="visit_id",
    validate="one_to_one",
)

predictions["red_flags"] = predictions["new_red_flags"]
predictions = predictions.drop(columns=["new_red_flags"])

output = SUBMISSION_DIR / "MEDIQ_redflag_experiment.csv"

predictions.to_csv(output, index=False)

print("Experimental submission created!")
print("Total predictions:", len(predictions))
print("Patients with predicted red flags:",
      int(predictions["red_flags"].fillna("").ne("").sum()))
print("Saved to:", output.resolve())
