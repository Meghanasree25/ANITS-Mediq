import joblib
import decision_engine

from pathlib import Path

BASE = Path(__file__).resolve().parent

decision_engine.triage_model = joblib.load(
    BASE / "models" / "final" / "triage_model.pkl"
)

decision_engine.department_model = joblib.load(
    BASE / "models" / "final" / "department_model.pkl"
)

predict_patient = decision_engine.predict_patient
