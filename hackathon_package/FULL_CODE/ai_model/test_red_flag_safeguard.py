
from pathlib import Path

import pandas as pd
from red_flag_detector import detect_red_flags

DATA_DIR = Path("data")
SUBMISSION_DIR = Path("submission")

intake = pd.read_csv(DATA_DIR / "time_val_intake.csv")

predictions = pd.read_csv(
    SUBMISSION_DIR / "MEDIQ_redflag_experiment.csv",
    keep_default_na=False,
)

results = [
    detect_red_flags(complaint)
    for complaint in intake["chief_complaint"]
]

flag_data = pd.DataFrame({
    "visit_id": intake["visit_id"],
    "safe_red_flags": [
        ";".join(result["red_flags"])
        for result in results
    ],
})

predictions = predictions.merge(
    flag_data,
    on="visit_id",
    validate="one_to_one",
)

previous_flags = predictions["red_flags"].fillna("").astype(str)

predictions["red_flags"] = predictions["safe_red_flags"]
predictions = predictions.drop(columns=["safe_red_flags"])

changed = previous_flags.ne(predictions["red_flags"])

output = (
    SUBMISSION_DIR / "MEDIQ_redflag_safeguard_experiment.csv"
)

predictions.to_csv(output, index=False)

print("Safeguard experiment completed!")
print("Total patients:", len(predictions))
print(
    "Missing or placeholder complaints:",
    sum(not result["complaint_available"] for result in results),
)
print("Changed red-flag predictions:", int(changed.sum()))
print(
    "Patients with predicted red flags:",
    int(predictions["red_flags"].ne("").sum()),
)
print("Saved to:", output.resolve())
