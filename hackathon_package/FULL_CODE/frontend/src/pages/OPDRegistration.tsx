
import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  UserRound,
  HeartPulse,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Activity,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import "../OPDRegistration.css";

/* ==========================================
   TYPES
========================================== */

type PatientForm = {
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  department: string;
  visitReason: string;
  symptoms: string;
  duration: string;
  complaintLanguage: string;
  systolicBP: string;
  diastolicBP: string;
  pulseRate: string;
  temperatureC: string;
  spo2: string;
  existingConditions: string;
  medications: string;
  allergies: string;
  consent: boolean;
};

type SavedRegistration = {
  id: string;
  fullName: string;
  department: string;
  status: string;
  vitalsReviewRequired: boolean;
};

type VitalAssessment = {
  reviewRequired: boolean;
  reasons: string[];
  values: {
    systolic_bp: number | null;
    diastolic_bp: number | null;
    pulse_rate: number | null;
    temperature_c: number | null;
    spo2: number | null;
  };
};

/* ==========================================
   INITIAL DATA
========================================== */

const initialForm: PatientForm = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  department: "",
  visitReason: "",
  symptoms: "",
  duration: "",
  complaintLanguage: "English",
  systolicBP: "",
  diastolicBP: "",
  pulseRate: "",
  temperatureC: "",
  spo2: "",
  existingConditions: "",
  medications: "",
  allergies: "",
  consent: false,
};

const departments = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Pediatrics",
  "ENT",
  "Ophthalmology",
  "Other / Not Sure",
];

const complaintLanguages = [
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Other",
];

/* ==========================================
   RAW VITAL SIGN PRESERVATION

   Keep the exact entered strings.

   Invalid values are preserved here even
   when validated numeric columns are null.
========================================== */

function getRawVitals(form: PatientForm) {
  return {
    systolic_bp: form.systolicBP,
    diastolic_bp: form.diastolicBP,
    pulse_rate: form.pulseRate,
    temperature_c: form.temperatureC,
    spo2: form.spo2,
  };
}

/* ==========================================
   VITAL SIGN VALIDATION

   Broad technical plausibility checks for
   demonstration purposes only.

   These are not clinical safety thresholds.
========================================== */

function assessVitals(
  form: PatientForm
): VitalAssessment {
  const reasons: string[] = [];

  function parseVital(
    raw: string,
    label: string,
    min: number,
    max: number
  ): number | null {
    const value = raw.trim();

    if (!value) {
      reasons.push(`${label} is missing.`);
      return null;
    }

    const parsed = Number(value);

    if (
      !Number.isFinite(parsed) ||
      parsed < min ||
      parsed > max
    ) {
      reasons.push(
        `${label} requires verification.`
      );

      return null;
    }

    return parsed;
  }

  const systolic = parseVital(
    form.systolicBP,
    "Systolic blood pressure",
    30,
    300
  );

  const diastolic = parseVital(
    form.diastolicBP,
    "Diastolic blood pressure",
    10,
    200
  );

  const pulse = parseVital(
    form.pulseRate,
    "Pulse rate",
    20,
    300
  );

  const temperature = parseVital(
    form.temperatureC,
    "Temperature",
    25,
    45
  );

  const oxygen = parseVital(
    form.spo2,
    "Oxygen saturation",
    1,
    100
  );

  if (
    systolic !== null &&
    diastolic !== null &&
    systolic <= diastolic
  ) {
    reasons.push(
      "Blood pressure readings are inconsistent."
    );
  }

  return {
    reviewRequired: reasons.length > 0,
    reasons,
    values: {
      systolic_bp: systolic,
      diastolic_bp: diastolic,
      pulse_rate: pulse,
      temperature_c: temperature,
      spo2: oxygen,
    },
  };
}

/* ==========================================
   OPD REGISTRATION
========================================== */

