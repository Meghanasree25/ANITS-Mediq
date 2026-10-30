
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from decision_engine import predict_patient

app = FastAPI(
    title="MEDIQ AI API",
    description="Synthetic OPD triage decision-support prototype",
    version="1.0.0"
)

# Allow the local MEDIQ React development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"]
)


class PatientIntake(BaseModel):
    age_years: int = Field(ge=0, le=120)
    age_months: Optional[int] = Field(
        default=None, ge=0, le=11
    )
    sex: str
    pregnant: Optional[str] = None
    arrival_mode: str

    bp_systolic: Optional[float] = None
    bp_diastolic: Optional[float] = None
    pulse_bpm: Optional[float] = None
    temp_c: Optional[float] = None
    spo2_pct: Optional[float] = None

    chief_complaint: str
    known_conditions: Optional[str] = ""
    current_medications: Optional[str] = ""


@app.get("/")
def home():
    return {
        "application": "MEDIQ AI",
        "status": "running",
        "message": "AI prediction API is active",
        "clinical_use": False
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": True
    }


@app.post("/predict")
def predict(patient: PatientIntake):
    result = predict_patient(
        patient.model_dump()
    )

    return {
        "status": "success",
        "prediction": result,
        "disclaimer": (
            "Synthetic demonstration only. "
            "All recommendations require clinician review."
        )
    }
