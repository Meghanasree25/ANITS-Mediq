
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Load training data
intake = pd.read_csv(DATA_DIR / "intake_train.csv")
labels = pd.read_csv(DATA_DIR / "train_labels.csv")

print("MEDIQ AI - Dataset Preparation")
print("-" * 45)

print("Patient records:", len(intake))
print("Training labels:", len(labels))

# Validate identifiers
assert intake["visit_id"].is_unique, "Duplicate intake IDs found"
assert labels["visit_id"].is_unique, "Duplicate label IDs found"

# Combine using patient visit ID
dataset = intake.merge(
    labels,
    on="visit_id",
    how="inner",
    validate="one_to_one"
)

assert len(dataset) == len(intake) == len(labels), (
    "Some training records have missing labels"
)

print("Combined records:", len(dataset))

print("\nTriage Level Distribution:")
print(dataset["triage_level"].value_counts().sort_index())

print("\nEmergency Distribution:")
print(dataset["true_emergency"].value_counts().sort_index())

print("\nMissing Values:")
print(dataset.isnull().sum())

# Save prepared training dataset
output_path = DATA_DIR / "prepared_train.csv"
dataset.to_csv(output_path, index=False)

print("\nDataset preparation successful!")
print("Saved:", output_path)