export default function OPDRegistration() {
  const [form, setForm] =
    useState<PatientForm>(initialForm);

  const [error, setError] = useState("");
  const [submitted, setSubmitted] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    savedRegistration,
    setSavedRegistration,
  ] = useState<SavedRegistration | null>(
    null
  );

  /* ======================================
     INPUT HANDLING
  ====================================== */

  function updateField(
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  /* ======================================
     FORM SUBMISSION
  ====================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (saving) return;

    if (
      !form.fullName.trim() ||
      !form.age ||
      !form.gender ||
      !form.phone.trim() ||
      !form.department ||
      !form.visitReason.trim() ||
      !form.symptoms.trim() ||
      !form.duration ||
      !form.complaintLanguage
    ) {
      setError(
        "Please complete all required fields before submitting."
      );

      return;
    }

    const age = Number(form.age);

    if (
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      setError(
        "Enter a valid age between 0 and 120."
      );

      return;
    }

    if (
      !/^[0-9]{10}$/.test(form.phone.trim())
    ) {
      setError(
        "Enter a valid 10-digit phone number."
      );

      return;
    }

    if (!form.consent) {
      setError(
        "Please confirm the information before submitting."
      );

      return;
    }

    /* ====================================
       VALIDATED + RAW VITAL SIGNS
    ==================================== */

    const vitalAssessment =
      assessVitals(form);

    const rawVitals =
      getRawVitals(form);

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(
          "Your session has expired. Please sign in again."
        );

        return;
      }

      const registrationId =
        `MEDIQ-${crypto.randomUUID()}`;

      /* ==================================
         SUPABASE INSERT
      ================================== */

      const { error: insertError } =
        await supabase
          .from("patient_registrations")
          .insert({
            id: registrationId,

            patient_user_id: user.id,

            full_name:
              form.fullName.trim(),

            age,

            gender: form.gender,

            phone: form.phone.trim(),

            department:
              form.department,

            visit_reason:
              form.visitReason.trim(),

            symptoms:
              form.symptoms.trim(),

            duration:
              form.duration,

            complaint_language:
              form.complaintLanguage,

            /* Validated measurements */

            ...vitalAssessment.values,

            /* Original entered values */

            raw_vitals: rawVitals,

            /* Verification information */

            vitals_review_required:
              vitalAssessment.reviewRequired,

            vitals_review_reason:
              vitalAssessment.reasons.join(
                " "
              ),

            existing_conditions:
              form.existingConditions.trim(),

            medications:
              form.medications.trim(),

            allergies:
              form.allergies.trim(),

            status: "Waiting",

            priority: "Pending Review",
          });

      if (insertError) {
        console.error(
          "Supabase registration error:",
          insertError
        );

        setError(
          "Unable to save registration. Check the database configuration and try again."
        );

        return;
      }

      /* ==================================
         SUCCESS
      ================================== */

      setSavedRegistration({
        id: registrationId,

        fullName:
          form.fullName.trim(),

        department:
          form.department,

        status: "Waiting",

        vitalsReviewRequired:
          vitalAssessment.reviewRequired,
      });

      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "MEDIQ registration error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ======================================
     RESET FORM
  ====================================== */

  function resetForm() {
    if (saving) return;

    setForm({
      ...initialForm,
    });

    setError("");
    setSubmitted(false);
    setSavedRegistration(null);
  }

  /* ==========================================
     CONFIRMATION SCREEN
  ========================================== */

  if (submitted) {
    return (
      <div className="opd-confirmation">
        <div className="opd-confirmation-icon">
          <CheckCircle2 size={43} />
        </div>

        <span className="opd-eyebrow">
          FORM SUBMITTED
        </span>

        <h2>
          Registration Details Received
        </h2>

        <p>
          Your OPD registration has been
          saved successfully in the MEDIQ
          database. Your information is
          awaiting staff review.
        </p>

        <div className="opd-confirmation-details">
          <div>
            <span>Registration ID</span>
            <strong>
              {savedRegistration?.id}
            </strong>
          </div>

          <div>
            <span>Patient Name</span>
            <strong>
              {savedRegistration?.fullName}
            </strong>
          </div>

          <div>
            <span>
              Preferred Department
            </span>
            <strong>
              {savedRegistration?.department}
            </strong>
          </div>

          <div>
            <span>
              Registration Status
            </span>
            <strong>
              {savedRegistration?.status}
            </strong>
          </div>

          <div>
            <span>Queue Status</span>
            <strong>
              Pending Nurse Review
            </strong>
          </div>

          <div>
            <span>
              Vitals Assessment
            </span>

            <strong>
              {savedRegistration
                ?.vitalsReviewRequired
                ? "Measurement Verification Required"
                : "Values Recorded — Not Clinically Assessed"}
            </strong>
          </div>
        </div>

        <div className="opd-alert">
          <AlertCircle size={19} />

          <span>
            This is a demonstration
            registration. No validated AI
            triage or clinical assessment
            has been performed. Do not use
            MEDIQ for real medical decisions.
          </span>
        </div>

        <button
          type="button"
          className="opd-primary-button"
          onClick={resetForm}
        >
          <RotateCcw size={17} />
          Start New Registration
        </button>
      </div>
    );
  }

  /* ==========================================
     REGISTRATION FORM
  ========================================== */

  return (
    <div className="opd-registration">
      {/* INTRODUCTION */}

      <div className="opd-intro">
        <div className="opd-intro-icon">
          <ClipboardList size={27} />
        </div>

        <div>
          <span className="opd-eyebrow">
            AI-ASSISTED PATIENT INTAKE
          </span>

          <h2>
            New OPD Registration
          </h2>

          <p>
            Enter patient information,
            symptoms, and available vital
            signs. Fields marked * are
            required.
          </p>
        </div>
      </div>

      {/* STEPS */}

      <div className="opd-steps">
        <div className="opd-step">
          <span>01</span>
          Personal Details
        </div>

        <div className="opd-step">
          <span>02</span>
          Visit &amp; Symptoms
        </div>

        <div className="opd-step">
          <span>03</span>
          Vital Signs
        </div>

        <div className="opd-step">
          <span>04</span>
          Medical Information
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="opd-form"
      >
        {/* ==================================
            SECTION 1 — PERSONAL INFORMATION
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h3>
                Personal Information
              </h3>

              <p>
                Tell us a little about
                yourself.
              </p>
            </div>
          </div>

          <div className="opd-form-grid">
            <div className="opd-field opd-full">
              <label htmlFor="opd-name">
                Full Name *
              </label>

              <input
                id="opd-name"
                name="fullName"
                type="text"
                placeholder="Enter patient full name"
                value={form.fullName}
                onChange={updateField}
                required
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-age">
                Age *
              </label>

              <input
                id="opd-age"
                name="age"
                type="number"
                min="0"
                max="120"
                placeholder="Enter age"
                value={form.age}
                onChange={updateField}
                required
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-gender">
                Gender *
              </label>

              <select
                id="opd-gender"
                name="gender"
                value={form.gender}
                onChange={updateField}
                required
                disabled={saving}
              >
                <option value="">
                  Select gender
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Other">
                  Other
                </option>

                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>
            </div>

            <div className="opd-field opd-full">
              <label htmlFor="opd-phone">
                Phone Number *
              </label>

              <input
                id="opd-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit mobile number"
                value={form.phone}
                onChange={updateField}
                required
                disabled={saving}
              />
            </div>
          </div>
        </section>

        {/* ==================================
            SECTION 2 — VISIT & SYMPTOMS
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <HeartPulse size={20} />
            </div>

            <div>
              <h3>
                Visit &amp; Symptoms
              </h3>

              <p>
                Describe the reason for
                the hospital visit.
              </p>
            </div>
          </div>

          <div className="opd-form-grid">
            <div className="opd-field">
              <label htmlFor="opd-department">
                Preferred Department *
              </label>

              <select
                id="opd-department"
                name="department"
                value={form.department}
                onChange={updateField}
                required
                disabled={saving}
              >
                <option value="">
                  Select department
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}
              </select>

              <small>
                This is your preference,
                not an AI department
                recommendation.
              </small>
            </div>

            <div className="opd-field">
              <label htmlFor="opd-duration">
                Symptom Duration *
              </label>

              <select
                id="opd-duration"
                name="duration"
                value={form.duration}
                onChange={updateField}
                required
                disabled={saving}
              >
                <option value="">
                  Select duration
                </option>

                <option value="Less than 1 day">
                  Less than 1 day
                </option>

                <option value="1-3 days">
                  1–3 days
                </option>

                <option value="4-7 days">
                  4–7 days
                </option>

                <option value="1-4 weeks">
                  1–4 weeks
                </option>

                <option value="More than 1 month">
                  More than 1 month
                </option>
              </select>
            </div>

            <div className="opd-field opd-full">
              <label htmlFor="opd-reason">
                Reason for Visit *
              </label>

              <input
                id="opd-reason"
                name="visitReason"
                type="text"
                placeholder="Example: Fever and headache"
                value={form.visitReason}
                onChange={updateField}
                required
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-language">
                Complaint Language *
              </label>

              <select
                id="opd-language"
                name="complaintLanguage"
                value={form.complaintLanguage}
                onChange={updateField}
                required
                disabled={saving}
              >
                {complaintLanguages.map(
                  (language) => (
                    <option
                      key={language}
                      value={language}
                    >
                      {language}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="opd-field opd-full">
              <label htmlFor="opd-symptoms">
                Chief Complaint /
                Symptoms *
              </label>

              <textarea
                id="opd-symptoms"
                name="symptoms"
                rows={5}
                placeholder="Describe symptoms in your own words. Telugu, Hindi, or transliterated text may be entered."
                value={form.symptoms}
                onChange={updateField}
                required
                disabled={saving}
              />

              <small>
                This text is available
                for the H1 demonstration
                safety rules. Multilingual
                interpretation is limited
                and not clinically validated.
              </small>
            </div>
          </div>
        </section>

        {/* ==================================
            SECTION 3 — VITAL SIGNS
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <Activity size={20} />
            </div>

            <div>
              <h3>
                Vital Signs
              </h3>

              <p>
                Enter available
                measurements. Missing or
                inconsistent readings will
                be flagged for verification.
              </p>
            </div>
          </div>

          <div className="opd-form-grid">
            <div className="opd-field">
              <label htmlFor="opd-systolic">
                Systolic BP (mmHg)
              </label>

              <input
                id="opd-systolic"
                name="systolicBP"
                type="number"
                step="any"
                placeholder="Example: 120"
                value={form.systolicBP}
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-diastolic">
                Diastolic BP (mmHg)
              </label>

              <input
                id="opd-diastolic"
                name="diastolicBP"
                type="number"
                step="any"
                placeholder="Example: 80"
                value={form.diastolicBP}
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-pulse">
                Pulse Rate (bpm)
              </label>

              <input
                id="opd-pulse"
                name="pulseRate"
                type="number"
                step="any"
                placeholder="Example: 75"
                value={form.pulseRate}
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-temperature">
                Temperature (°C)
              </label>

              <input
                id="opd-temperature"
                name="temperatureC"
                type="number"
                step="any"
                placeholder="Example: 37"
                value={form.temperatureC}
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-spo2">
                Oxygen Saturation —
                SpO₂ (%)
              </label>

              <input
                id="opd-spo2"
                name="spo2"
                type="number"
                step="any"
                placeholder="Example: 98"
                value={form.spo2}
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field opd-full">
              <small>
                Original measurements
                are preserved for nurse
                verification. Technical
                input checks do not
                determine whether vital
                signs are medically safe.
                All measurements require
                appropriate clinical
                interpretation.
              </small>
            </div>
          </div>
        </section>

        {/* ==================================
            SECTION 4 — MEDICAL INFORMATION
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3>
                Medical Information
              </h3>

              <p>
                Share relevant medical
                history, if applicable.
              </p>
            </div>
          </div>

          <div className="opd-form-grid">
            <div className="opd-field opd-full">
              <label htmlFor="opd-conditions">
                Existing Medical
                Conditions
              </label>

              <textarea
                id="opd-conditions"
                name="existingConditions"
                rows={3}
                placeholder="Example: Diabetes, asthma, hypertension (or None)"
                value={
                  form.existingConditions
                }
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-medications">
                Current Medications
              </label>

              <textarea
                id="opd-medications"
                name="medications"
                rows={3}
                placeholder="List current medications, if any"
                value={form.medications}
                onChange={updateField}
                disabled={saving}
              />
            </div>

            <div className="opd-field">
              <label htmlFor="opd-allergies">
                Known Allergies
              </label>

              <textarea
                id="opd-allergies"
                name="allergies"
                rows={3}
                placeholder="List known allergies, if any"
                value={form.allergies}
                onChange={updateField}
                disabled={saving}
              />
            </div>
          </div>
        </section>

        {/* ==================================
            DEMONSTRATION NOTICE
        ================================== */}

        <div className="opd-alert">
          <AlertCircle size={19} />

          <span>
            MEDIQ is a demonstration
            platform. It does not provide
            a diagnosis, emergency
            assistance, or validated
            clinical triage. Use fictional
            patient information only.
            For a real emergency, seek
            immediate professional
            medical care.
          </span>
        </div>

        {/* ==================================
            CONSENT
        ================================== */}

        <label className="opd-consent">
          <input
            type="checkbox"
            checked={form.consent}
            disabled={saving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                consent:
                  event.target.checked,
              }))
            }
          />

          <span>
            I confirm that the
            information provided is
            accurate to the best of my
            knowledge. *
          </span>
        </label>

        {/* ==================================
            ERROR MESSAGE
        ================================== */}

        {error && (
          <div
            className="opd-error"
            role="alert"
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* ==================================
            ACTION BUTTONS
        ================================== */}

        <div className="opd-form-actions">
          <button
            type="button"
            className="opd-secondary-button"
            onClick={resetForm}
            disabled={saving}
          >
            <ArrowLeft size={17} />
            Clear Form
          </button>

          <button
            type="submit"
            className="opd-primary-button"
            disabled={saving}
          >
            {saving
              ? "Submitting..."
              : "Submit Registration"}

            {!saving && (
              <ArrowRight size={18} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
