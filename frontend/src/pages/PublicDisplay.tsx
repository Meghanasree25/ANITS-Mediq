
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Info,
  Maximize,
  Minimize,
  Radio,
  RefreshCw,
  Stethoscope,
  Users,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import "../PublicDisplay.css";

/* ==========================================
   TYPES
========================================== */

type Priority = "Routine" | "Urgent";

type Status =
  | "Waiting"
  | "In Consultation"
  | "Completed";

type PublicQueuePatient = {
  queueToken: string;
  department: string;
  priority: Priority;
  status: Status;
  registeredAt: string;
};

/* ==========================================
   HELPERS
========================================== */

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function sortQueue(
  patients: PublicQueuePatient[]
): PublicQueuePatient[] {
  return [...patients].sort((a, b) => {
    const priorityOrder: Record<Priority, number> = {
      Urgent: 0,
      Routine: 1,
    };

    return (
      priorityOrder[a.priority] -
        priorityOrder[b.priority] ||
      new Date(a.registeredAt).getTime() -
        new Date(b.registeredAt).getTime()
    );
  });
}

/* ==========================================
   PUBLIC DISPLAY
========================================== */

export default function PublicDisplay() {
  const [patients, setPatients] = useState<
    PublicQueuePatient[]
  >([]);

  const [now, setNow] = useState(new Date());

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  /* ==========================================
     FETCH PUBLIC-SAFE QUEUE FROM SUPABASE
  ========================================== */

  const refreshQueue = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc(
        "get_mediq_public_queue"
      );

      if (error) {
        throw error;
      }

      const records: PublicQueuePatient[] = (
        data ?? []
      ).map((row: {
        queue_token: string;
        department: string;
        priority: string;
        status: string;
        registered_at: string;
      }) => ({
        queueToken: row.queue_token,
        department: row.department || "General OPD",
        priority: row.priority as Priority,
        status: row.status as Status,
        registeredAt: row.registered_at,
      }));

      setPatients(records);
      setLoadError("");
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Public queue fetch error:",
        error
      );

      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load the public queue."
      );
    } finally {
      setLoading(false);
      setNow(new Date());
    }
  }, []);

  /* ==========================================
     AUTOMATIC REFRESH
  ========================================== */

  useEffect(() => {
    void refreshQueue();

    // Keep the clock updating every second.
    const clockTimer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    // Fetch the queue every 5 seconds.
    const queueTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshQueue();
      }
    }, 5000);

    const handleFocus = () => {
      void refreshQueue();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshQueue();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(queueTimer);

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [refreshQueue]);

  /* ==========================================
     QUEUE DATA
  ========================================== */

  const reviewedPatients = patients;

  const activePatients = useMemo(
    () =>
      reviewedPatients.filter(
        (patient) =>
          patient.status === "In Consultation"
      ),
    [reviewedPatients]
  );

  const waitingPatients = useMemo(
    () =>
      sortQueue(
        reviewedPatients.filter(
          (patient) =>
            patient.status === "Waiting"
        )
      ),
    [reviewedPatients]
  );

  const completedCount = reviewedPatients.filter(
    (patient) =>
      patient.status === "Completed"
  ).length;

  const nowServing =
    [...activePatients].sort(
      (a, b) =>
        new Date(a.registeredAt).getTime() -
        new Date(b.registeredAt).getTime()
    )[0] ?? null;

  const upNext = waitingPatients.slice(0, 5);

  /* ==========================================
     FULLSCREEN
  ========================================== */

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error(
        "Fullscreen request failed:",
        error
      );
    }
  }

  /* ==========================================
     UI
  ========================================== */

  return (
    <div className="public-display">

      {/* TOP HEADER */}

      <header className="public-header">
        <div className="public-brand">
          <div className="public-brand-icon">
            <Activity
              size={28}
              strokeWidth={2.7}
            />
          </div>

          <div>
            <h1>
              MEDIQ<span>.</span>
            </h1>

            <p>
              HOSPITAL QUEUE MANAGEMENT
            </p>
          </div>
        </div>

        <div className="public-header-center">
          <span className="public-live-indicator">
            <span className="public-live-dot" />
            DEMO QUEUE DISPLAY
          </span>
        </div>

        <div className="public-header-actions">
          <div className="public-clock">
            <Clock3 size={18} />
            <span>
              {formatTime(now)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void refreshQueue()}
            title="Refresh queue"
            aria-label="Refresh queue"
          >
            <RefreshCw size={19} />
          </button>

          <button
            type="button"
            onClick={() =>
              void toggleFullscreen()
            }
            title="Toggle fullscreen"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize size={19} />
            ) : (
              <Maximize size={19} />
            )}
          </button>

          <Link
            to="/"
            title="Return to home"
          >
            <ArrowLeft size={19} />
          </Link>
        </div>
      </header>

      {/* MAIN QUEUE */}

      <main className="public-main">
        <div className="public-heading">
          <div>
            <span className="public-section-label">
              <HeartPulse size={16} />
              OPD PATIENT QUEUE
            </span>

            <h2>
              Patient Calling Display
            </h2>

            <p>
              Please check your registration
              token and wait for your
              consultation turn.
            </p>
          </div>

          <div className="public-date">
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* LOAD ERROR */}

        {loadError && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              marginBottom: "20px",
              borderRadius: "12px",
              background: "#FFF1F2",
              color: "#9F1239",
            }}
          >
            <AlertCircle size={20} />

            <span>
              {loadError}
            </span>
          </div>
        )}

        <div className="public-main-grid">

          {/* NOW SERVING */}

          <section className="public-now-serving">
            <div className="public-card-top">
              <div className="public-now-label">
                <Radio size={23} />
                <span>
                  NOW SERVING
                </span>
              </div>

              <span className="public-serving-tag">
                CONSULTATION
              </span>
            </div>

            {nowServing ? (
              <div className="public-serving-content">
                <span className="public-token-caption">
                  CURRENT PATIENT TOKEN
                </span>

                <div className="public-big-token">
                  {nowServing.queueToken}
                </div>

                <div className="public-serving-divider" />

                <div className="public-serving-department">
                  <Stethoscope size={23} />

                  <div>
                    <span>
                      DEPARTMENT
                    </span>

                    <strong>
                      {nowServing.department}
                    </strong>
                  </div>
                </div>

                <div className="public-serving-status">
                  <span className="public-pulse-dot" />
                  In Consultation
                </div>
              </div>
            ) : (
              <div className="public-no-serving">
                <div className="public-no-serving-icon">
                  <Stethoscope size={45} />
                </div>

                <h3>
                  {loading
                    ? "Loading Queue..."
                    : loadError
                    ? "Queue Unavailable"
                    : "No Active Consultation"}
                </h3>

                <p>
                  {loadError
                    ? "Unable to retrieve the latest queue."
                    : "The next patient token will appear here when the doctor starts a consultation."}
                </p>
              </div>
            )}

            <div className="public-serving-footer">
              <Info size={18} />

              Please proceed only when
              your token is called.
            </div>
          </section>

          {/* UPCOMING QUEUE */}

          <section className="public-upcoming">
            <div className="public-upcoming-header">
              <div>
                <span>
                  WAITING QUEUE
                </span>

                <h3>
                  Up Next
                </h3>
              </div>

              <div className="public-queue-count">
                {waitingPatients.length} Waiting
              </div>
            </div>

            <div className="public-upcoming-list">
              {upNext.length === 0 ? (
                <div className="public-upcoming-empty">
                  <CheckCircle2 size={38} />

                  <h4>
                    {loading
                      ? "Loading Tokens..."
                      : loadError
                      ? "Queue Unavailable"
                      : "No Waiting Tokens"}
                  </h4>

                  <p>
                    Nurse-reviewed waiting
                    patients will appear here.
                  </p>
                </div>
              ) : (
                upNext.map((patient, index) => (
                  <div
                    key={patient.queueToken}
                    className={`public-queue-item ${
                      index === 0 ? "next" : ""
                    }`}
                  >
                    <div className="public-queue-position">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="public-queue-patient">
                      <strong>
                        {patient.queueToken}
                      </strong>

                      <span>
                        {patient.department}
                      </span>
                    </div>

                    <span className="public-queue-badge">
                      {index === 0
                        ? "NEXT"
                        : "WAITING"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="public-upcoming-footer">
              <Clock3 size={17} />

              Queue order is based on
              demo priority and registration time.
            </div>
          </section>
        </div>

        {/* BOTTOM STATISTICS */}

        <section className="public-stats">

          <div className="public-stat">
            <div className="public-stat-icon">
              <Users size={25} />
            </div>

            <div>
              <span>
                WAITING PATIENTS
              </span>

              <strong>
                {waitingPatients.length}
              </strong>
            </div>
          </div>

          <div className="public-stat">
            <div className="public-stat-icon">
              <Stethoscope size={25} />
            </div>

            <div>
              <span>
                IN CONSULTATION
              </span>

              <strong>
                {activePatients.length}
              </strong>
            </div>
          </div>

          <div className="public-stat">
            <div className="public-stat-icon">
              <CheckCircle2 size={25} />
            </div>

            <div>
              <span>
                COMPLETED
              </span>

              <strong>
                {completedCount}
              </strong>
            </div>
          </div>
        </section>

        {/* INFORMATION STRIP */}

        <div className="public-information">
          <Info size={20} />

          <span>
            Please keep your registration
            token ready. Tokens are displayed
            instead of patient names to
            protect privacy.
          </span>
        </div>

        {lastUpdated && (
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              opacity: 0.65,
              marginTop: "12px",
            }}
          >
            Last updated:{" "}
            {formatTime(lastUpdated)}
          </p>
        )}
      </main>

      {/* FOOTER */}

      <footer className="public-footer">
        <span>
          © 2026 MEDIQ — Smart OPD Queue Management
        </span>

        <span>
          Demonstration Display • Updates every 5 seconds
        </span>
      </footer>
    </div>
  );
}
