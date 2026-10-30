
from pathlib import Path
import pandas as pd

DATA_DIR = Path("data")
SUBMISSION_DIR = Path("submission")

intake = pd.read_csv(DATA_DIR / "time_val_intake.csv")

predictions = pd.read_csv(
    SUBMISSION_DIR / "MEDIQ_redflag_safeguard_experiment.csv",
    keep_default_na=False,
)

merged = predictions.merge(
    intake[["visit_id", "age_years", "age_months"]],
    on="visit_id",
    validate="one_to_one",
)

FLAG = "RF_HIGH_FEVER_INFANT"

removed = 0

def filter_infant_flag(row):
    global removed

    flags = [
        f.strip()
        for f in str(row["red_flags"]).split(";")
        if f.strip()
    ]

    if FLAG not in flags:
        return ";".join(flags)

    years = pd.to_numeric(row["age_years"], errors="coerce")
    months = pd.to_numeric(row["age_months"], errors="coerce")

    # age_months represents the total age in months
    # when available in this dataset.
    if pd.notna(months):
        age_at_least_three_months = months >= 3
    elif pd.notna(years):
        age_at_least_three_months = years >= 1
    else:
        age_at_least_three_months = False

    if age_at_least_three_months:
        flags.remove(FLAG)
        removed += 1

    return ";".join(flags)


merged["red_flags"] = merged.apply(
    filter_infant_flag,
    axis=1,
)

merged = merged.drop(
    columns=["age_years", "age_months"]
)

output = (
    SUBMISSION_DIR /
    "MEDIQ_infant_age_experiment.csv"
)

merged.to_csv(output, index=False)

print("Infant-age safeguard completed!")
print("Total patients:", len(merged))
print("Infant-fever flags removed:", removed)
print(
    "Remaining infant-fever predictions:",
    int(
        merged["red_flags"]
        .str.contains(FLAG, regex=False)
        .sum()
    ),
)
print("Saved to:", output.resolve())
