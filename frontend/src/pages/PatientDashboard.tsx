
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  History,
  UserRound,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ArrowRight,
  Clock3,
  Ticket,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

import OPDRegistration from "./OPDRegistration";
import { supabase } from "../lib/supabase";
import "../PatientDashboard.css";

/* ==========================================
   TYPES
========================================== */

type Tab =
  | "dashboard"
  | "appointments"
  | "queue"
  | "history"
  | "profile";

type PatientRegistration = {
  id: string;
  fullName: string;
  department: string;
  registeredAt: string;
  status: "Waiting" | "In Consultation" | "Completed";
  priority: "Pending Review" | "Routine" | "Urgent";
};

const navigation: {
  id: Tab;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: CalendarDays,
  },
  {
    id: "queue",
    label: "My Queue",
    icon: ClipboardList,
  },
  {
    id: "history",
    label: "Medical History",
    icon: History,
  },
  {
    id: "profile",
    label: "My Profile",
    icon: UserRound,
  },
];

/* ==========================================
   DATE FORMATTING
========================================== */

function formatRegistrationDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ==========================================
   PATIENT DASHBOARD
========================================== */

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState<Tab>("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [registrations, setRegistrations] =
    useState<PatientRegistration[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accountName, setAccountName] = useState("Patient");
  const [accountEmail, setAccountEmail] = useState("");

  /* ==========================================
     LOAD REGISTRATIONS FROM SUPABASE
  ========================================== */

  const loadRegistrations = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setRegistrations([]);
        setLoadError(
          "Please sign in to view your registrations."
        );
        return;
      }

      setAccountEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setAccountName(
        profile?.full_name ||
        user.user_metadata?.full_name ||
        "Patient"
      );

      const { data, error } = await supabase
        .from("patient_registrations")
        .select(
          "id, full_name, department, registered_at, status, priority"
        )
        .eq("patient_user_id", user.id)
        .order("registered_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const records: PatientRegistration[] = (
        data ?? []
      ).map((row) => ({
        id: row.id,
        fullName: row.full_name,
        department: row.department,
        registeredAt: row.registered_at,
        status:
          row.status as PatientRegistration["status"],
        priority:
          row.priority as PatientRegistration["priority"],
      }));

      setRegistrations(records);
      setLoadError("");
    } catch (error) {
      console.error(
        "MEDIQ registration loading error:",
        error
      );

      setLoadError(
        "Unable to load registrations from Supabase."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================
     INITIAL DATA LOADING
  ========================================== */

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  /* ==========================================
     PERIODIC REFRESH
  ========================================== */

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadRegistrations();
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadRegistrations]);

  
  /* ==========================================
     SUPABASE REALTIME UPDATES
  ========================================== */

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribeToPatientUpdates() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active || error || !user) {
        return;
      }
      console.log("MEDIQ Realtime filter:", `patient_user_id=eq.${user.id}`);
      channel = supabase
        .channel(`patient-registrations-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "patient_registrations",
            
          },
          
(payload) => {
  console.log("MEDIQ Realtime UPDATE received:", payload);

  if (document.visibilityState === "visible") {
    void loadRegistrations();
  }
}

        )
        
.subscribe((status) => {
  console.log("MEDIQ Realtime status:", status);
});

    }

    void subscribeToPatientUpdates();

    return () => {
      active = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadRegistrations]);


  /* ==========================================
     LOGOUT
  ========================================== */

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoadError(
        "Unable to sign out. Please try again."
      );
      return;
    }

    navigate("/login", { replace: true });
  }

  /* ==========================================
     REGISTRATION STATISTICS
  ========================================== */

  const latestRegistration =
    registrations[0] ?? null;

  const waitingCount = registrations.filter(
    (item) => item.status === "Waiting"
  ).length;

  const consultationCount = registrations.filter(
    (item) => item.status === "In Consultation"
  ).length;

  const completedCount = registrations.filter(
    (item) => item.status === "Completed"
  ).length;

  const pendingReviewCount = registrations.filter(
    (item) => item.priority === "Pending Review"
  ).length;

  const completedVisits = registrations.filter(
    (item) => item.status === "Completed"
  );

  /* ==========================================
     NAVIGATION
  ========================================== */

  function changeTab(tab: Tab) {
    void loadRegistrations();

    setActiveTab(tab);
    setSidebarOpen(false);
    setNotificationsOpen(false);
  }

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="patient-layout">

      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          className="patient-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`patient-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <Link to="/" className="patient-brand">
          <span className="patient-brand-icon">
            <Activity size={23} />
          </span>

          <span>
            MEDIQ
            <span className="patient-brand-dot">
              .
            </span>
          </span>
        </Link>

        <div className="patient-sidebar-label">
          PATIENT PORTAL
        </div>

        <nav
          className="patient-nav"
          aria-label="Patient navigation"
        >
          {navigation.map(
            ({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`patient-nav-item ${
                  activeTab === id ? "active" : ""
                }`}
                onClick={() => changeTab(id)}
              >
                <Icon size={19} />
                <span>{label}</span>

                {activeTab === id && (
                  <ChevronRight size={16} />
                )}
              </button>
            )
          )}
        </nav>

        <div className="patient-sidebar-bottom">
          <div className="patient-help-card">
            <HeartPulse size={24} />

            <strong>
              Need assistance?
            </strong>

            <p>
              Contact the hospital help desk
              for medical or queue-related
              support.
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

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <div className="patient-main">

        {/* TOP NAVIGATION BAR */}

        <header className="patient-topbar">
          <div className="patient-topbar-left">
            <button
              type="button"
              className="patient-mobile-menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={23} />
            </button>

            <div className="patient-breadcrumb">
              Patient Portal

              <ChevronRight size={15} />

              <strong>
                {
                  navigation.find(
                    (item) =>
                      item.id === activeTab
                  )?.label
                }
              </strong>
            </div>
          </div>

          <div className="patient-topbar-actions">
            <div className="patient-search">
              <Search size={17} />
              <span>
                MEDIQ Healthcare
              </span>
            </div>

            <div className="patient-notification-wrap">
              <button
                type="button"
                className="patient-icon-button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() =>
                  setNotificationsOpen(
                    !notificationsOpen
                  )
                }
              >
                <Bell size={20} />

                {pendingReviewCount > 0 && (
                  <span className="patient-notification-dot" />
                )}
              </button>

              {notificationsOpen && (
                <div className="patient-notification-popover">
                  <strong>
                    Notifications
                  </strong>

                  {pendingReviewCount > 0 ? (
                    <p>
                      {pendingReviewCount} registration(s)
                      awaiting staff priority review.
                    </p>
                  ) : (
                    <p>
                      No pending registration reviews.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(false)
                    }
                  >
                    <X size={15} />
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="patient-topbar-profile">
              <div className="patient-avatar">
                {accountName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {accountName}
                </strong>
                <span>
                  Patient Account
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="patient-content">

          {/* DATA LOADING MESSAGE */}

          {loading && (
            <div className="patient-info-line">
              <Clock3 size={17} />
              Loading your MEDIQ registrations...
            </div>
          )}

          {/* DATABASE ERROR MESSAGE */}

          {loadError && (
            <div
              className="patient-info-line"
              role="alert"
            >
              <AlertCircle size={17} />
              {loadError}

              <button
                type="button"
                onClick={() =>
                  void loadRegistrations()
                }
              >
                Retry
              </button>
            </div>
          )}

          {/* ==================================
              DASHBOARD TAB
          ================================== */}

          {activeTab === "dashboard" && (
            <>

              {/* WELCOME BANNER */}

              <section className="patient-welcome">
                <div>
                  <div className="patient-welcome-tag">
                    <span className="patient-live-dot" />
                    YOUR HEALTHCARE WORKSPACE
                  </div>

                  <h1>
                    Good to see you, {accountName}!
                  </h1>

                  <p>
                    Manage your hospital visits,
                    track your queue, and stay
                    informed — all in one place.
                  </p>

                  <button
                    type="button"
                    className="patient-primary-btn"
                    onClick={() =>
                      changeTab("appointments")
                    }
                  >
                    <Plus size={18} />
                    New OPD Registration
                    <ArrowRight size={17} />
                  </button>
                </div>

                <div className="patient-welcome-illustration">
                  <div className="patient-welcome-icon">
                    <HeartPulse
                      size={54}
                      strokeWidth={1.5}
                    />
                  </div>

                  <span>
                    YOUR HEALTH. OUR PRIORITY.
                  </span>
                </div>
              </section>

              {/* DASHBOARD STATISTICS */}

              <section className="patient-stat-grid">

                <div className="patient-stat-card">
                  <div className="patient-stat-icon blue">
                    <Ticket size={22} />
                  </div>

                  <span>
                    Latest Registration
                  </span>

                  <strong
                    style={{
                      fontSize: latestRegistration
                        ? "clamp(12px, 1.3vw, 18px)"
                        : undefined,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {latestRegistration
                      ? latestRegistration.id
                      : "—"}
                  </strong>

                  <small>
                    {latestRegistration
                      ? "Supabase registration ID"
                      : "No registrations"}
                  </small>
                </div>

                <div className="patient-stat-card">
                  <div className="patient-stat-icon teal">
                    <Clock3 size={22} />
                  </div>

                  <span>
                    Waiting
                  </span>

                  <strong>
                    {waitingCount}
                  </strong>

                  <small>
                    OPD registrations
                  </small>
                </div>

                <div className="patient-stat-card">
                  <div className="patient-stat-icon violet">
                    <CalendarDays size={22} />
                  </div>

                  <span>
                    Registrations
                  </span>

                  <strong>
                    {registrations.length}
                  </strong>

                  <small>
                    Saved in Supabase
                  </small>
                </div>

                <div className="patient-stat-card">
                  <div className="patient-stat-icon green">
                    <CheckCircle2 size={22} />
                  </div>

                  <span>
                    Completed
                  </span>

                  <strong>
                    {completedCount}
                  </strong>

                  <small>
                    OPD registrations
                  </small>
                </div>

              </section>

              {/* CURRENT QUEUE AND QUICK ACTIONS */}

              <div className="patient-dashboard-grid">

                {/* CURRENT REGISTRATION */}

                <section className="patient-card">
                  <div className="patient-card-heading">
                    <div>
                      <h2>
                        Current Registration Status
                      </h2>

                      <p>
                        Latest Supabase OPD registration
                      </p>
                    </div>

                    {latestRegistration && (
                      <span className="patient-status-pill">
                        {latestRegistration.status}
                      </span>
                    )}
                  </div>

                  {latestRegistration ? (
                    <>
                      <div className="patient-queue-highlight">
                        <div>
                          <span>
                            REGISTRATION ID
                          </span>

                          <strong
                            style={{
                              fontSize:
                                "clamp(15px, 2vw, 24px)",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {latestRegistration.id}
                          </strong>

                          <small>
                            {latestRegistration.department}
                            {" · "}
                            OPD Registration
                          </small>
                        </div>

                        <div className="patient-queue-number">
                          <Clock3 size={25} />

                          <span>
                            {latestRegistration.status}
                          </span>
                        </div>
                      </div>

                      <div className="patient-queue-progress">
                        <div>
                          <span>
                            Priority Review
                          </span>

                          <strong>
                            {latestRegistration.priority}
                          </strong>
                        </div>

                        <div className="patient-progress-track">
                          <div
                            className="patient-progress-fill"
                            style={{
                              width:
                                latestRegistration.status ===
                                "Completed"
                                  ? "100%"
                                  : latestRegistration.status ===
                                    "In Consultation"
                                  ? "60%"
                                  : "15%",
                            }}
                          />
                        </div>

                        <small
                          style={{
                            display: "block",
                            marginTop: "10px",
                          }}
                        >
                          Illustrative status indicator,
                          not a measured queue position.
                        </small>
                      </div>
                    </>
                  ) : (
                    <div className="patient-empty-state">
                      <ClipboardList size={35} />

                      <h2>
                        No Registration Yet
                      </h2>

                      <p>
                        Submit your first OPD registration
                        to view its details here.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="patient-text-button"
                    onClick={() =>
                      changeTab("queue")
                    }
                  >
                    View Queue Details
                    <ArrowRight size={16} />
                  </button>
                </section>

                {/* QUICK ACTIONS */}

                <section className="patient-card">
                  <div className="patient-card-heading">
                    <div>
                      <h2>
                        Quick Actions
                      </h2>

                      <p>
                        Manage your hospital experience
                      </p>
                    </div>
                  </div>

                  <div className="patient-quick-actions">

                    <button
                      type="button"
                      onClick={() =>
                        changeTab("appointments")
                      }
                    >
                      <span className="patient-action-icon blue">
                        <CalendarDays size={21} />
                      </span>

                      <span>
                        <strong>
                          Register for OPD
                        </strong>

                        <small>
                          Start a new hospital visit
                        </small>
                      </span>

                      <ChevronRight size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeTab("queue")
                      }
                    >
                      <span className="patient-action-icon teal">
                        <ClipboardList size={21} />
                      </span>

                      <span>
                        <strong>
                          Track My Queue
                        </strong>

                        <small>
                          View registration status
                        </small>
                      </span>

                      <ChevronRight size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeTab("history")
                      }
                    >
                      <span className="patient-action-icon violet">
                        <History size={21} />
                      </span>

                      <span>
                        <strong>
                          Visit History
                        </strong>

                        <small>
                          Review previous visits
                        </small>
                      </span>

                      <ChevronRight size={18} />
                    </button>

                  </div>
                </section>
              </div>

              {/* RECENT VISITS */}

              <section className="patient-card patient-recent-visits">
                <div className="patient-card-heading">
                  <div>
                    <h2>
                      Recent Visits
                    </h2>

                    <p>
                      Completed OPD registrations
                    </p>
                  </div>

                  <button
                    type="button"
                    className="patient-text-button"
                    onClick={() =>
                      changeTab("history")
                    }
                  >
                    View All
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="patient-table-wrap">
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Department</th>
                        <th>Registration ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {completedVisits
                        .slice(0, 5)
                        .map((visit) => (
                          <tr key={visit.id}>
                            <td>
                              {formatRegistrationDate(
                                visit.registeredAt
                              )}
                            </td>

                            <td>
                              {visit.department}
                            </td>

                            <td>
                              {visit.id}
                            </td>

                            <td>
                              <span className="patient-completed-pill">
                                <CheckCircle2 size={14} />
                                {visit.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {completedVisits.length === 0 && (
                    <p style={{ padding: "16px" }}>
                      No completed visits yet.
                    </p>
                  )}
                </div>
              </section>

            </>
          )}

          {/* ==================================
              APPOINTMENTS TAB
          ================================== */}

          {activeTab === "appointments" && (
            <section className="patient-section-page">
              <div className="patient-page-heading">
                <span>
                  APPOINTMENTS
                </span>

                <h1>
                  OPD Registration
                </h1>

                <p>
                  Start a new hospital visit
                  and submit your information.
                </p>
              </div>

              <OPDRegistration />
            </section>
          )}

          {/* ==================================
              MY QUEUE TAB
          ================================== */}

          {activeTab === "queue" && (
            <section className="patient-section-page">

              <div className="patient-page-heading">
                <span>
                  MY QUEUE
                </span>

                <h1>
                  Queue Tracking
                </h1>

                <p>
                  View your Supabase OPD registrations
                  and current status.
                </p>
              </div>

              {registrations.length === 0 ? (

                /* EMPTY QUEUE */

                <div className="patient-card patient-empty-state">
                  <Ticket size={42} />

                  <h2>
                    No Registrations Found
                  </h2>

                  <p>
                    You haven't submitted an OPD
                    registration yet.
                  </p>

                  <button
                    type="button"
                    className="patient-primary-btn"
                    onClick={() =>
                      changeTab("appointments")
                    }
                  >
                    <Plus size={18} />
                    New OPD Registration
                    <ArrowRight size={17} />
                  </button>
                </div>

              ) : (
                <>

                  {/* QUEUE STATISTICS */}

                  <section className="patient-stat-grid">

                    <div className="patient-stat-card">
                      <div className="patient-stat-icon blue">
                        <ClipboardList size={22} />
                      </div>

                      <span>
                        Total Registrations
                      </span>

                      <strong>
                        {registrations.length}
                      </strong>

                      <small>
                        Saved in Supabase
                      </small>
                    </div>

                    <div className="patient-stat-card">
                      <div className="patient-stat-icon teal">
                        <Clock3 size={22} />
                      </div>

                      <span>
                        Waiting
                      </span>

                      <strong>
                        {waitingCount}
                      </strong>

                      <small>
                        OPD status
                      </small>
                    </div>

                    <div className="patient-stat-card">
                      <div className="patient-stat-icon violet">
                        <HeartPulse size={22} />
                      </div>

                      <span>
                        In Consultation
                      </span>

                      <strong>
                        {consultationCount}
                      </strong>

                      <small>
                        OPD status
                      </small>
                    </div>

                    <div className="patient-stat-card">
                      <div className="patient-stat-icon green">
                        <CheckCircle2 size={22} />
                      </div>

                      <span>
                        Completed
                      </span>

                      <strong>
                        {completedCount}
                      </strong>

                      <small>
                        OPD status
                      </small>
                    </div>

                  </section>

                  {/* REGISTRATION TABLE */}

                  <section className="patient-card">
                    <div className="patient-card-heading">
                      <div>
                        <h2>
                          My OPD Registrations
                        </h2>

                        <p>
                          Supabase registration records
                        </p>
                      </div>

                      <span className="patient-status-pill">
                        My Records
                      </span>
                    </div>

                    <div className="patient-table-wrap">
                      <table className="patient-table">
                        <thead>
                          <tr>
                            <th>Registration ID</th>
                            <th>Patient Name</th>
                            <th>Department</th>
                            <th>Registered At</th>
                            <th>Status</th>
                            <th>Priority</th>
                          </tr>
                        </thead>

                        <tbody>
                          {registrations.map(
                            (registration) => (
                              <tr key={registration.id}>
                                <td>
                                  <strong>
                                    {registration.id}
                                  </strong>
                                </td>

                                <td>
                                  {registration.fullName}
                                </td>

                                <td>
                                  {registration.department}
                                </td>

                                <td>
                                  {formatRegistrationDate(
                                    registration.registeredAt
                                  )}
                                </td>

                                <td>
                                  <span className="patient-status-pill">
                                    {registration.status}
                                  </span>
                                </td>

                                <td>
                                  {registration.priority}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* LATEST REGISTRATION */}

                  {latestRegistration && (
                    <section className="patient-card">
                      <div className="patient-card-heading">
                        <div>
                          <h2>
                            Latest Registration
                          </h2>

                          <p>
                            Your most recent OPD request
                          </p>
                        </div>

                        <span className="patient-status-pill">
                          {latestRegistration.status}
                        </span>
                      </div>

                      <div className="patient-queue-highlight">
                        <div>
                          <span>
                            REGISTRATION ID
                          </span>

                          <strong
                            style={{
                              fontSize:
                                "clamp(15px, 2vw, 24px)",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {latestRegistration.id}
                          </strong>

                          <small>
                            {latestRegistration.department}
                            {" · "}
                            OPD Registration
                          </small>
                        </div>

                        <div className="patient-queue-number">
                          <Clock3 size={25} />

                          <span>
                            {latestRegistration.status}
                          </span>
                        </div>
                      </div>

                      <div
                        className="patient-profile-info"
                        style={{
                          marginTop: "20px",
                        }}
                      >
                        <div>
                          <span>
                            Patient Name
                          </span>

                          <strong>
                            {latestRegistration.fullName}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Registered At
                          </span>

                          <strong>
                            {formatRegistrationDate(
                              latestRegistration.registeredAt
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Priority Review
                          </span>

                          <strong>
                            {latestRegistration.priority}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Registration Status
                          </span>

                          <strong>
                            {latestRegistration.status}
                          </strong>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* QUEUE INFORMATION */}

                  <div className="patient-info-line">
                    <AlertCircle size={17} />

                    These are Supabase-stored
                    demonstration registrations,
                    not hospital-issued queue tokens.
                    Actual queue positions and
                    consultation times are not yet
                    available.
                  </div>

                  <button
                    type="button"
                    className="patient-primary-btn"
                    onClick={() =>
                      changeTab("appointments")
                    }
                    style={{
                      marginTop: "18px",
                    }}
                  >
                    <Plus size={18} />
                    New OPD Registration
                    <ArrowRight size={17} />
                  </button>

                </>
              )}
            </section>
          )}

          {/* ==================================
              MEDICAL HISTORY TAB
          ================================== */}

          {activeTab === "history" && (
            <section className="patient-section-page">
              <div className="patient-page-heading">
                <span>
                  MEDICAL HISTORY
                </span>

                <h1>
                  Previous Visits
                </h1>

                <p>
                  Review your completed OPD
                  registrations.
                </p>
              </div>

              <section className="patient-card">
                <div className="patient-card-heading">
                  <div>
                    <h2>
                      Completed OPD Records
                    </h2>

                    <p>
                      Completed registrations
                      from Supabase
                    </p>
                  </div>
                </div>

                <div className="patient-table-wrap">
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Department</th>
                        <th>Registration ID</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {completedVisits.map((visit) => (
                        <tr key={visit.id}>
                          <td>
                            {formatRegistrationDate(
                              visit.registeredAt
                            )}
                          </td>

                          <td>
                            {visit.department}
                          </td>

                          <td>
                            {visit.id}
                          </td>

                          <td>
                            <span className="patient-completed-pill">
                              <CheckCircle2 size={14} />
                              {visit.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {completedVisits.length === 0 && (
                    <p style={{ padding: "16px" }}>
                      No completed visits yet.
                    </p>
                  )}
                </div>
              </section>
            </section>
          )}

          {/* ==================================
              PROFILE TAB
          ================================== */}

          {activeTab === "profile" && (
            <section className="patient-section-page">
              <div className="patient-page-heading">
                <span>
                  MY PROFILE
                </span>

                <h1>
                  Patient Profile
                </h1>

                <p>
                  Your account information
                  and healthcare preferences.
                </p>
              </div>

              <div className="patient-card patient-profile-card">
                <div className="patient-profile-avatar">
                  <UserRound size={36} />
                </div>

                <h2>
                  {accountName}
                </h2>

                <p>
                  {accountEmail || "Patient account"}
                  {" · "}
                  Demonstration mode
                </p>

                <div className="patient-profile-info">

                  <div>
                    <span>
                      Account Type
                    </span>

                    <strong>
                      Patient
                    </strong>
                  </div>

                  <div>
                    <span>
                      Platform
                    </span>

                    <strong>
                      MEDIQ
                    </strong>
                  </div>

                  <div>
                    <span>
                      Saved Registrations
                    </span>

                    <strong>
                      {registrations.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Security
                    </span>

                    <strong>
                      <ShieldCheck size={16} />
                      Supabase authenticated
                    </strong>
                  </div>

                </div>
              </div>
            </section>
          )}

        </main>

        {/* ======================================
            FOOTER
        ====================================== */}

        <footer className="patient-footer">
          <span>
            © 2026 MEDIQ Healthcare Platform
          </span>

          <span>
            <Stethoscope size={15} />
            Demo Environment
          </span>
        </footer>

      </div>
    </div>
  );
}
