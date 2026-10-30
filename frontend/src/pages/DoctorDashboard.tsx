
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  getMEDIQPrediction,
  type MEDIQPrediction,
} from "../lib/mediqAI";
import {
  getLatestMEDIQPrediction,
  type SavedMEDIQPrediction,
} from "../lib/mediqAIStorage";

import "../PatientDashboard.css";
import "../DoctorDashboard.css";

// ============================================
// TYPES
// ============================================

type Priority = "Pending Review" | "Routine" | "Urgent";
type Status = "Waiting" | "In Consultation" | "Completed";

type DoctorQueueRow = {
  id: string;
  queue_token?: string | null;
  full_name?: string | null;
  age?: string | number | null;
  gender?: string | null;
  phone?: string | null;
  department?: string | null;
  visit_reason?: string | null;
  symptoms?: string | null;
  duration?: string | null;
  existing_conditions?: string | null;
  medications?: string | null;
  allergies?: string | null;
  registered_at?: string | null;
  priority?: string | null;
  status?: string | null;
};

type PatientRegistration = {
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
  existingConditions: string;
  medications: string;
  allergies: string;
  registeredAt: string;
  priority: Priority;
  status: Status;
};

// ============================================
// HELPERS
// ============================================

function formatDate(value: string): string {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mapPatient(row: DoctorQueueRow): PatientRegistration {
  return {
    id: String(row.id ?? ""),
    queueToken: String(row.queue_token ?? "Not assigned"),
    fullName: String(row.full_name ?? ""),
    age: String(row.age ?? ""),
    gender: String(row.gender ?? ""),
    phone: String(row.phone ?? ""),
    department: String(row.department ?? ""),
    visitReason: String(row.visit_reason ?? ""),
    symptoms: String(row.symptoms ?? ""),
    duration: String(row.duration ?? ""),
    existingConditions: String(row.existing_conditions ?? ""),
    medications: String(row.medications ?? ""),
    allergies: String(row.allergies ?? ""),
    registeredAt: String(row.registered_at ?? ""),
    priority:
      row.priority === "Urgent" || row.priority === "Routine"
        ? row.priority
        : "Pending Review",
    status:
      row.status === "In Consultation" || row.status === "Completed"
        ? row.status
        : "Waiting",
  };
}

function sortQueue(
  a: PatientRegistration,
  b: PatientRegistration
): number {
  const priorityOrder: Record<Priority, number> = {
    Urgent: 0,
    Routine: 1,
    "Pending Review": 2,
  };

  return (
    priorityOrder[a.priority] - priorityOrder[b.priority] ||
    new Date(a.registeredAt).getTime() -
      new Date(b.registeredAt).getTime()
  );
}

// ============================================
// REUSABLE AI RESULT DISPLAY
// ============================================

function AIResultCard({
  prediction,
  savedAt,
  saved,
}: {
  prediction: MEDIQPrediction;
  savedAt?: string;
  saved: boolean;
}) {
  const urgent =
    prediction.review_status === "URGENT_CLINICIAN_REVIEW";

  return (
    <div
      style={{
        marginTop: 16,
        padding: 18,
        border: "1px solid #ccfbf1",
        borderRadius: 12,
        background: "#ffffff",
      }}
    >
      <h3 style={{ color: "#115e59" }}>
        {saved ? "Saved AI Analysis Results" : "AI Analysis Results"}
      </h3>

      {urgent && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 9,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          <strong>
            <AlertCircle
              size={18}
              style={{ display: "inline", marginRight: 6 }}
            />
            URGENT CLINICIAN REVIEW REQUIRED
          </strong>

          <p style={{ marginTop: 8 }}>
            This prototype flagged a possible emergency.
            Follow established clinical escalation procedures.
            Do not treat this result as clearance for routine waiting.
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 18,
          marginTop: 18,
        }}
      >
        <div>
          <span>Final AI Decision</span>
          <strong style={{ display: "block", marginTop: 5 }}>
            {prediction.triage_level}
          </strong>
        </div>

        <div>
          <span>Suggested Triage Level</span>
          <strong style={{ display: "block", marginTop: 5 }}>
            {prediction.suggested_triage_level}
          </strong>
        </div>

        <div>
          <span>Recommended Department</span>
          <strong style={{ display: "block", marginTop: 5 }}>
            {prediction.department}
          </strong>
        </div>

        <div>
          <span>Model Confidence</span>
          <strong style={{ display: "block", marginTop: 5 }}>
            {(prediction.confidence * 100).toFixed(2)}%
          </strong>
        </div>

        <div>
          <span>Emergency Probability</span>
          <strong style={{ display: "block", marginTop: 5 }}>
            {(prediction.emergency_probability * 100).toFixed(2)}%
          </strong>
        </div>

        <div>
          <span>Review Status</span>
          <strong
            style={{
              display: "block",
              marginTop: 5,
              overflowWrap: "anywhere",
            }}
          >
            {prediction.review_status}
          </strong>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <strong>Safety Reasons</strong>

        {prediction.safety_reasons.length > 0 ? (
          <ul style={{ paddingLeft: 22, marginTop: 8 }}>
            {prediction.safety_reasons.map((reason, index) => (
              <li key={`${index}-${reason}`}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p style={{ marginTop: 8 }}>
            No additional rule-based safety reasons recorded.
          </p>
        )}
      </div>

      {savedAt && (
        <p style={{ marginTop: 15 }}>
          <strong>Saved At:</strong> {formatDate(savedAt)}
        </p>
      )}

      <p
        style={{
          marginTop: 17,
          color: "#64748b",
          fontSize: 12,
        }}
      >
        {saved
          ? "Retrieved from Supabase. "
          : "This doctor-generated prediction is not saved to Supabase. "}
        Synthetic demonstration only. Model confidence is not
        clinically validated. Independent qualified clinician
        assessment is required. AI predictions do not automatically
        change nurse priority, consultation status, or queue order.
      </p>
    </div>
  );
}

// ============================================
// DOCTOR DASHBOARD
// ============================================

export default function DoctorDashboard() {
  const navigate = useNavigate();

  // General dashboard state
  const [patients, setPatients] = useState<PatientRegistration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [doctorName, setDoctorName] = useState("Demo Doctor");

  // ============================================
  // AI STATES
  // ============================================

  const [aiPrediction, setAiPrediction] =
    useState<MEDIQPrediction | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [syntheticConfirmed, setSyntheticConfirmed] = useState(false);

  // Nurse-saved AI prediction
  const [savedAiPrediction, setSavedAiPrediction] =
    useState<SavedMEDIQPrediction | null>(null);

  const [savedAiLoading, setSavedAiLoading] = useState(false);
  const [savedAiError, setSavedAiError] = useState("");

  const aiRequestVersion = useRef(0);

  const selectedPatient =
    patients.find((patient) => patient.id === selectedId) ?? null;

  // ============================================
  // RESET AI STATE
  // ============================================

  function resetAI() {
    aiRequestVersion.current += 1;

    setAiPrediction(null);
    setAiLoading(false);
    setAiError("");
    setSyntheticConfirmed(false);

    setSavedAiPrediction(null);
    setSavedAiLoading(false);
    setSavedAiError("");
  }

  // ============================================
  // OPEN PATIENT AND LOAD SAVED AI
  // ============================================

  async function openPatientDetails(patientId: string) {
    resetAI();

    const requestVersion = aiRequestVersion.current;

    setSelectedId(patientId);
    setSavedAiLoading(true);

    try {
      const prediction = await getLatestMEDIQPrediction(patientId);

      if (requestVersion !== aiRequestVersion.current) {
        return;
      }

      setSavedAiPrediction(prediction);
    } catch (error) {
      if (requestVersion !== aiRequestVersion.current) {
        return;
      }

      setSavedAiError(
        error instanceof Error
          ? error.message
          : "Unable to retrieve the saved MEDIQ AI prediction."
      );
    } finally {
      if (requestVersion === aiRequestVersion.current) {
        setSavedAiLoading(false);
      }
    }
  }

  function closePatientDetails() {
    if (saving) return;

    resetAI();
    setSelectedId(null);
  }

  // ============================================
  // FETCH DOCTOR QUEUE FROM SUPABASE
  // ============================================

  const refreshPatients = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setPatients([]);
        setLoadError("Please sign in using your Doctor account.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (
        profileError ||
        !profile ||
        profile.role !== "doctor"
      ) {
        setPatients([]);
        setLoadError("This account does not have Doctor access.");
        return;
      }

      setDoctorName(profile.full_name || "Demo Doctor");

      const { data, error } = await supabase.rpc("get_doctor_queue");

      if (error) throw error;

      const records = ((data ?? []) as DoctorQueueRow[]).map(
        mapPatient
      );

      setPatients(records);
      setLoadError("");
    } catch (error) {
      console.error("Doctor Dashboard fetch error:", error);

      setPatients([]);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load patient registrations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // AUTO REFRESH
  // ============================================

  useEffect(() => {
    void refreshPatients();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshPatients();
      }
    }, 15000);

    const handleFocus = () => {
      void refreshPatients();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshPatients]);

  // ============================================
  // RUN DOCTOR AI (SEPARATE, UNSAVED)
  // ============================================

  async function runMEDIQAI() {
    if (!selectedPatient || aiLoading) return;

    if (!syntheticConfirmed) {
      setAiError(
        "Confirm that this is a fictional synthetic record before running AI."
      );
      return;
    }

    const age = Number(selectedPatient.age);

    if (
      !selectedPatient.age.trim() ||
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      setAiError("A valid age between 0 and 120 is required.");
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
      setAiError("A chief complaint is required.");
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

        // The doctor queue RPC does not provide vitals.
        // Do not fabricate missing measurements.
        bp_systolic: null,
        bp_diastolic: null,
        pulse_bpm: null,
        temp_c: null,
        spo2_pct: null,

        chief_complaint: complaint,
        known_conditions: selectedPatient.existingConditions,
        current_medications: selectedPatient.medications,
      });

      if (requestVersion !== aiRequestVersion.current) {
        return;
      }

      setAiPrediction(result);
    } catch (error) {
      if (requestVersion !== aiRequestVersion.current) {
        return;
      }

      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the MEDIQ AI backend."
      );
    } finally {
      if (requestVersion === aiRequestVersion.current) {
        setAiLoading(false);
      }
    }
  }

  // ============================================
  // LOGOUT
  // ============================================

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoadError("Unable to sign out. Please try again.");
      return;
    }

    navigate("/login", { replace: true });
  }

  // ============================================
  // STATISTICS
  // ============================================

  const reviewedPatients = patients.filter(
    (patient) => patient.priority !== "Pending Review"
  );

  const waitingCount = reviewedPatients.filter(
    (patient) => patient.status === "Waiting"
  ).length;

  const activeCount = reviewedPatients.filter(
    (patient) => patient.status === "In Consultation"
  ).length;

  const completedCount = reviewedPatients.filter(
    (patient) => patient.status === "Completed"
  ).length;

  const urgentCount = reviewedPatients.filter(
    (patient) =>
      patient.priority === "Urgent" &&
      patient.status === "Waiting"
  ).length;

  const filteredPatients = reviewedPatients
    .filter((patient) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        patient.fullName.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query) ||
        patient.queueToken.toLowerCase().includes(query) ||
        patient.department.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" || patient.status === filter;

      return matchesSearch && matchesFilter;
    })
    .sort(sortQueue);

  // ============================================
  // CONSULTATION STATUS UPDATE
  // ============================================

  async function updateStatus(
    patient: PatientRegistration,
    status: Status
  ) {
    if (saving) return;

    const validTransition =
      (patient.status === "Waiting" &&
        status === "In Consultation") ||
      (patient.status === "In Consultation" &&
        status === "Completed");

    if (!validTransition) {
      setMessage("Invalid consultation status change.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "update_doctor_consultation",
        {
          p_patient_registration_id: patient.id,
          p_new_status: status,
        }
      );

      if (error) throw error;

      resetAI();
      setSelectedId(null);

      setMessage(
        `${patient.fullName} (${patient.queueToken}): ${status}.`
      );

      await refreshPatients();
    } catch (error) {
      console.error("Consultation update error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update consultation."
      );

      await refreshPatients();
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // CALL NEXT PATIENT
  // ============================================

  async function callNextPatient() {
    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "get_doctor_queue"
      );

      if (error) throw error;

      const queue = (data ?? []) as DoctorQueueRow[];

      const activePatient = queue.find(
        (patient) => patient.status === "In Consultation"
      );

      if (activePatient) {
        setMessage(
          `Consultation already in progress: ${
            activePatient.queue_token ?? activePatient.id
          }. Complete it before calling another patient.`
        );
        return;
      }

      const waitingPatients = queue
        .filter((patient) => patient.status === "Waiting")
        .filter(
          (patient) =>
            patient.priority === "Urgent" ||
            patient.priority === "Routine"
        )
        .sort((a, b) => {
          const aPriority =
            a.priority === "Urgent" ? 0 : 1;

          const bPriority =
            b.priority === "Urgent" ? 0 : 1;

          return (
            aPriority - bPriority ||
            new Date(a.registered_at ?? "").getTime() -
              new Date(b.registered_at ?? "").getTime()
          );
        });

      const nextPatient = waitingPatients[0];

      if (!nextPatient) {
        setMessage(
          "No nurse-reviewed waiting patients available."
        );
        return;
      }

      const { error: updateError } = await supabase.rpc(
        "update_doctor_consultation",
        {
          p_patient_registration_id: nextPatient.id,
          p_new_status: "In Consultation",
        }
      );

      if (updateError) throw updateError;

      setMessage(
        `Calling ${
          nextPatient.full_name ?? "Patient"
        } — Token ${
          nextPatient.queue_token ?? nextPatient.id
        }. Consultation started.`
      );

      await refreshPatients();
    } catch (error) {
      console.error("Call next patient error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to call the next patient."
      );

      await refreshPatients();
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // USER INTERFACE
  // ============================================

  return (
    <div className="patient-layout">
      {/* SIDEBAR */}
      <aside className="patient-sidebar">
        <Link to="/" className="patient-brand">
          <span className="patient-brand-icon">
            <Activity size={23} />
          </span>
          <span>
            MEDIQ<span className="patient-brand-dot">.</span>
          </span>
        </Link>

        <div className="patient-sidebar-label">
          DOCTOR PORTAL
        </div>

        <nav
          className="patient-nav"
          aria-label="Doctor navigation"
        >
          <div className="patient-nav-item active">
            <LayoutDashboard size={19} />
            <span>Doctor Dashboard</span>
          </div>

          <div className="patient-nav-item">
            <ClipboardList size={19} />
            <span>Patient Queue</span>
          </div>
        </nav>

        <div className="patient-sidebar-bottom">
          <div className="patient-help-card">
            <ShieldCheck size={24} />
            <strong>Clinical Workspace</strong>
            <p>
              Review nurse-assigned priorities and manage
              consultation status in this demonstration.
            </p>
          </div>

          <button
            type="button"
            className="patient-logout"
            onClick={() => void handleLogout()}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="patient-main">
        <header className="patient-topbar">
          <div className="patient-topbar-left">
            <div className="patient-breadcrumb">
              MEDIQ Staff Portal
              <ArrowRight size={15} />
              <strong>Doctor Dashboard</strong>
            </div>
          </div>

          <div className="patient-topbar-actions">
            <div className="patient-search">
              <Stethoscope size={17} />
              <span>OPD Consultation Workspace</span>
            </div>

            <div className="patient-topbar-profile">
              <div className="patient-avatar">
                {doctorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{doctorName}</strong>
                <span>Doctor Account</span>
              </div>
            </div>
          </div>
        </header>

        <main className="patient-content">
          {/* HERO */}
          <section className="doctor-hero">
            <div>
              <span className="doctor-eyebrow">
                <HeartPulse size={15} />
                MEDIQ DOCTOR WORKSPACE — DEMO
              </span>

              <h1>Consultation Management</h1>

              <p>
                Review nurse-assessed patients, view saved AI
                recommendations, call the next patient, and
                manage consultation progress.
              </p>
            </div>

            <div className="doctor-hero-actions">
              <button
                type="button"
                className="doctor-refresh"
                onClick={() => void refreshPatients()}
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                className="doctor-call-next"
                disabled={saving || loading || !!loadError}
                onClick={() => void callNextPatient()}
              >
                <Play size={17} />
                {saving ? "Processing..." : "Call Next Patient"}
              </button>
            </div>
          </section>

          {/* STATISTICS */}
          <section className="patient-stat-grid">
            <div className="patient-stat-card">
              <div className="patient-stat-icon blue">
                <Users size={22} />
              </div>
              <span>Reviewed Patients</span>
              <strong>{reviewedPatients.length}</strong>
              <small>Nurse-reviewed records</small>
            </div>

            <div className="patient-stat-card">
              <div className="patient-stat-icon teal">
                <Clock3 size={22} />
              </div>
              <span>Waiting</span>
              <strong>{waitingCount}</strong>
              <small>Ready for consultation</small>
            </div>

            <div className="patient-stat-card">
              <div className="patient-stat-icon violet">
                <Stethoscope size={22} />
              </div>
              <span>In Consultation</span>
              <strong>{activeCount}</strong>
              <small>Currently being attended</small>
            </div>

            <div className="patient-stat-card">
              <div className="patient-stat-icon green">
                <CheckCircle2 size={22} />
              </div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
              <small>Demo consultations</small>
            </div>
          </section>

          {loading && (
            <div className="doctor-message">
              <RefreshCw size={18} />
              Loading nurse-reviewed patients...
            </div>
          )}

          {loadError && (
            <div className="doctor-message" role="alert">
              <AlertCircle size={18} />
              {loadError}
            </div>
          )}

          {urgentCount > 0 && (
            <div className="doctor-urgent-notice">
              <AlertCircle size={20} />
              <span>
                {urgentCount} waiting patient(s) marked
                Urgent by nurse review.
              </span>
            </div>
          )}

          {message && (
            <div className="doctor-message" role="status">
              <AlertCircle size={18} />
              <span>{message}</span>
              <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* PATIENT QUEUE */}
          <section className="patient-card">
            <div className="patient-card-heading">
              <div>
                <h2>Doctor Patient Queue</h2>
                <p>
                  Nurse-reviewed patients awaiting or
                  undergoing consultation.
                </p>
              </div>

              <span className="doctor-count">
                {reviewedPatients.length} Patients
              </span>
            </div>

            <div className="doctor-toolbar">
              <div className="doctor-search">
                <Search size={18} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search patient, token, ID or department"
                  aria-label="Search patients"
                />
              </div>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                aria-label="Filter by status"
              >
                <option value="All">All Statuses</option>
                <option value="Waiting">Waiting</option>
                <option value="In Consultation">
                  In Consultation
                </option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="doctor-empty">
                <ClipboardList size={42} />
                <h3>
                  {loading
                    ? "Loading patients..."
                    : loadError
                    ? "Unable to load patients"
                    : "No patients found"}
                </h3>
                <p>
                  Patients appear here after a saved nurse
                  review assigns Routine or Urgent priority.
                </p>
              </div>
            ) : (
              <div className="patient-table-wrap">
                <table className="patient-table doctor-table">
                  <thead>
                    <tr>
                      <th>Patient / Token</th>
                      <th>Department</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td>
                          <div className="doctor-patient-cell">
                            <div className="doctor-avatar">
                              {patient.fullName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>{patient.fullName}</strong>
                              <small>
                                Token: {patient.queueToken}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>{patient.department}</td>

                        <td>
                          <span
                            className={`doctor-priority ${
                              patient.priority === "Urgent"
                                ? "urgent"
                                : "routine"
                            }`}
                          >
                            {patient.priority}
                          </span>
                        </td>

                        <td>
                          <span className="patient-status-pill">
                            {patient.status}
                          </span>
                        </td>

                        <td>
                          {formatDate(patient.registeredAt)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="doctor-review-button"
                            onClick={() =>
                              void openPatientDetails(patient.id)
                            }
                          >
                            View Details
                            <ArrowRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="doctor-info-note">
            <AlertCircle size={18} />
            <p>
              This demonstration uses Supabase for queue
              management and saved AI results. Queue order
              follows nurse-assigned priority and registration
              time. The experimental AI model does not
              determine clinical queue priority.
            </p>
          </div>
        </main>

        <footer className="patient-footer">
          <span>© 2026 MEDIQ Healthcare Platform</span>
          <span>
            <Stethoscope size={15} />
            Demo Environment
          </span>
        </footer>
      </div>

      {/* PATIENT CONSULTATION MODAL */}
      {selectedPatient && (
        <div
          className="doctor-modal-backdrop"
          onMouseDown={(event) => {
            if (
              !saving &&
              event.target === event.currentTarget
            ) {
              closePatientDetails();
            }
          }}
        >
          <section
            className="doctor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doctor-modal-title"
          >
            <header className="doctor-modal-header">
              <div>
                <span>PATIENT CONSULTATION</span>
                <h2 id="doctor-modal-title">
                  {selectedPatient.fullName}
                </h2>
                <p>Token: {selectedPatient.queueToken}</p>
              </div>

              <button
                type="button"
                className="doctor-close"
                disabled={saving}
                onClick={closePatientDetails}
                aria-label="Close patient details"
              >
                <X size={21} />
              </button>
            </header>

            <div className="doctor-modal-body">
              {/* PATIENT DETAILS */}
              <div className="doctor-details-grid">
                <div>
                  <span>Queue Token</span>
                  <strong>
                    {selectedPatient.queueToken}
                  </strong>
                </div>

                <div>
                  <span>Age</span>
                  <strong>
                    {selectedPatient.age || "—"}
                  </strong>
                </div>

                <div>
                  <span>Gender</span>
                  <strong>
                    {selectedPatient.gender || "—"}
                  </strong>
                </div>

                <div>
                  <span>Department</span>
                  <strong>
                    {selectedPatient.department}
                  </strong>
                </div>

                <div>
                  <span>Nurse Priority</span>
                  <strong>
                    {selectedPatient.priority}
                  </strong>
                </div>
              </div>

              <div className="doctor-detail-block">
                <h3>Reason for Visit</h3>
                <p>
                  {selectedPatient.visitReason ||
                    "Not provided"}
                </p>
              </div>

              <div className="doctor-detail-block">
                <h3>Reported Symptoms</h3>
                <p>
                  {selectedPatient.symptoms ||
                    "Not provided"}
                </p>
              </div>

              <div className="doctor-details-grid">
                <div>
                  <span>Symptom Duration</span>
                  <strong>
                    {selectedPatient.duration || "—"}
                  </strong>
                </div>

                <div>
                  <span>Registered At</span>
                  <strong>
                    {formatDate(
                      selectedPatient.registeredAt
                    )}
                  </strong>
                </div>
              </div>

              {/* =====================================
                  SAVED NURSE AI PREDICTION
              ===================================== */}

              <div
                className="doctor-detail-block"
                style={{
                  border: "1px solid #99f6e4",
                  borderRadius: 12,
                  padding: 18,
                  background: "#f0fdfa",
                }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    color: "#115e59",
                  }}
                >
                  <BrainCircuit size={21} />
                  Nurse-Saved MEDIQ AI Prediction
                </h3>

                <p style={{ marginTop: 10 }}>
                  Latest AI prediction generated by the
                  Nurse Dashboard and stored in Supabase.
                </p>

                {savedAiLoading && (
                  <p style={{ marginTop: 15 }}>
                    Loading saved AI prediction...
                  </p>
                )}

                {savedAiError && (
                  <p
                    role="alert"
                    style={{
                      color: "#b91c1c",
                      marginTop: 15,
                    }}
                  >
                    <AlertCircle
                      size={17}
                      style={{
                        display: "inline",
                        marginRight: 6,
                      }}
                    />
                    {savedAiError}
                  </p>
                )}

                {!savedAiLoading &&
                  !savedAiError &&
                  !savedAiPrediction && (
                    <p style={{ marginTop: 15 }}>
                      No nurse-saved AI prediction is
                      available for this patient.
                    </p>
                  )}

                {savedAiPrediction && !savedAiLoading && (
                  <AIResultCard
                    prediction={savedAiPrediction}
                    savedAt={savedAiPrediction.created_at}
                    saved={true}
                  />
                )}
              </div>

              {/* =====================================
                  DOCTOR AI PREDICTION
              ===================================== */}

              <div
                className="doctor-detail-block"
                style={{
                  border: "1px solid #99f6e4",
                  borderRadius: 12,
                  padding: 18,
                  background: "#f0fdfa",
                }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    color: "#115e59",
                  }}
                >
                  <BrainCircuit size={21} />
                  Run MEDIQ AI — Doctor Preview
                </h3>

                <p style={{ marginTop: 10 }}>
                  Optionally generate a separate experimental
                  AI recommendation.
                </p>

                <p
                  style={{
                    color: "#92400e",
                    fontSize: 13,
                    marginTop: 10,
                  }}
                >
                  The current doctor queue does not provide
                  vital signs to this AI request. This
                  prediction may be incomplete and can differ
                  from the nurse-saved result. Do not use
                  it for clinical decisions.
                </p>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginTop: 15,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={syntheticConfirmed}
                    disabled={aiLoading}
                    onChange={(event) => {
                      setSyntheticConfirmed(
                        event.target.checked
                      );
                      setAiError("");
                    }}
                  />

                  <span>
                    I confirm this is fictional synthetic
                    demonstration data, not real patient
                    information.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => void runMEDIQAI()}
                  disabled={
                    aiLoading || !syntheticConfirmed
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 16,
                    padding: "11px 17px",
                    border: 0,
                    borderRadius: 9,
                    background: "#0f766e",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity:
                      aiLoading || !syntheticConfirmed
                        ? 0.6
                        : 1,
                  }}
                >
                  <BrainCircuit size={18} />
                  {aiLoading
                    ? "Analyzing..."
                    : "Run MEDIQ AI"}
                </button>

                {aiError && (
                  <p
                    role="alert"
                    style={{
                      color: "#b91c1c",
                      marginTop: 14,
                    }}
                  >
                    <AlertCircle
                      size={17}
                      style={{
                        display: "inline",
                        marginRight: 6,
                      }}
                    />
                    {aiError}
                  </p>
                )}

                {aiPrediction && (
                  <AIResultCard
                    prediction={aiPrediction}
                    saved={false}
                  />
                )}
              </div>

              {/* MEDICAL HISTORY */}
              <div className="doctor-detail-block">
                <h3>Existing Conditions</h3>
                <p>
                  {selectedPatient.existingConditions ||
                    "Not provided"}
                </p>
              </div>

              <div className="doctor-detail-block">
                <h3>Medications</h3>
                <p>
                  {selectedPatient.medications ||
                    "Not provided"}
                </p>
              </div>

              <div className="doctor-detail-block">
                <h3>Allergies</h3>
                <p>
                  {selectedPatient.allergies ||
                    "Not provided"}
                </p>
              </div>

              {/* CONSULTATION STATUS */}
              <div className="doctor-current-status">
                <span>Current Consultation Status</span>
                <strong>
                  {selectedPatient.status}
                </strong>
              </div>

              <div className="doctor-clinical-note">
                <ShieldCheck size={19} />
                <p>
                  All information used for this
                  demonstration must be synthetic.
                  Clinical decisions require independent
                  qualified professional assessment.
                </p>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <footer className="doctor-modal-footer">
              {selectedPatient.status === "Waiting" && (
                <button
                  type="button"
                  className="doctor-start-button"
                  disabled={saving}
                  onClick={() =>
                    void updateStatus(
                      selectedPatient,
                      "In Consultation"
                    )
                  }
                >
                  <Play size={17} />
                  {saving
                    ? "Starting..."
                    : "Start Consultation"}
                </button>
              )}

              {selectedPatient.status ===
                "In Consultation" && (
                <button
                  type="button"
                  className="doctor-complete-button"
                  disabled={saving}
                  onClick={() =>
                    void updateStatus(
                      selectedPatient,
                      "Completed"
                    )
                  }
                >
                  <CheckCircle2 size={18} />
                  {saving
                    ? "Completing..."
                    : "Complete Consultation"}
                </button>
              )}

              {selectedPatient.status === "Completed" && (
                <span className="doctor-finished">
                  <CheckCircle2 size={18} />
                  Consultation Completed
                </span>
              )}
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
