
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
  existingConditions: "",
  medications: "",
  allergies: "",
  consent: false,
};

const departments = [
  "Cardiology",
  "Dental",
  "Dermatology",
  "ENT",
  "Emergency/Casualty",
  "General Medicine",
  "General Surgery",
  "Neurology",
  "Obstetrics & Gynaecology",
  "Ophthalmology",
  "Orthopaedics",
  "Paediatrics",
  "Psychiatry",
  "Pulmonology/Chest & TB",
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

         Vital signs are not collected
         from patients.

         Null values mean not yet measured.
         Nurse assessment will be added
         in the next implementation stage.
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

            // Nurse will measure these later.
            systolic_bp: null,
            diastolic_bp: null,
            pulse_rate: null,
            temperature_c: null,
            spo2: null,

            // Preserve compatibility with
            // the existing database fields.
            raw_vitals: {
              systolic_bp: "",
              diastolic_bp: "",
              pulse_rate: "",
              temperature_c: "",
              spo2: "",
            },

            vitals_review_required: true,

            vitals_review_reason:
              "Awaiting nurse vital signs assessment.",

            existing_conditions:
              form.existingConditions.trim(),

            medications:
              form.medications.trim(),

            allergies:
              form.allergies.trim(),

            // Keep the existing database
            // status until the nurse workflow
            // and status constraints are verified.
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
        status: "Pending Nurse Assessment",
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

    setForm({ ...initialForm });
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
          REGISTRATION SUCCESSFUL
        </span>

        <h2>
          OPD Registration Completed
        </h2>

        <p>
          Your OPD registration has been
          saved successfully in the MEDIQ
          database. Please proceed to the
          nursing assessment desk for
          vital signs examination.
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
            <span>Preferred Department</span>
            <strong>
              {savedRegistration?.department}
            </strong>
          </div>

          <div>
            <span>Registration Status</span>
            <strong>
              {savedRegistration?.status}
            </strong>
          </div>

          <div>
            <span>Vital Signs</span>
            <strong>
              To Be Recorded by Nurse
            </strong>
          </div>

          <div>
            <span>Doctor Queue</span>
            <strong>
              Not Yet Assigned
            </strong>
          </div>
        </div>

        <div className="opd-alert">
          <AlertCircle size={19} />

          <span>
            Please proceed to the nurse
            assessment desk. A nurse will
            measure your blood pressure,
            pulse rate, temperature, and
            oxygen saturation before
            reviewing your consultation
            priority. If you have severe
            symptoms, alert hospital staff
            immediately.
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
            Enter your personal information,
            symptoms, and medical history.
            A nurse will measure your vital
            signs after registration.
            Fields marked * are required.
          </p>
        </div>
      </div>

      {/* THREE REGISTRATION SECTIONS */}

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
          Medical Information
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="opd-form"
      >

        {/* ==================================
            SECTION 1 - PERSONAL INFORMATION
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <UserRound size={20} />
            </div>

            <div>
              <h3>Personal Information</h3>
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
            SECTION 2 - VISIT & SYMPTOMS
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <HeartPulse size={20} />
            </div>

            <div>
              <h3>Visit &amp; Symptoms</h3>
              <p>
                Describe the reason for
                your hospital visit.
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

                {departments.map((department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                ))}
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
                Chief Complaint / Symptoms *
              </label>

              <textarea
                id="opd-symptoms"
                name="symptoms"
                rows={5}
                placeholder="Describe your symptoms in your own words."
                value={form.symptoms}
                onChange={updateField}
                required
                disabled={saving}
              />

              <small>
                Multilingual interpretation
                is limited and not clinically
                validated.
              </small>
            </div>

          </div>
        </section>

        {/* ==================================
            SECTION 3 - MEDICAL INFORMATION
        ================================== */}

        <section className="opd-section">
          <div className="opd-section-heading">
            <div className="opd-section-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3>Medical Information</h3>
              <p>
                Share relevant medical
                history, if applicable.
              </p>
            </div>
          </div>

          <div className="opd-form-grid">

            <div className="opd-field opd-full">
              <label htmlFor="opd-conditions">
                Existing Medical Conditions
              </label>

              <textarea
                id="opd-conditions"
                name="existingConditions"
                rows={3}
                placeholder="Example: Diabetes, asthma, hypertension (or None)"
                value={form.existingConditions}
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
            NURSE ASSESSMENT NOTICE
        ================================== */}

        <div className="opd-alert">
          <AlertCircle size={19} />

          <span>
            You do not need to enter your
            blood pressure, temperature,
            pulse rate, or oxygen level.
            These measurements will be
            recorded by nursing staff
            after registration.

            MEDIQ is a demonstration
            platform, not a validated
            clinical triage service.
            Use fictional patient information
            only. For a real emergency,
            seek immediate medical care.
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
                consent: event.target.checked,
              }))
            }
          />

          <span>
            I confirm that the information
            provided is accurate to the best
            of my knowledge. *
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
