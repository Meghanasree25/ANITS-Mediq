import {
  Activity,
  ArrowRight,
  HeartPulse,
  ShieldCheck,
  Clock3,
  Stethoscope,
  Users,
  CheckCircle2,
} from "lucide-react";

import "./App.css";

function Landing() {
  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          <span>
            MEDIQ<span className="brand-dot">.</span>
          </span>
        </div>

        <nav className="nav-links">
          <a href="/#home">Home</a>
          <a href="/#features">Features</a>
          <a href="/#how-it-works">How It Works</a>
          <a href="/#about">About</a>
        </nav>

        <div className="nav-actions">
          <a className="login-link" href="/login">
            Log In
          </a>
          <a className="nav-button" href="/register">
            Get Started <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="pulse-dot"></span>
              SMARTER HOSPITAL OPERATIONS
            </div>

            <h1>
              Better Care.
              <br />
              <span>Smarter Queues.</span>
              <br />
              Healthier Tomorrow.
            </h1>

            <p className="hero-description">
              Meet MEDIQ — a smart OPD triage and queue management
              platform that helps hospitals organize patient visits,
              identify urgent cases for clinical review, and improve
              care coordination.
            </p>

            <div className="hero-buttons">
              <a href="/register" className="primary-btn">
                Get Started <ArrowRight size={19} />
              </a>

              <a href="#how-it-works" className="secondary-btn">
                See How It Works
              </a>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <CheckCircle2 size={17} />
                Smart Queue Tracking
              </div>

              <div className="trust-item">
                <CheckCircle2 size={17} />
                Clinical Review Support
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-brand">
                  <Activity size={19} />
                  MEDIQ Dashboard
                </div>

                <span className="live-pill">
                  <span></span>
                  DEMO LIVE
                </span>
              </div>

              <div className="preview-title">
                Hospital Overview
              </div>

              <div className="preview-subtitle">
                Patient queue at a glance
              </div>

              <div className="preview-stats">
                <div className="stat-card">
                  <Users size={19} color="#2474d4" />
                  <strong>128</strong>
                  <span>Total Patients</span>
                </div>

                <div className="stat-card">
                  <Clock3 size={19} color="#d99525" />
                  <strong>42</strong>
                  <span>Waiting</span>
                </div>

                <div className="stat-card">
                  <HeartPulse size={19} color="#0d9f95" />
                  <strong>18</strong>
                  <span>In Consultation</span>
                </div>
              </div>

              <div className="queue-heading">
                Patient Queue
                <span>View all →</span>
              </div>

              <div className="queue-row">
                <span className="token">#OPD-1042</span>
                <span>Ananya Rao</span>
                <span className="priority high">High</span>
              </div>

              <div className="queue-row">
                <span className="token">#OPD-1043</span>
                <span>Rahul Kumar</span>
                <span className="priority normal">Normal</span>
              </div>

              <div className="queue-row">
                <span className="token">#OPD-1044</span>
                <span>Priya Sharma</span>
                <span className="priority medium">Medium</span>
              </div>
            </div>

            <div className="floating-card">
              <ShieldCheck size={22} />
              <div>
                <strong>Priority Review</strong>
                <span>Urgent cases highlighted</span>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-tag">WHY MEDIQ?</div>

          <h2>
            Everything your hospital needs.
            <br />
            <span>One intelligent platform.</span>
          </h2>

          <p className="section-description">
            Built to simplify everyday hospital operations and
            make patient journeys more organized.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blue">
                <Users />
              </div>
              <h3>Patient Management</h3>
              <p>
                Organize patient registrations, visit details,
                and appointments in one streamlined interface.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon teal">
                <Clock3 />
              </div>
              <h3>Smart Queue System</h3>
              <p>
                Track patient tokens and queue progress with
                clear, easy-to-understand status updates.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon red">
                <HeartPulse />
              </div>
              <h3>Urgency Flagging</h3>
              <p>
                Highlight potential warning signs so qualified
                hospital staff can review cases promptly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon purple">
                <Stethoscope />
              </div>
              <h3>Doctor Dashboard</h3>
              <p>
                Give doctors a focused view of waiting patients,
                clinical review information, and consultations.
              </p>
            </div>
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-tag">HOW IT WORKS</div>

          <h2>From registration to consultation.</h2>

          <div className="steps-grid">
            <div className="step">
              <span>01</span>
              <h3>Register</h3>
              <p>Patients enter their visit details and symptoms.</p>
            </div>

            <div className="step">
              <span>02</span>
              <h3>Review</h3>
              <p>
                Nurses review intake information and urgency flags.
              </p>
            </div>

            <div className="step">
              <span>03</span>
              <h3>Queue</h3>
              <p>
                Patients receive a token and queue status.
              </p>
            </div>

            <div className="step">
              <span>04</span>
              <h3>Consult</h3>
              <p>Doctors call and attend to patients.</p>
            </div>
          </div>
        </section>
      </main>

      <footer id="about">
        © 2026 MEDIQ. Smart Healthcare Queue Management System.
      </footer>
    </div>
  );
}

export default Landing;