
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import "../PatientDashboard.css";
import "../AdminDashboard.css";

type AdminTab = "Overview" | "Patients" | "Departments";

type Priority = "Pending Review" | "Routine" | "Urgent";
type Status = "Waiting" | "In Consultation" | "Completed";

type PatientRegistration = {
  id: string;
  queueToken: string;
  fullName: string;
  age: string;
  gender: string;
  department: string;
  registeredAt: string;
  priority: Priority;
  status: Status;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function downloadCSV(patients: PatientRegistration[]) {
  const columns = [
    "Registration ID",
    "Queue Token",
    "Patient Name",
    "Age",
    "Gender",
    "Department",
    "Priority",
    "Status",
    "Registered At",
  ];

  const escapeCSV = (value: unknown): string => {
    const text = String(value ?? "");
    // Prevent spreadsheet formula injection.
    const safeText = /^[\s]*[=+\-@\t\r]/.test(text)
      ? "'" + text
      : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };

  const rows = patients.map((patient) => [
    patient.id,
    patient.queueToken,
    patient.fullName,
    patient.age,
    patient.gender,
    patient.department,
    patient.priority,
    patient.status,
    patient.registeredAt,
  ]);

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "MEDIQ_Demo_Patient_Report.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] =
    useState<PatientRegistration[]>([]);

  const [activeTab, setActiveTab] =
    useState<AdminTab>("Overview");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [adminName, setAdminName] =
    useState("Demo Administrator");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* SUPABASE DATA */

  const refreshPatients = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setPatients([]);
        setLoadError("Please sign in using an Admin account.");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("user_profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

      if (
        profileError ||
        !profile ||
        profile.role !== "admin"
      ) {
        setPatients([]);
        setLoadError(
          "This account does not have Admin access."
        );
        return;
      }

      setAdminName(
        profile.full_name || "Demo Administrator"
      );

      // Fetch all pages, not just Supabase's
      // default first 1,000 records.
      const allRows: Array<{
        id: string;
        queue_token: string | null;
        full_name: string | null;
        age: number | null;
        gender: string | null;
        department: string | null;
        registered_at: string | null;
        priority: string | null;
        status: string | null;
      }> = [];

      const pageSize = 500;
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from("patient_registrations")
          .select(
            "id, queue_token, full_name, age, gender, department, registered_at, priority, status"
          )
          .order("registered_at", { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const batch = data ?? [];
        allRows.push(...batch);

        if (batch.length < pageSize) break;
        offset += pageSize;
      }

      const records: PatientRegistration[] = allRows.map(
        (row) => ({
          id: String(row.id ?? ""),
          queueToken: String(
            row.queue_token ?? "Not assigned"
          ),
          fullName: String(row.full_name ?? ""),
          age: String(row.age ?? ""),
          gender: String(row.gender ?? ""),
          department: String(
            row.department ?? "Unassigned"
          ),
          registeredAt: String(row.registered_at ?? ""),
          priority: (row.priority ??
            "Pending Review") as Priority,
          status: (row.status ?? "Waiting") as Status,
        })
      );

      setPatients(records);
      setLoadError("");
    } catch (error) {
      console.error("Admin dashboard error:", error);

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

    const handleFocus = () => {
      void refreshPatients();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshPatients]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoadError(error.message);
      return;
    }

    navigate("/login", { replace: true });
  }

  /* STATISTICS */

  const stats = useMemo(() => {
    const total = patients.length;

    const waiting = patients.filter(
      (patient) => patient.status === "Waiting"
    ).length;

    const inConsultation = patients.filter(
      (patient) => patient.status === "In Consultation"
    ).length;

    const completed = patients.filter(
      (patient) => patient.status === "Completed"
    ).length;

    const urgent = patients.filter(
      (patient) => patient.priority === "Urgent"
    ).length;

    const pendingReview = patients.filter(
      (patient) => patient.priority === "Pending Review"
    ).length;

    return {
      total,
      waiting,
      inConsultation,
      completed,
      urgent,
      pendingReview,
      reviewed: total - pendingReview,
    };
  }, [patients]);

  /* DEPARTMENT DISTRIBUTION */

  const departments = useMemo(() => {
    const counts = new Map<string, number>();

    patients.forEach((patient) => {
      const department =
        patient.department || "Unassigned";

      counts.set(
        department,
        (counts.get(department) ?? 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [patients]);

  const maxDepartmentCount = Math.max(
    1,
    ...departments.map((department) => department.count)
  );

  /* SEARCH AND FILTERS */

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const matchesSearch =
        patient.fullName.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query) ||
        patient.queueToken.toLowerCase().includes(query) ||
        patient.department.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        patient.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        patient.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [patients, search, statusFilter, priorityFilter]);

  const selectedPatient =
    patients.find((patient) => patient.id === selectedId) ??
    null;

  const completionRate =
    stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  const reviewRate =
    stats.total > 0
      ? Math.round((stats.reviewed / stats.total) * 100)
      : 0;

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
          ADMINISTRATION
        </div>

        <nav
          className="patient-nav"
          aria-label="Admin navigation"
        >
          <button
            type="button"
            className={`patient-nav-item ${
              activeTab === "Overview" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Overview")}
          >
            <LayoutDashboard size={19} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`patient-nav-item ${
              activeTab === "Patients" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Patients")}
          >
            <Users size={19} />
            <span>Patient Records</span>
          </button>

          <button
            type="button"
            className={`patient-nav-item ${
              activeTab === "Departments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("Departments")}
          >
            <BarChart3 size={19} />
            <span>Departments</span>
          </button>
        </nav>

        <div className="patient-sidebar-bottom">
          <div className="patient-help-card">
            <ShieldCheck size={24} />
            <strong>Hospital Administration</strong>
            <p>
              Monitor registration and queue activity using
              fictional demonstration records.
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

      {/* MAIN AREA */}

      <div className="patient-main">
        <header className="patient-topbar">
          <div className="patient-topbar-left">
            <div className="patient-breadcrumb">
              MEDIQ Administration
              <ArrowRight size={15} />
              <strong>{activeTab}</strong>
            </div>
          </div>

          <div className="patient-topbar-actions">
            <div className="patient-search">
              <HeartPulse size={17} />
              <span>Hospital Command Center</span>
            </div>

            <div className="patient-topbar-profile">
              <div className="patient-avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{adminName}</strong>
                <span>Admin Account</span>
              </div>
            </div>
          </div>
        </header>

        <main className="patient-content">
          {/* HERO */}

          <section className="admin-hero">
            <div>
              <span className="admin-eyebrow">
                <Activity size={15} />
                MEDIQ HOSPITAL INTELLIGENCE
              </span>

              <h1>Hospital Command Center</h1>

              <p>
                Monitor patient registrations, OPD queues,
                staff review progress, and department
                activity from one administrative workspace.
              </p>
            </div>

            <div className="admin-hero-actions">
              <button
                type="button"
                className="admin-refresh"
                onClick={() => void refreshPatients()}
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                className="admin-export"
                disabled={loading || !!loadError}
                onClick={() => downloadCSV(patients)}
              >
                <Download size={17} />
                Export Report
              </button>
            </div>
          </section>

          {/* LOADING AND ERRORS */}

          {loading && (
            <div className="admin-disclaimer" role="status">
              <RefreshCw size={18} />
              <p>Loading patient data from Supabase...</p>
            </div>
          )}

          {loadError && (
            <div className="admin-disclaimer" role="alert">
              <AlertCircle size={18} />
              <p>{loadError}</p>
            </div>
          )}

          {/* STATISTICS */}

          <section className="patient-stat-grid">
            <div className="patient-stat-card">
              <div className="patient-stat-icon blue">
                <Users size={22} />
              </div>
              <span>Total Registrations</span>
              <strong>{stats.total}</strong>
              <small>All demo OPD registrations</small>
            </div>

            <div className="patient-stat-card">
              <div className="patient-stat-icon teal">
                <Clock3 size={22} />
              </div>
              <span>Waiting Patients</span>
              <strong>{stats.waiting}</strong>
              <small>Awaiting consultation</small>
            </div>

            <div className="patient-stat-card">
              <div className="patient-stat-icon violet">
                <AlertCircle size={22} />
              </div>
              <span>Urgent Cases</span>
              <strong>{stats.urgent}</strong>
              <small>Nurse-assigned priority</small>
            </div>

            <div className="patient-stat-card">
              <div className="patient-stat-icon green">
                <CheckCircle2 size={22} />
              </div>
              <span>Completed Visits</span>
              <strong>{stats.completed}</strong>
              <small>Demo consultations</small>
            </div>
          </section>

          {/* OVERVIEW */}

          {activeTab === "Overview" && (
            <>
              <div className="admin-dashboard-grid">
                <section className="patient-card admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h2>Department Distribution</h2>
                      <p>
                        Registration volume by OPD department
                      </p>
                    </div>
                    <BarChart3 size={21} />
                  </div>

                  {departments.length === 0 ? (
                    <div className="admin-empty">
                      No registrations available yet.
                    </div>
                  ) : (
                    <div className="admin-department-list">
                      {departments.map((department) => (
                        <div
                          key={department.name}
                          className="admin-department-row"
                        >
                          <div className="admin-department-label">
                            <strong>{department.name}</strong>
                            <span>{department.count}</span>
                          </div>

                          <div className="admin-bar-track">
                            <div
                              className="admin-bar-fill"
                              style={{
                                width: `${
                                  (department.count /
                                    maxDepartmentCount) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="patient-card admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h2>Workflow Progress</h2>
                      <p>
                        Nurse reviews and consultation status
                      </p>
                    </div>
                    <TrendingUp size={21} />
                  </div>

                  <div className="admin-progress-group">
                    <div className="admin-progress-header">
                      <span>Nurse Reviewed</span>
                      <strong>{reviewRate}%</strong>
                    </div>

                    <div className="admin-progress-track">
                      <div
                        className="admin-progress-fill teal"
                        style={{ width: `${reviewRate}%` }}
                      />
                    </div>

                    <small>
                      {stats.reviewed} of {stats.total} records
                    </small>
                  </div>

                  <div className="admin-progress-group">
                    <div className="admin-progress-header">
                      <span>Consultations Completed</span>
                      <strong>{completionRate}%</strong>
                    </div>

                    <div className="admin-progress-track">
                      <div
                        className="admin-progress-fill green"
                        style={{
                          width: `${completionRate}%`,
                        }}
                      />
                    </div>

                    <small>
                      {stats.completed} of {stats.total} records
                    </small>
                  </div>

                  <div className="admin-mini-stats">
                    <div>
                      <Clock3 size={19} />
                      <strong>{stats.inConsultation}</strong>
                      <span>In Consultation</span>
                    </div>

                    <div>
                      <ClipboardList size={19} />
                      <strong>{stats.pendingReview}</strong>
                      <span>Pending Review</span>
                    </div>
                  </div>
                </section>
              </div>

              <section className="patient-card admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Recent Patient Activity</h2>
                    <p>
                      Latest OPD registrations and their
                      current workflow status
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-text-button"
                    onClick={() => setActiveTab("Patients")}
                  >
                    View All
                    <ArrowRight size={16} />
                  </button>
                </div>

                <PatientTable
                  patients={patients.slice(0, 5)}
                  onView={(patient) =>
                    setSelectedId(patient.id)
                  }
                />
              </section>
            </>
          )}

          {/* PATIENT RECORDS */}

          {activeTab === "Patients" && (
            <section className="patient-card admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>All Patient Registrations</h2>
                  <p>
                    Search and inspect saved demonstration
                    records.
                  </p>
                </div>

                <span className="admin-count">
                  {filteredPatients.length} Records
                </span>
              </div>

              <div className="admin-toolbar">
                <div className="admin-search">
                  <Search size={18} />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search patient, token, ID, department"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  aria-label="Filter consultation status"
                >
                  <option value="All">All Statuses</option>
                  <option value="Waiting">Waiting</option>
                  <option value="In Consultation">
                    In Consultation
                  </option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value)
                  }
                  aria-label="Filter patient priority"
                >
                  <option value="All">All Priorities</option>
                  <option value="Pending Review">
                    Pending Review
                  </option>
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <PatientTable
                patients={filteredPatients}
                onView={(patient) =>
                  setSelectedId(patient.id)
                }
              />
            </section>
          )}

          {/* DEPARTMENTS */}

          {activeTab === "Departments" && (
            <section className="patient-card admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Department Performance</h2>
                  <p>
                    Patient registrations and consultation
                    progress grouped by department
                  </p>
                </div>

                <BarChart3 size={22} />
              </div>

              {departments.length === 0 ? (
                <div className="admin-empty">
                  No department records are available.
                </div>
              ) : (
                <div className="admin-department-cards">
                  {departments.map((department) => {
                    const members = patients.filter(
                      (patient) =>
                        (patient.department ||
                          "Unassigned") ===
                        department.name
                    );

                    const completed = members.filter(
                      (patient) =>
                        patient.status === "Completed"
                    ).length;

                    const waiting = members.filter(
                      (patient) =>
                        patient.status === "Waiting"
                    ).length;

                    return (
                      <div
                        key={department.name}
                        className="admin-department-card"
                      >
                        <div className="admin-department-card-top">
                          <div className="admin-department-icon">
                            <Stethoscope size={23} />
                          </div>

                          <div>
                            <h3>{department.name}</h3>
                            <span>OPD Department</span>
                          </div>
                        </div>

                        <div className="admin-department-numbers">
                          <div>
                            <strong>{members.length}</strong>
                            <span>Total</span>
                          </div>

                          <div>
                            <strong>{waiting}</strong>
                            <span>Waiting</span>
                          </div>

                          <div>
                            <strong>{completed}</strong>
                            <span>Completed</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <div className="admin-disclaimer">
            <ShieldCheck size={18} />
            <p>
              MEDIQ Admin is a demonstration dashboard.
              Statistics reflect Supabase-stored fictional
              registrations, not real hospital operations
              or independently measured clinical outcomes.
            </p>
          </div>
        </main>

        <footer className="patient-footer">
          <span>© 2026 MEDIQ Healthcare Platform</span>
          <span>
            <Activity size={15} />
            Administration Demo
          </span>
        </footer>
      </div>

      {/* READ-ONLY PATIENT DETAILS */}

      {selectedPatient && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedId(null);
            }
          }}
        >
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <header className="admin-modal-header">
              <div>
                <span>PATIENT RECORD</span>
                <h2 id="admin-modal-title">
                  {selectedPatient.fullName}
                </h2>
                <p>Token: {selectedPatient.queueToken}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close patient details"
              >
                <X size={21} />
              </button>
            </header>

            <div className="admin-modal-body">
              <div className="admin-details-grid">
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
                  <span>Registration Date</span>
                  <strong>
                    {formatDate(
                      selectedPatient.registeredAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>Priority</span>
                  <strong>
                    {selectedPatient.priority}
                  </strong>
                </div>

                <div>
                  <span>Consultation Status</span>
                  <strong>
                    {selectedPatient.status}
                  </strong>
                </div>
              </div>

              <div className="admin-detail-note">
                <AlertCircle size={18} />
                <p>
                  This is a read-only administrative view.
                  Nurse priority and consultation status
                  are managed in their respective portals.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   PATIENT TABLE
========================================== */

function PatientTable({
  patients,
  onView,
}: {
  patients: PatientRegistration[];
  onView: (patient: PatientRegistration) => void;
}) {
  if (patients.length === 0) {
    return (
      <div className="admin-empty">
        <ClipboardList size={36} />
        <h3>No patient records found</h3>
        <p>
          Register a fictional patient in the Patient Portal
          or adjust the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="patient-table-wrap">
      <table className="patient-table admin-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>
                <div className="admin-patient-cell">
                  <div className="admin-avatar">
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
                  className={`admin-priority ${
                    patient.priority === "Urgent"
                      ? "urgent"
                      : patient.priority === "Routine"
                      ? "routine"
                      : "pending"
                  }`}
                >
                  {patient.priority}
                </span>
              </td>

              <td>{patient.status}</td>

              <td>
                {formatDate(patient.registeredAt)}
              </td>

              <td>
                <button
                  type="button"
                  className="admin-view-button"
                  onClick={() => onView(patient)}
                >
                  View
                  <ArrowRight size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
