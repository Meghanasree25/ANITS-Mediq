
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
  BrainCircuit,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { evaluateTriageSafety } from "../lib/triageEngine";
import {
  getMEDIQPrediction,
  type MEDIQPrediction,
} from "../lib/mediqAI";
import { saveMEDIQPrediction } from "../lib/mediqAIStorage";
import "../PatientDashboard.css";
import "../NurseDashboard.css";

type Priority = "Pending Review" | "Routine" | "Urgent";
type Status = "Waiting" | "In Consultation" | "Completed";
type Decision =
  | "ESCALATE_NOW"
  | "CANNOT_ASSESS"
  | "NURSE_REVIEW";

interface Patient {
  id: string;
  queueToken: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  department: string;
  visitReason: string;
  symptoms: string;
  duration: string;
  complaintLanguage: string;
  systolicBP: number | null;
  diastolicBP: number | null;
  pulseRate: number | null;
  temperatureC: number | null;
  spo2: number | null;
  rawVitals: Record<string, unknown> | null;
  vitalsReviewRequired: boolean;
  vitalsReviewReason: string;
  existingConditions: string;
  medications: string;
  allergies: string;
  registeredAt: string;
  priority: Priority;
  status: Status;
}

interface SavedAssessment {
  id: string;
  patient_registration_id: string;
  decision: Decision;
  recommended_department: string | null;
  red_flags: unknown[];
  triggered_rules: unknown[];
  validation_issues: unknown[];
  engine_version: string;
  assessed_at: string;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function text(value: unknown): string {
  return value === null || value === undefined
    ? ""
    : String(value);
}

function dateText(value: string): string {
  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? "Unknown"
    : d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function listText(value: unknown): string {
  if (typeof value === "string") return value;

  if (value === null || value === undefined) {
    return "Not specified";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function mapPatient(row: Record<string, unknown>): Patient {
  const raw = row.raw_vitals;

  return {
    id: text(row.id),
    queueToken: text(row.queue_token) || "Not assigned",
    fullName: text(row.full_name) || "Unnamed Patient",
    age: text(row.age),
    gender: text(row.gender),
    phone: text(row.phone),
    department: text(row.department),
    visitReason: text(row.visit_reason),
    symptoms: text(row.symptoms),
    duration: text(row.duration),
    complaintLanguage:
      text(row.complaint_language) || "Not recorded",
    systolicBP: numberOrNull(row.systolic_bp),
    diastolicBP: numberOrNull(row.diastolic_bp),
    pulseRate: numberOrNull(row.pulse_rate),
    temperatureC: numberOrNull(row.temperature_c),
    spo2: numberOrNull(row.spo2),
    rawVitals:
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null,
    vitalsReviewRequired:
      row.vitals_review_required === true,
    vitalsReviewReason: text(row.vitals_review_reason),
    existingConditions: text(row.existing_conditions),
    medications: text(row.medications),
    allergies: text(row.allergies),
    registeredAt: text(row.registered_at),
    priority:
      row.priority === "Routine" ||
      row.priority === "Urgent"
        ? row.priority
        : "Pending Review",
    status:
      row.status === "Completed" ||
      row.status === "In Consultation"
        ? row.status
        : "Waiting",
  };
}

function assess(patient: Patient) {
  const age = Number(patient.age);

  return evaluateTriageSafety({
    age:
      patient.age.trim() && Number.isInteger(age)
        ? age
        : null,
    complaint: [
      patient.visitReason,
      patient.symptoms,
    ]
      .filter(Boolean)
      .join(". "),
    complaintLanguage: patient.complaintLanguage,
    systolicBP: patient.systolicBP,
    diastolicBP: patient.diastolicBP,
    pulseRate: patient.pulseRate,
    temperatureC: patient.temperatureC,
    spo2: patient.spo2,
    existingConditions: patient.existingConditions,
    medications: patient.medications,
  });
}

function needsVerification(patient: Patient): boolean {
  return (
    patient.vitalsReviewRequired ||
    [
      patient.systolicBP,
      patient.diastolicBP,
      patient.pulseRate,
      patient.temperatureC,
      patient.spo2,
    ].some((value) => value === null)
  );
}

function decisionLabel(decision: Decision): string {
  if (decision === "ESCALATE_NOW") {
    return "ESCALATE NOW";
  }

  if (decision === "CANNOT_ASSESS") {
    return "CANNOT ASSESS";
  }

  return "NURSE REVIEW";
}

function decisionStyle(decision: Decision): CSSProperties {
  if (decision === "ESCALATE_NOW") {
    return {
      color: "#991b1b",
      background: "#fee2e2",
    };
  }

  if (decision === "CANNOT_ASSESS") {
    return {
      color: "#92400e",
      background: "#fef3c7",
    };
  }

  return {
    color: "#115e59",
    background: "#ccfbf1",
  };
}

const cardStyle: CSSProperties = {
  padding: 20,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: 0,
  borderRadius: 8,
  padding: "10px 14px",
  background: "#0d9488",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
};

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          color: "#64748b",
          fontSize: 12,
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <strong style={{ overflowWrap: "anywhere" }}>
        {value || "Not provided"}
      </strong>
    </div>
  );
}

function ItemList({
  title,
  values,
}: {
  title: string;
  values: unknown[];
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <strong>{title}</strong>

      {values.length === 0 ? (
        <p>None recorded.</p>
      ) : (
        <ul style={{ paddingLeft: 22, marginTop: 8 }}>
          {values.map((value, index) => (
            <li key={index}>{listText(value)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NurseDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [priority, setPriority] =
    useState<Priority>("Pending Review");

  const [acknowledged, setAcknowledged] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [nurseName, setNurseName] = useState("Demo Nurse");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [testingId, setTestingId] =
    useState<string | null>(null);

  const [loadError, setLoadError] = useState("");
  const [modalError, setModalError] = useState("");
  const [message, setMessage] = useState("");

  const [savedAssessment, setSavedAssessment] =
    useState<SavedAssessment | null>(null);

  const [assessmentLoading, setAssessmentLoading] =
    useState(false);

  const [assessmentError, setAssessmentError] =
    useState("");

  const [assessmentChecked, setAssessmentChecked] =
    useState(false);

  // MEDIQ AI states
  const [aiPrediction, setAiPrediction] =
    useState<MEDIQPrediction | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [syntheticConfirmed, setSyntheticConfirmed] =
    useState(false);

  // Prevent responses from an earlier patient appearing
  // in another patient's review modal.
  const aiRequestVersion = useRef(0);

  const selectedPatient =
    patients.find((patient) => patient.id === selectedId) ??
    null;

  const preview = selectedPatient
    ? assess(selectedPatient)
    : null;

  const refreshPatients = useCallback(async () => {
    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth.user) {
        setPatients([]);
        setLoadError(
          "Please sign in with a Nurse account."
        );
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("user_profiles")
          .select("full_name, role")
          .eq("id", auth.user.id)
          .single();

      if (
        profileError ||
        !profile ||
        profile.role !== "nurse"
      ) {
        setPatients([]);
        setLoadError(
          "This account does not have Nurse access."
        );
        return;
      }

      setNurseName(profile.full_name || "Demo Nurse");

      const rows: Record<string, unknown>[] = [];
      const pageSize = 500;

      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from("patient_registrations")
          .select("*")
          .order("registered_at", {
            ascending: false,
          })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const page =
          (data ?? []) as Record<string, unknown>[];

        rows.push(...page);

        if (page.length < pageSize) break;
      }

      setPatients(rows.map(mapPatient));
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load patient registrations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPatients();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshPatients();
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [refreshPatients]);

  async function loadAssessment(registrationId: string) {
    setAssessmentLoading(true);
    setAssessmentChecked(false);
    setAssessmentError("");
    setSavedAssessment(null);

    try {
      const { data, error } = await supabase
        .from("triage_assessments")
        .select(
          "id, patient_registration_id, decision, recommended_department, red_flags, triggered_rules, validation_issues, engine_version, assessed_at"
        )
        .eq("patient_registration_id", registrationId)
        .order("assessed_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setSavedAssessment(
        data as SavedAssessment | null
      );
      setAssessmentChecked(true);
    } catch (error) {
      setAssessmentError(
        error instanceof Error
          ? error.message
          : "Unable to load assessment."
      );
    } finally {
      setAssessmentLoading(false);
    }
  }

  function resetAI() {
    aiRequestVersion.current += 1;
    setAiPrediction(null);
    setAiLoading(false);
    setAiError("");
    setSyntheticConfirmed(false);
  }

  function openReview(patient: Patient) {
    resetAI();

    setSelectedId(patient.id);
    setPriority(patient.priority);
    setAcknowledged(false);
    setModalError("");
    setSavedAssessment(null);

    void loadAssessment(patient.id);
  }

  function closeReview() {
    if (saving) return;

    resetAI();

    setSelectedId(null);
    setSavedAssessment(null);
    setModalError("");
  }

  // Run MEDIQ AI only for explicitly confirmed
  // synthetic demonstration records.
  async function runMEDIQAI() {
    if (!selectedPatient || aiLoading) return;

    if (!syntheticConfirmed) {
      setAiError(
        "Confirm that this is a synthetic demonstration record before running AI."
      );
      return;
    }

    const age = Number(selectedPatient.age);

    if (
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      setAiError(
        "A valid age between 0 and 120 is required."
      );
      return;
    }

    const complaint = [
      selectedPatient.visitReason,
      selectedPatient.symptoms,
    ]
      .filter(Boolean)
      .join(". ")
      .trim();

    if (!complaint) {
      setAiError(
        "A chief complaint is required for AI prediction."
      );
      return;
    }

    const requestVersion = ++aiRequestVersion.current;

    setAiLoading(true);
    setAiError("");
    setAiPrediction(null);

    try {
      const result = await getMEDIQPrediction({
        age_years: age,
        age_months: null,
        sex: selectedPatient.gender || "Unknown",
        pregnant: null,
        arrival_mode: "Walk-in",
        bp_systolic: selectedPatient.systolicBP,
        bp_diastolic: selectedPatient.diastolicBP,
        pulse_bpm: selectedPatient.pulseRate,
        temp_c: selectedPatient.temperatureC,
        spo2_pct: selectedPatient.spo2,
        chief_complaint: complaint,
        known_conditions:
          selectedPatient.existingConditions,
        current_medications:
          selectedPatient.medications,
      });

      if (requestVersion !== aiRequestVersion.current) {
        return;
      }

      setAiPrediction(result);

try {
  await saveMEDIQPrediction(
    selectedPatient.id,
    result
  );

  if (requestVersion === aiRequestVersion.current) {
    setMessage(
      "MEDIQ AI prediction saved successfully to Supabase."
    );
  }
} catch (saveError) {
  if (requestVersion === aiRequestVersion.current) {
    setAiError(
      saveError instanceof Error
        ? saveError.message
        : "AI prediction generated, but saving to Supabase failed."
    );
  }
}
    } catch (error) {
      if (requestVersion !== aiRequestVersion.current) {
        return;
      }

      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to connect to MEDIQ AI API."
      );
    } finally {
      if (requestVersion === aiRequestVersion.current) {
        setAiLoading(false);
      }
    }
  }

  async function testFunction(patientId: string) {
    setTestingId(patientId);
    setMessage("");

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "record-triage-assessment",
          {
            body: {
              patient_registration_id: patientId,
            },
          }
        );

      console.log(
        "Assessment function response:",
        data
      );

      if (error) throw error;

      if (data?.error) {
        throw new Error(String(data.error));
      }

      const { data: savedRecord, error: lookupError } =
        await supabase
          .from("triage_assessments")
          .select(
            "id, patient_registration_id, decision"
          )
          .eq("patient_registration_id", patientId)
          .order("assessed_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (lookupError) {
        throw new Error(
          `Unable to verify saved assessment: ${lookupError.message}`
        );
      }

      if (!savedRecord) {
        throw new Error(
          "The Edge Function completed, but no saved assessment was found for this patient."
        );
      }

      setMessage(
        `Server assessment saved successfully: ${savedRecord.decision}`
      );

      if (selectedId === patientId) {
        await loadAssessment(patientId);
      }
    } catch (error) {
      console.error(
        "Assessment test failed:",
        error
      );

      setMessage(
        error instanceof Error
          ? `Assessment test failed: ${error.message}`
          : "Assessment test failed."
      );
    } finally {
      setTestingId(null);
    }
  }

  async function saveReview() {
    if (!selectedPatient || saving) return;

    if (priority === "Pending Review") {
      setModalError(
        "Please select Routine or Urgent."
      );
      return;
    }

    if (assessmentLoading) {
      setModalError(
        "Please wait for the saved server assessment to load."
      );
      return;
    }

    if (!savedAssessment || assessmentError) {
      setModalError(
        "A saved server assessment is required before completing the review."
      );
      return;
    }

    if (
      savedAssessment.patient_registration_id !==
      selectedPatient.id
    ) {
      setModalError(
        "The saved assessment does not match this patient."
      );
      return;
    }

    if (
      priority === "Routine" &&
      (savedAssessment.decision === "ESCALATE_NOW" ||
        savedAssessment.decision === "CANNOT_ASSESS")
    ) {
      setModalError(
        "Routine is blocked for this server assessment. Request qualified staff review."
      );
      return;
    }

    if (
      priority === "Routine" &&
      (needsVerification(selectedPatient) ||
        (savedAssessment.validation_issues?.length ??
          0) > 0) &&
      !acknowledged
    ) {
      setModalError(
        "Please acknowledge independent verification before assigning Routine."
      );
      return;
    }

    // The AI does not automatically set priority.
    // A local UI safeguard blocks Routine when
    // the prototype explicitly requests urgent review.
    if (
      priority === "Routine" &&
      aiPrediction?.review_status ===
        "URGENT_CLINICIAN_REVIEW"
    ) {
      setModalError(
        "The AI prototype flagged urgent review. Routine cannot be selected in this demonstration."
      );
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      const { data, error } = await supabase.rpc(
        "save_nurse_review",
        {
          p_patient_registration_id:
            selectedPatient.id,
          p_selected_priority: priority,
          p_verification_acknowledged:
            acknowledged,
        }
      );

      if (error) throw error;

      if (!data) {
        throw new Error(
          "The server did not return a nurse review record ID."
        );
      }

      setMessage(
        `Review saved successfully for ${selectedPatient.fullName}. Priority: ${priority}.`
      );

      resetAI();
      setSelectedId(null);
      setSavedAssessment(null);

      await refreshPatients();
    } catch (error) {
      console.error(
        "Nurse review save error:",
        error
      );

      setModalError(
        error instanceof Error
          ? error.message
          : "Unable to save nurse review."
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoadError(error.message);
      return;
    }

    navigate("/login", {
      replace: true,
    });
  }

  const waitingCount = patients.filter(
    (p) => p.status === "Waiting"
  ).length;

  const pendingCount = patients.filter(
    (p) => p.priority === "Pending Review"
  ).length;

  const completedCount = patients.filter(
    (p) => p.status === "Completed"
  ).length;

  const escalationCount = patients.filter(
    (p) => assess(p).decision === "ESCALATE_NOW"
  ).length;

  const vitalsReviewCount =
    patients.filter(needsVerification).length;

  const filteredPatients = patients
    .filter((p) => {
      const q = search.trim().toLowerCase();

      const matches = [
        p.fullName,
        p.queueToken,
        p.id,
        p.department,
      ].some((value) =>
        value.toLowerCase().includes(q)
      );

      return (
        matches &&
        (statusFilter === "All" ||
          p.status === statusFilter)
      );
    })
    .sort((a, b) => {
      const safetyRank: Record<Decision, number> = {
        ESCALATE_NOW: 0,
        CANNOT_ASSESS: 1,
        NURSE_REVIEW: 2,
      };

      return (
        safetyRank[assess(a).decision] -
          safetyRank[assess(b).decision] ||
        new Date(a.registeredAt).getTime() -
          new Date(b.registeredAt).getTime()
      );
    });

  const vitals = selectedPatient
    ? ([
        [
          "Systolic BP",
          "systolic_bp",
          selectedPatient.systolicBP,
          "mmHg",
        ],
        [
          "Diastolic BP",
          "diastolic_bp",
          selectedPatient.diastolicBP,
          "mmHg",
        ],
        [
          "Pulse Rate",
          "pulse_rate",
          selectedPatient.pulseRate,
          "bpm",
        ],
        [
          "Temperature",
          "temperature_c",
          selectedPatient.temperatureC,
          "°C",
        ],
        [
          "Oxygen Saturation",
          "spo2",
          selectedPatient.spo2,
          "%",
        ],
      ] as const)
    : [];

  return (
    <div className="patient-layout">
      {/* Sidebar */}
      <aside className="patient-sidebar">
        <Link to="/" className="patient-brand">
          <span className="patient-brand-icon">
            <Activity size={23} />
          </span>
          <span>MEDIQ.</span>
        </Link>

        <div className="patient-sidebar-label">
          NURSE PORTAL
        </div>

        <nav className="patient-nav">
          <div className="patient-nav-item active">
            <LayoutDashboard size={19} />
            Nurse Dashboard
          </div>

          <div className="patient-nav-item">
            <ClipboardList size={19} />
            Patient Review
          </div>
        </nav>

        <div className="patient-sidebar-bottom">
          <div className="patient-help-card">
            <ShieldCheck size={23} />
            <strong>H1 Safety Prototype</strong>
            <p>
              Unvalidated demonstration rules.
              Independent qualified staff assessment
              is required.
            </p>
          </div>

          <button
            className="patient-logout"
            onClick={() => void logout()}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main dashboard */}
      <div className="patient-main">
        <header className="patient-topbar">
          <div className="patient-topbar-left">
            <div className="patient-breadcrumb">
              MEDIQ Staff Portal
              <ArrowRight size={15} />
              <strong>Nurse Dashboard</strong>
            </div>
          </div>

          <div className="patient-topbar-profile">
            <div className="patient-avatar">
              {nurseName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{nurseName}</strong>
              <span>Nurse Account</span>
            </div>
          </div>
        </header>

        <main className="patient-content">
          <section className="nurse-hero">
            <div>
              <span className="nurse-eyebrow">
                <HeartPulse size={15} />
                MEDIQ H1
              </span>

              <h1>Patient Intake &amp; Review</h1>

              <p>
                Review incoming registrations,
                inspect vital signs, retrieve saved
                assessments, and assign staff priorities.
              </p>
            </div>

            <button
              type="button"
              className="nurse-refresh"
              onClick={() => void refreshPatients()}
            >
              <RefreshCw size={17} />
              Refresh List
            </button>
          </section>

          {/* Statistics */}
          <section className="patient-stat-grid">
            {[
              {
                label: "Total Registrations",
                value: patients.length,
                Icon: Users,
              },
              {
                label: "Waiting",
                value: waitingCount,
                Icon: Clock3,
              },
              {
                label: "Pending Review",
                value: pendingCount,
                Icon: AlertCircle,
              },
              {
                label: "Completed",
                value: completedCount,
                Icon: CheckCircle2,
              },
            ].map(({ label, value, Icon }) => (
              <div
                className="patient-stat-card"
                key={label}
              >
                <div className="patient-stat-icon teal">
                  <Icon size={22} />
                </div>

                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <div className="nurse-clinical-note">
            <AlertCircle size={19} />
            <p>
              <strong>{escalationCount}</strong>{" "}
              registrations triggered prototype
              escalation rules.{" "}
              <strong>{vitalsReviewCount}</strong>{" "}
              require measurement verification.
              These are not clinically validated results.
            </p>
          </div>

          {loading && (
            <p>Loading patient registrations...</p>
          )}

          {loadError && (
            <div
              className="nurse-clinical-note"
              role="alert"
            >
              <AlertCircle size={19} />
              <p>{loadError}</p>
            </div>
          )}

          {message && (
            <div
              className="nurse-message"
              role="status"
            >
              <span>{message}</span>

              <button
                onClick={() => setMessage("")}
                aria-label="Dismiss"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Patient table */}
          <section className="patient-card">
            <div className="patient-card-heading">
              <div>
                <h2>
                  Incoming Patient Registrations
                </h2>
                <p>
                  Supabase patient records and
                  prototype screening results.
                </p>
              </div>

              <span>{patients.length} Records</span>
            </div>

            <div className="nurse-toolbar">
              <div className="nurse-search">
                <Search size={18} />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search patient, token or department"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="All">
                  All Statuses
                </option>
                <option value="Waiting">
                  Waiting
                </option>
                <option value="In Consultation">
                  In Consultation
                </option>
                <option value="Completed">
                  Completed
                </option>
              </select>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="nurse-empty">
                <ClipboardList size={36} />
                <h3>No matching registrations</h3>
                <p>
                  Try refreshing or changing your
                  search filters.
                </p>
              </div>
            ) : (
              <div className="patient-table-wrap">
                <table className="patient-table nurse-table">
                  <thead>
                    <tr>
                      <th>Patient / Token</th>
                      <th>Department</th>
                      <th>H1 Safety Preview</th>
                      <th>Registered</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPatients.map((patient) => {
                      const result = assess(patient);

                      return (
                        <tr key={patient.id}>
                          <td>
                            <strong>
                              {patient.fullName}
                            </strong>

                            <div style={{ fontSize: 12 }}>
                              {patient.queueToken}
                            </div>
                          </td>

                          <td>{patient.department}</td>

                          <td>
                            <span
                              style={{
                                ...decisionStyle(
                                  result.decision
                                ),
                                padding: "7px 10px",
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {decisionLabel(
                                result.decision
                              )}
                            </span>
                          </td>

                          <td>
                            {dateText(
                              patient.registeredAt
                            )}
                          </td>

                          <td>{patient.priority}</td>
                          <td>{patient.status}</td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                style={buttonStyle}
                                onClick={() =>
                                  openReview(patient)
                                }
                              >
                                Review
                              </button>

                              <button
                                style={{
                                  ...buttonStyle,
                                  background: "#334155",
                                }}
                                disabled={
                                  testingId !== null
                                }
                                onClick={() =>
                                  void testFunction(
                                    patient.id
                                  )
                                }
                              >
                                {testingId === patient.id
                                  ? "Testing..."
                                  : "Test Function"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <footer className="patient-footer">
          <span>
            © 2026 MEDIQ Healthcare Platform
          </span>
          <span>Demo Environment</span>
        </footer>
      </div>

      {/* Patient review modal */}
      {selectedPatient && (
        <div
          className="nurse-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeReview();
            }
          }}
        >
          <section
            className="nurse-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nurse-modal-title"
          >
            <header className="nurse-modal-header">
              <div>
                <span>PATIENT REVIEW</span>

                <h2 id="nurse-modal-title">
                  {selectedPatient.fullName}
                </h2>

                <p>
                  Token: {selectedPatient.queueToken}
                </p>
              </div>

              <button
                className="nurse-close"
                onClick={closeReview}
                disabled={saving}
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </header>

            <div className="nurse-modal-body">
              {/* Patient information */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 16,
                  ...cardStyle,
                }}
              >
                <Detail
                  label="Token"
                  value={selectedPatient.queueToken}
                />
                <Detail
                  label="Age"
                  value={selectedPatient.age}
                />
                <Detail
                  label="Gender"
                  value={selectedPatient.gender}
                />
                <Detail
                  label="Department"
                  value={selectedPatient.department}
                />
                <Detail
                  label="Registered"
                  value={dateText(
                    selectedPatient.registeredAt
                  )}
                />
                <Detail
                  label="Phone"
                  value={selectedPatient.phone}
                />
              </div>

              {/* Complaints */}
              <section className="nurse-detail-block">
                <h3>Reason for Visit</h3>
                <p>
                  {selectedPatient.visitReason ||
                    "Not provided"}
                </p>

                <h3>Reported Symptoms</h3>
                <p>
                  {selectedPatient.symptoms ||
                    "Not provided"}
                </p>

                <Detail
                  label="Duration"
                  value={selectedPatient.duration}
                />

                <Detail
                  label="Complaint Language"
                  value={
                    selectedPatient.complaintLanguage
                  }
                />
              </section>

              {/* Vital signs */}
              <section className="nurse-detail-block">
                <h3>
                  <HeartPulse
                    size={19}
                    style={{ display: "inline" }}
                  />{" "}
                  Original vs Validated Vital Signs
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Measurement</th>
                        <th>Original</th>
                        <th>Validated</th>
                      </tr>
                    </thead>

                    <tbody>
                      {vitals.map(
                        ([label, key, value, unit]) => (
                          <tr key={key}>
                            <td style={{ padding: 10 }}>
                              {label}
                            </td>

                            <td style={{ padding: 10 }}>
                              {selectedPatient.rawVitals?.[
                                key
                              ] === undefined
                                ? "Unavailable"
                                : listText(
                                    selectedPatient
                                      .rawVitals[key]
                                  )}
                            </td>

                            <td style={{ padding: 10 }}>
                              {value === null
                                ? "Not validated"
                                : `${value} ${unit}`}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {needsVerification(
                  selectedPatient
                ) && (
                  <p
                    style={{
                      color: "#b45309",
                      marginTop: 12,
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{
                        display: "inline",
                      }}
                    />{" "}
                    {selectedPatient
                      .vitalsReviewReason ||
                      "Measurements require independent verification."}
                  </p>
                )}
              </section>

              {/* Saved assessment */}
              <section className="nurse-detail-block">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <h3>
                    <ShieldCheck
                      size={19}
                      style={{
                        display: "inline",
                      }}
                    />{" "}
                    Saved Supabase Assessment
                  </h3>

                  <button
                    style={buttonStyle}
                    disabled={assessmentLoading}
                    onClick={() =>
                      void loadAssessment(
                        selectedPatient.id
                      )
                    }
                  >
                    <RefreshCw size={16} />
                    Refresh Assessment
                  </button>
                </div>

                {assessmentLoading && (
                  <p>Loading saved assessment...</p>
                )}

                {assessmentError && (
                  <p
                    style={{ color: "#b91c1c" }}
                    role="alert"
                  >
                    {assessmentError}
                  </p>
                )}

                {!assessmentLoading &&
                  assessmentChecked &&
                  !assessmentError &&
                  !savedAssessment && (
                    <p>
                      No saved assessment found for
                      this registration. Use Test
                      Function to create a demo
                      assessment.
                    </p>
                  )}

                {savedAssessment &&
                  !assessmentLoading && (
                    <div
                      style={{
                        ...cardStyle,
                        background: "#f8fafc",
                        marginTop: 14,
                      }}
                    >
                      <span
                        style={{
                          ...decisionStyle(
                            savedAssessment.decision
                          ),
                          display: "inline-block",
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontWeight: 700,
                        }}
                      >
                        {decisionLabel(
                          savedAssessment.decision
                        )}
                      </span>

                      <p style={{ marginTop: 12 }}>
                        <strong>
                          Suggested Department:
                        </strong>{" "}
                        {savedAssessment
                          .recommended_department ||
                          "Nurse Review"}
                      </p>

                      <p>
                        <strong>Recorded:</strong>{" "}
                        {dateText(
                          savedAssessment.assessed_at
                        )}
                      </p>

                      <p>
                        <strong>Engine:</strong>{" "}
                        {savedAssessment.engine_version}
                      </p>

                      <ItemList
                        title="Red Flags"
                        values={
                          savedAssessment.red_flags ??
                          []
                        }
                      />

                      <ItemList
                        title="Triggered Rules"
                        values={
                          savedAssessment
                            .triggered_rules ?? []
                        }
                      />

                      <ItemList
                        title="Validation Issues"
                        values={
                          savedAssessment
                            .validation_issues ?? []
                        }
                      />
                    </div>
                  )}
              </section>

              {/* Existing browser safety preview */}
              {preview && (
                <section className="nurse-detail-block">
                  <h3>
                    <Activity
                      size={19}
                      style={{
                        display: "inline",
                      }}
                    />{" "}
                    Browser Safety Preview
                  </h3>

                  <span
                    style={{
                      ...decisionStyle(
                        preview.decision
                      ),
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  >
                    {decisionLabel(
                      preview.decision
                    )}
                  </span>

                  <p style={{ marginTop: 12 }}>
                    <strong>
                      Suggested Department:
                    </strong>{" "}
                    {preview.recommendedDepartment}
                  </p>

                  <ItemList
                    title="Red Flags"
                    values={preview.redFlags}
                  />

                  <ItemList
                    title="Triggered Rules"
                    values={preview.triggeredRules}
                  />

                  <ItemList
                    title="Validation Issues"
                    values={preview.validationIssues}
                  />

                  <ItemList
                    title="Explanation"
                    values={preview.reasons}
                  />

                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    Engine: {preview.version}.
                    Unvalidated prototype rules only;
                    not a diagnosis or ESI score.
                  </p>
                </section>
              )}

              {/* NEW: MEDIQ AI prediction section */}
              <section className="nurse-detail-block">
                <h3>
                  <BrainCircuit
                    size={20}
                    style={{
                      display: "inline",
                      marginRight: 8,
                      color: "#0d9488",
                    }}
                  />
                  MEDIQ AI Prediction
                </h3>

                <p
                  style={{
                    color: "#64748b",
                    marginTop: 8,
                  }}
                >
                  Machine-learning triage and
                  department recommendation.
                  Synthetic demonstration only.
                  Predictions require independent
                  qualified staff assessment.
                </p>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={syntheticConfirmed}
                    disabled={aiLoading}
                    onChange={(e) => {
                      setSyntheticConfirmed(
                        e.target.checked
                      );
                      setAiError("");
                    }}
                  />

                  <span>
                    I confirm this is a fictional,
                    synthetic test record containing
                    no real patient information.
                  </span>
                </label>

                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    marginTop: 14,
                    background: "#0f766e",
                    opacity:
                      aiLoading ||
                      !syntheticConfirmed
                        ? 0.6
                        : 1,
                  }}
                  disabled={
                    aiLoading ||
                    !syntheticConfirmed
                  }
                  onClick={() =>
                    void runMEDIQAI()
                  }
                >
                  <BrainCircuit size={18} />
                  {aiLoading
                    ? "Analyzing..."
                    : "Run MEDIQ AI"}
                </button>

                {aiLoading && (
                  <p
                    role="status"
                    style={{
                      color: "#0f766e",
                      marginTop: 12,
                    }}
                  >
                    Analyzing synthetic patient
                    information...
                  </p>
                )}

                {aiError && (
                  <p
                    role="alert"
                    style={{
                      color: "#b91c1c",
                      marginTop: 12,
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{
                        display: "inline",
                      }}
                    />{" "}
                    {aiError}
                  </p>
                )}

                {aiPrediction && (
                  <div
                    style={{
                      ...cardStyle,
                      background: "#f8fafc",
                      marginTop: 18,
                      border:
                        "1px solid #99f6e4",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: 14,
                        color: "#115e59",
                      }}
                    >
                      AI Analysis Results
                    </h3>

                    {aiPrediction.review_status ===
                      "URGENT_CLINICIAN_REVIEW" && (
                      <div
                        role="alert"
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          borderRadius: 10,
                          padding: 14,
                          marginBottom: 16,
                          fontWeight: 700,
                        }}
                      >
                        <AlertCircle
                          size={19}
                          style={{
                            display: "inline",
                            marginRight: 7,
                          }}
                        />
                        URGENT CLINICIAN REVIEW
                        REQUIRED
                        <p
                          style={{
                            fontWeight: 400,
                            marginTop: 8,
                          }}
                        >
                          Do not treat this prediction
                          as clearance for routine
                          waiting. Follow the
                          established escalation
                          process.
                        </p>
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: 18,
                      }}
                    >
                      <Detail
                        label="Final AI Decision"
                        value={
                          aiPrediction.triage_level
                        }
                      />

                      <Detail
                        label="Suggested Triage Level"
                        value={
                          aiPrediction
                            .suggested_triage_level
                        }
                      />

                      <Detail
                        label="Recommended Department"
                        value={
                          aiPrediction.department
                        }
                      />

                      <Detail
                        label="Model Confidence"
                        value={`${(
                          aiPrediction.confidence *
                          100
                        ).toFixed(2)}%`}
                      />

                      <Detail
                        label="Emergency Probability"
                        value={`${(
                          aiPrediction
                            .emergency_probability *
                          100
                        ).toFixed(2)}%`}
                      />

                      <Detail
                        label="Review Status"
                        value={
                          aiPrediction.review_status
                        }
                      />
                    </div>

                    <ItemList
                      title="Safety Reasons"
                      values={
                        aiPrediction.safety_reasons ??
                        []
                      }
                    />

                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 16,
                      }}
                    >
                      This AI result is not saved
                      to Supabase and does not
                      automatically change the
                      patient's queue priority.
                      Confidence is a model score,
                      not a validated clinical
                      certainty.
                    </p>
                  </div>
                )}
              </section>

              {/* Medical history */}
              <section className="nurse-detail-block">
                <h3>Medical History</h3>

                <Detail
                  label="Existing Conditions"
                  value={
                    selectedPatient.existingConditions
                  }
                />

                <div style={{ height: 12 }} />

                <Detail
                  label="Medications"
                  value={selectedPatient.medications}
                />

                <div style={{ height: 12 }} />

                <Detail
                  label="Allergies"
                  value={selectedPatient.allergies}
                />
              </section>

              {/* Manual staff priority review */}
              <section className="nurse-detail-block">
                <h3>Staff Priority Review</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <label htmlFor="nurse-priority">
                      Priority
                    </label>

                    <select
                      id="nurse-priority"
                      value={priority}
                      disabled={saving}
                      onChange={(e) => {
                        setPriority(
                          e.target.value as Priority
                        );
                        setModalError("");
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: 10,
                      }}
                    >
                      <option value="Pending Review">
                        Pending Review
                      </option>
                      <option value="Routine">
                        Routine
                      </option>
                      <option value="Urgent">
                        Urgent
                      </option>
                    </select>
                  </div>

                  <div>
                    <label>
                      Consultation Status
                    </label>
                    <p>
                      {selectedPatient.status}
                    </p>
                  </div>
                </div>

                {(needsVerification(
                  selectedPatient
                ) ||
                  preview?.decision ===
                    "CANNOT_ASSESS") && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginTop: 16,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) =>
                        setAcknowledged(
                          e.target.checked
                        )
                      }
                    />

                    <span>
                      I independently reviewed
                      the fictional patient's
                      information and addressed
                      missing or inconsistent
                      measurements.
                    </span>
                  </label>
                )}

                {modalError && (
                  <p
                    role="alert"
                    style={{
                      color: "#b91c1c",
                      marginTop: 14,
                    }}
                  >
                    {modalError}
                  </p>
                )}

                <p
                  style={{
                    color: "#64748b",
                    fontSize: 13,
                    marginTop: 16,
                  }}
                >
                  Demo only. Priority is saved
                  to Supabase. Clinical decisions
                  must be made by qualified staff.
                  The AI prediction is advisory and is stored separately in
Supabase. Staff remain responsible for reviewing and
assigning priority.
                </p>
              </section>
            </div>

            <footer className="nurse-modal-footer">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void saveReview()
                }
              >
                <CheckCircle2 size={18} />
                {saving
                  ? "Saving..."
                  : "Done Reviewing"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
