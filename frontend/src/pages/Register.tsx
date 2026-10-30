import MedicalHeart3D from "../components/MedicalHeart3D";

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../Auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const fullName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: "https://mediq-beige-omega.vercel.app/login",
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError(
          "Unable to create your account. Please try again."
        );
        return;
      }

      // New users are assigned the patient role
      // by the mediq_new_user_profile database trigger.
      // Client-provided metadata is not used to grant roles.

      if (!data.session) {
        setSuccess(
          "Registration submitted successfully! " +
          "Please check your email and click the " +
          "verification link before signing in."
        );
      } else {
        // Handles projects where email confirmation
        // is not required.
        await supabase.auth.signOut();

        setSuccess(
          "Your patient account has been created! " +
          "You can now sign in."
        );
      }

      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error(
        "MEDIQ registration error:",
        err
      );

      setError(
        "Something went wrong while creating " +
        "your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-register-page">
      <div className="auth-panel">
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">
            <Activity size={23} />
          </span>

          MEDIQ
          <span className="auth-logo-dot">.</span>
        </Link>

        <div className="auth-form-area">
          <Link to="/" className="auth-back">
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="auth-heading">
            <span className="auth-kicker">
              JOIN MEDIQ
            </span>

            <h1>
              Better care <span>starts here.</span>
            </h1>

            <p>
              Create your patient profile to get started.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleRegister}
          >
            <label
              className="auth-label"
              htmlFor="register-name"
            >
              Full name
            </label>

            <div className="auth-input-wrap">
              <UserRound size={18} />

              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                autoComplete="name"
                required
                disabled={loading}
              />
            </div>

            <label
              className="auth-label"
              htmlFor="register-email"
            >
              Email address
            </label>

            <div className="auth-input-wrap">
              <Mail size={18} />

              <input
                id="register-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <label
              className="auth-label"
              htmlFor="register-password"
            >
              Password
            </label>

            <div className="auth-input-wrap">
              <LockKeyhole size={18} />

              <input
                id="register-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="auth-eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            <label
              className="auth-label"
              htmlFor="register-confirm"
            >
              Confirm password
            </label>

            <div className="auth-input-wrap">
              <LockKeyhole size={18} />

              <input
                id="register-confirm"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p
                className="auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {success && (
              <div
                role="status"
                style={{
                  padding: "14px 16px",
                  marginBottom: "14px",
                  borderRadius: "10px",
                  background: "#e6f8f2",
                  color: "#087f65",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: 1.7,
                }}
              >
                {success}

                <div style={{ marginTop: "10px" }}>
                  <Link
                    to="/login"
                    style={{
                      color: "#087f65",
                      fontWeight: 800,
                      textDecoration: "underline",
                    }}
                  >
                    Go to Sign In
                  </Link>
                </div>
              </div>
            )}

            <div className="auth-note">
              <ShieldCheck size={16} />

              <span>
                Account registration powered by
                Supabase Authentication.
                Please use fictional patient
                information while testing MEDIQ.
              </span>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading || Boolean(success)}
            >
              {loading
                ? "Creating Account..."
                : success
                  ? "Account Submitted"
                  : "Create Patient Account"}

              {!loading && !success && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-showcase">
        <div className="auth-showcase-top">
          <span className="auth-showcase-pill">
            <HeartPulse size={16} />
            PATIENT EXPERIENCE
          </span>
        </div>

        <div className="auth-showcase-content">
          <div className="mediq-register-heart"><MedicalHeart3D /></div>
          <div className="auth-showcase-icon">
            <HeartPulse
              size={45}
              strokeWidth={1.6}
            />
          </div>

          <h2>
            Your health journey.
            <br />
            Simplified.
          </h2>

          <p>
            A convenient way to register visits,
            follow queue progress, and stay informed
            throughout your hospital visit.
          </p>

          <div className="auth-showcase-stats">
            <div>
              <strong>01</strong>
              <span>Sign Up</span>
            </div>

            <div>
              <strong>02</strong>
              <span>Get Token</span>
            </div>

            <div>
              <strong>03</strong>
              <span>Track Queue</span>
            </div>
          </div>
        </div>

        <p className="auth-showcase-footer">
          MEDIQ Â· Designed for Better Patient Experiences
        </p>
      </div>
    </div>
  );
}


