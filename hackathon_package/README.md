# MEDIQ — AI-Assisted OPD Triage and Queue Management

## Hackathon
TalentAP Mega Hackathon 2026
Problem Statement: H1 — OPD Triage Assistant for an Overloaded Government Hospital

## Project Overview
MEDIQ is a prototype hospital outpatient management system that combines AI-assisted triage, department recommendations, red-flag detection, and queue management.

It is designed to support clinical staff in reviewing patient intake information and prioritizing patients requiring attention.

## Key Features
- Patient registration and intake
- AI-assisted five-level triage recommendations
- Department recommendations
- Red-flag detection and safety escalation
- Confidence scores and abstention for uncertain predictions
- Patient, nurse, doctor, and administrator dashboards
- Queue management and public display

## Technology Stack
Frontend: React, TypeScript, Vite
AI Backend: Python, scikit-learn, joblib
Mobile Project: Capacitor / Android

## AI Methodology
The prediction pipeline processes structured patient intake data, including demographics, vital signs, and chief complaints.

Trained machine-learning models produce triage and department recommendations. Additional safety rules and a red-flag classifier identify cases that require careful review.

The system can return ABSTAIN when a prediction should not be made automatically.

## Submission Contents
- submission/H1_predictions.csv — Predictions for 8,872 official test records
- FULL_CODE/ai_model — Python source code and trained model artifacts
- FULL_CODE/frontend — React application and Android source project

## Frontend Setup
1. Install Node.js and npm.
2. Open FULL_CODE/frontend in a terminal.
3. Run: npm install
4. Configure the required environment variables locally.
5. Run: npm run dev

## AI Setup
1. Install Python and the required Python dependencies.
2. Open FULL_CODE/ai_model.
3. Keep the provided models directory alongside the Python scripts.
4. Configure the official input dataset paths before running the prediction script.

## Demo
https://mediq-beige-omega.vercel.app

## Repository
https://github.com/Meghanasree25/MEDIQ

## Safety and Limitations
MEDIQ is a hackathon prototype developed using synthetic patient records.

AI recommendations are decision-support outputs, not medical diagnoses. Emergency cases, red flags, low-confidence results, and abstentions require qualified clinical review.

The system has not been clinically validated or approved for real-world medical use.

## Reproducing the Submitted Predictions

The submitted H1_predictions.csv was generated using
FULL_CODE/ai_model/hackathon_predict.py.

This script uses the original decision engine and its trained models.

From FULL_CODE/ai_model, run:

python hackathon_predict.py --input "PATH_TO_OFFICIAL_DATA/intake_test.csv" --out "H1_predictions_reproduced.csv"

The reproduced output was verified against the submitted CSV:
- 8,872 matching patient IDs
- 0 triage differences
- 0 department differences
- 0 red-flag differences
- 0 confidence differences

The repository also includes hackathon_predict_final.py,
which uses separately trained final model artifacts.
Its predictions are not identical to the submitted CSV.

All predictions are prototype decision-support outputs and
must not be used for clinical decision-making.
